// app.js - Main React Application

const { useState, useEffect, useCallback } = React;

// --- API Client (Helper) ---
const API_BASE_URL = "http://localhost:8000/api/v1"; // Assuming backend runs on port 8000

async function apiClient(endpoint, options = {}) {
    const { method = "GET", body = null, token = null } = options;
    const headers = {}; // Start with empty headers
    if (!(body instanceof FormData)) {
        // Only set Content-Type if not FormData
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        if (body instanceof FormData) {
            config.body = body;
        } else {
            config.body = JSON.stringify(body);
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            console.error("API Error:", response.status, errorData);
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        if (response.status === 204) {
            return null; // Handle No Content
        }
        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
            // Handle non-JSON responses if necessary, or return null/text
            return await response.text(); // Or handle as needed
        }
    } catch (error) {
        console.error("Fetch error:", error);
        throw error; // Re-throw to be caught by calling component
    }
}

// --- Authentication Hook/Context (Simplified) ---
function useAuth() {
    const [token, setToken] = useState(localStorage.getItem("authToken"));
    const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

    useEffect(() => {
        if (token) {
            localStorage.setItem("authToken", token);
            // **INSECURE**: Proper JWT decoding needed here to get role reliably
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const role = payload.role || (payload.sub.toLowerCase() === 'admin' ? 'admin' : 'staff'); // Extract role
                localStorage.setItem("userRole", role);
                setUserRole(role);
            } catch (e) {
                console.error("Failed to decode token or get role:", e);
                // Fallback or force logout if token is invalid
                logout();
            }
        } else {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userRole");
            setUserRole(null);
        }
    }, [token]);

    const login = async (username, password) => {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/token`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: "Login failed" }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setToken(data.access_token); // This triggers the useEffect above
            return true;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const logout = () => {
        setToken(null);
    };

    return { token, userRole, login, logout };
}

// --- UI Components ---

function LoadingSpinner({ small = false }) {
    const size = small ? "h-5 w-5" : "h-8 w-8";
    return (
        <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-blue-500`}></div>
    );
}

function ErrorMessage({ message }) {
    if (!message) return null;
    return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{message}</span>
        </div>
    );
}

function SuccessMessage({ message }) {
    if (!message) return null;
    return (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{message}</span>
        </div>
    );
}

// --- Login Component ---
function LoginForm({ onLoginSuccess }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(username, password);
            onLoginSuccess();
        } catch (err) {
            setError(err.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
            <ErrorMessage message={error} />
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Username</label>
                <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="username" type="text" placeholder="Username"
                    value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading}
                />
            </div>
            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                    id="password" type="password" placeholder="******************"
                    value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}
                />
            </div>
            <div className="flex items-center justify-center">
                <button
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full flex justify-center items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    type="button" onClick={handleSubmit} disabled={loading}
                >
                    {loading ? <LoadingSpinner small={true} /> : 'Sign In'}
                </button>
            </div>
        </div>
    );
}

// --- Admin Components ---

function DocumentUploadForm({ token, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setError(null);
        setSuccess(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file to upload.");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await apiClient("/documents/upload", { method: "POST", body: formData, token });
            setSuccess(`File '${result.original_filename}' uploaded successfully!`);
            setFile(null); // Clear file input
            document.getElementById('file-input').value = null; // Reset file input visually
            if (onUploadSuccess) onUploadSuccess(); // Notify parent to refresh list
        } catch (err) {
            setError(err.message || "File upload failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-6 p-4 border rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-2">Upload Document</h3>
            <ErrorMessage message={error} />
            <SuccessMessage message={success} />
            <div className="flex items-center space-x-2">
                <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    disabled={loading}
                />
                <button
                    onClick={handleUpload}
                    disabled={loading || !file}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? <LoadingSpinner small={true} /> : "Upload"}
                </button>
            </div>
        </div>
    );
}

function DocumentList({ token, refreshTrigger, onRefreshComplete }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient("/documents/", { token });
            setDocuments(data || []);
        } catch (err) {
            setError(err.message || "Failed to fetch documents.");
            setDocuments([]);
        } finally {
            setLoading(false);
            if (onRefreshComplete) onRefreshComplete();
        }
    }, [token, onRefreshComplete]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments, refreshTrigger]); // Refetch when token changes or refresh is triggered

    const handleDelete = async (docId) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        // Consider adding visual feedback for deletion in progress
        try {
            await apiClient(`/documents/${docId}`, { method: "DELETE", token });
            // Refresh list after successful deletion
            fetchDocuments();
        } catch (err) {
            alert(`Failed to delete document: ${err.message}`); // Simple alert for now
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Uploaded Documents</h3>
            <ErrorMessage message={error} />
            {loading ? (
                <div className="flex justify-center p-4"><LoadingSpinner /></div>
            ) : documents.length === 0 ? (
                <p className="text-gray-500">No documents uploaded yet.</p>
            ) : (
                <ul className="space-y-2">
                    {documents.map(doc => (
                        <li key={doc.id} className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                            <div>
                                <span className="font-medium">{doc.original_filename}</span>
                                <span className={`text-sm ml-2 px-2 py-0.5 rounded ${doc.status === 'embedded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {doc.status}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">({new Date(doc.uploaded_at).toLocaleString()})</span>
                            </div>
                            <button
                                onClick={() => handleDelete(doc.id)}
                                className="bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function AdminDashboard({ token, onLogout }) {
    const [refreshKey, setRefreshKey] = useState(0); // State to trigger list refresh

    const handleUploadSuccess = () => {
        setRefreshKey(prevKey => prevKey + 1); // Increment key to trigger refresh
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                 <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                 <button onClick={onLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Logout</button>
            </div>
            <DocumentUploadForm token={token} onUploadSuccess={handleUploadSuccess} />
            <DocumentList token={token} refreshTrigger={refreshKey} />
            {/* TODO: Add Usage Logs/Monitoring Section */}
        </div>
    );
}

// --- Staff Components ---

function StaffInterface({ token, onLogout }) {
    // TODO: Implement Staff features: Q&A Interface, Query History
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState([]); // { type: 'user'/'system', text: '', sources: '' }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleQuerySubmit = async () => {
        if (!query.trim()) return;
        
        const userMessage = { type: 'user', text: query };
        setMessages(prev => [...prev, userMessage]);
        setQuery("");
        setLoading(true);
        setError(null);

        try {
            const response = await apiClient("/qa/query", {
                method: "POST",
                body: { query_text: query },
                token
            });
            const systemMessage = {
                type: 'system',
                text: response.response_text,
                sources: response.source_references
            };
            setMessages(prev => [...prev, systemMessage]);
        } catch (err) {
            setError(err.message || "Failed to get answer.");
            // Optionally add an error message to the chat
             const errorMessage = {
                type: 'system',
                text: `Error: ${err.message || "Failed to get answer."}`,
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 flex flex-col h-screen">
             <div className="flex justify-between items-center mb-4 pb-4 border-b">
                 <h1 className="text-2xl font-bold">Q&A Interface</h1>
                 <button onClick={onLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Logout</button>
            </div>
            
            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto mb-4 p-4 bg-white rounded shadow space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div classN
(Content truncated due to size limit. Use line ranges to read in chunks)