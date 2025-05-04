from sqlalchemy.orm import Session
from typing import Optional, List, Tuple
import os

# Langchain components
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.docstore.document import Document as LangchainDocument # Avoid name clash

# Corrected import: Use db_core for models and SessionLocal
from ..core import database as db_core
from ..models import schemas # Schemas are still in models directory
from ..core.config import settings
from .document_service import extract_text_from_file, update_document_status, get_document # Import necessary functions

# --- RAG Pipeline Components Initialization ---

# 1. Embedding Model (Nomic Embed Text v1 via HuggingFace)
embedding_model_name = "nomic-ai/nomic-embed-text-v1"
embedding_encode_kwargs = {		'normalize_embeddings'		: True }
embeddings = HuggingFaceEmbeddings(
    model_name=embedding_model_name,
    model_kwargs={		'device'		: 		'cpu'		, 		'trust_remote_code'		: True }, # Trust remote code for Nomic
    encode_kwargs=embedding_encode_kwargs
)

# 2. LLM (Mistral-7B via Ollama)
llm = Ollama(model="mistral") # Uses default localhost:11434

# 3. Vector Store (FAISS)
vector_store_path = os.path.join(settings.VECTOR_STORE_DIR, "faiss_index")
vector_store: Optional[FAISS] = None

def load_vector_store() -> Optional[FAISS]:
    """Loads the FAISS vector store from the local path."""
    global vector_store
    if vector_store is None:
        if os.path.exists(vector_store_path):
            try:
                print(f"Loading existing FAISS index from {vector_store_path}")
                vector_store = FAISS.load_local(vector_store_path, embeddings, allow_dangerous_deserialization=True)
                print("FAISS index loaded successfully.")
            except Exception as e:
                print(f"Error loading FAISS index: {e}. Will create a new one if documents are added.")
                vector_store = None
        else:
            print(f"FAISS index not found at {vector_store_path}. It will be created when documents are processed.")
            vector_store = None
    return vector_store

load_vector_store()

# 4. Text Splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, # As per requirements
    chunk_overlap=150 # Common practice overlap
)

# --- RAG Processing Functions ---

def process_and_embed_document(doc_id: int):
    """Background task to extract text, chunk, embed, and add a document to the vector store."""
    global vector_store
    # Create a new database session for this background task
    db = next(db_core.get_db())
    try:
        doc_record = get_document(db, doc_id)
        if not doc_record:
            print(f"Error: Document with ID {doc_id} not found in database.")
            return

        print(f"Processing document: {doc_record.original_filename} (ID: {doc_record.id})")
        update_document_status(db, doc_record.id, "processing")

        # 1. Extract Text
        print("Extracting text...")
        text = extract_text_from_file(doc_record.filepath)
        if not text:
            raise ValueError("Extracted text is empty.")
        print(f"Text extracted (length: {len(text)} characters).")

        # 2. Chunk Text
        print("Chunking text...")
        chunks = text_splitter.split_text(text)
        if not chunks:
            raise ValueError("Text chunking resulted in no chunks.")
        print(f"Text split into {len(chunks)} chunks.")

        langchain_docs = [
            LangchainDocument(
                page_content=chunk,
                metadata={
                    "source": doc_record.original_filename,
                    "doc_id": doc_record.id,
                }
            )
            for chunk in chunks
        ]

        # 3. Embed and Store
        print("Embedding chunks and updating vector store...")
        if vector_store is None:
            print("Creating new FAISS index.")
            os.makedirs(settings.VECTOR_STORE_DIR, exist_ok=True)
            vector_store = FAISS.from_documents(langchain_docs, embeddings)
            vector_store.save_local(vector_store_path)
            print(f"New FAISS index created and saved to {vector_store_path}.")
        else:
            vector_store.add_documents(langchain_docs)
            vector_store.save_local(vector_store_path) # Save updated index
            print(f"Added {len(langchain_docs)} chunks to existing FAISS index. Index saved.")

        update_document_status(db, doc_record.id, "embedded")
        print(f"Document {doc_record.original_filename} processed and embedded successfully.")

    except Exception as e:
        print(f"Error processing document {doc_id}: {e}")
        update_document_status(db, doc_id, "error")
    finally:
        db.close() # Ensure the session is closed

def process_query_with_rag(query_text: str) -> Tuple[str, str]:
    """Processes a query using the RAG pipeline.
    Returns: (response_text, source_references_string)
    """
    global vector_store
    if vector_store is None:
        load_vector_store()
        if vector_store is None:
            return "Vector store not initialized. Please upload and process documents first.", "N/A"

    try:
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True
        )

        print(f"Executing RAG query: {query_text}")
        result = qa_chain.invoke({"query": query_text})
        print("RAG query executed.")

        answer = result.get("result", "No answer generated.")
        source_docs = result.get("source_documents", [])

        sources_list = []
        if source_docs:
            for doc in source_docs:
                source = doc.metadata.get("source", "Unknown Source")
                sources_list.append(source)
        source_references = ", ".join(sorted(list(set(sources_list)))) or "No sources found"

        return answer, source_references

    except Exception as e:
        print(f"Error during RAG query processing: {e}")
        return f"An error occurred while processing your query: {e}", "N/A"

# --- Query Logging ---

def log_query(
    db: Session,
    user_id: int,
    query_text: str,
    response_text: Optional[str] = None,
    retrieved_context: Optional[str] = None,
    source_references: Optional[str] = None
) -> db_core.QueryLog:
    """Logs a query and its response details to the database."""
    db_log = db_core.QueryLog(
        user_id=user_id,
        query_text=query_text,
        response_text=response_text,
        retrieved_context=retrieved_context,
        source_references=source_references
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_user_query_history(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> list[db_core.QueryLog]:
    """Retrieves the query history for a specific user."""
    return db.query(db_core.QueryLog)\
             .filter(db_core.QueryLog.user_id == user_id)\
             .order_by(db_core.QueryLog.timestamp.desc())\
             .offset(skip)\
             .limit(limit)\
             .all()

def get_all_query_logs(
    db: Session,
    skip: int = 0,
    limit: int = 1000
) -> list[db_core.QueryLog]:
    """Retrieves all query logs (for admin dashboard)."""
    return db.query(db_core.QueryLog)\
             .order_by(db_core.QueryLog.timestamp.desc())\
             .offset(skip)\
             .limit(limit)\
             .all()

