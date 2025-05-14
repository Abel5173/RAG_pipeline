/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [order] = useState<"asc" | "desc">("asc");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const response = await axios.get("http://localhost:8000/api/v1/users", {
          params: { search, page, limit, order },
        });
        setUsers(response.data.data); // Assuming the API returns { data: [...] }
      } catch (err: unknown) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [search, page, limit, order]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
  };

  const handleDelete = async (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:8000/api/v1/users/${userId}`);
        toast.success("User deleted successfully!");
        setUsers(users.filter((user) => user.id !== userId));
      } catch (err) {
        toast.error("Failed to delete user.");
      }
    }
  };

  const handleSave = async () => {
    if (selectedUser) {
      try {
        await axios.put(
          `http://localhost:8000/api/v1/users/${selectedUser.id}`,
          selectedUser
        );
        toast.success("User updated successfully!");
        setUsers(
          users.map((user) =>
            user.id === selectedUser.id ? selectedUser : user
          )
        );
        setSelectedUser(null);
      } catch (err) {
        toast.error("Failed to update user.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">
            Failed to load users.
          </h1>
          <p className="text-gray-700">Please try again later.</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-500">No users found.</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded w-full"
        />
      </div>

      {/* Users Table */}
      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr>
            <th className="p-4 text-left">Name</th>
            <th className="p-4 text-left">Email</th>
            <th className="p-4 text-left">Role</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-left">Created Date</th>
            <th className="p-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: User) => (
            <tr key={user.id} className="border-t">
              <td className="p-4">{user.name}</td>
              <td className="p-4">{user.email}</td>
              <td className="p-4">{user.role}</td>
              <td className="p-4">{user.status}</td>
              <td className="p-4">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="p-4">
                <button
                  onClick={() => handleEdit(user)}
                  className="text-blue-500 hover:underline mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="p-2 bg-gray-200 rounded"
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.ceil(users.length / limit)}
        </span>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page === Math.ceil(users.length / limit)}
          className="p-2 bg-gray-200 rounded"
        >
          Next
        </button>
      </div>

      {/* Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Edit User</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Name</label>
              <input
                type="text"
                value={selectedUser.name}
                onChange={(e) =>
                  setSelectedUser({ ...selectedUser, name: e.target.value })
                }
                className="p-2 border rounded w-full"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                value={selectedUser.email}
                onChange={(e) =>
                  setSelectedUser({ ...selectedUser, email: e.target.value })
                }
                className="p-2 border rounded w-full"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Role</label>
              <select
                value={selectedUser.role}
                onChange={(e) =>
                  setSelectedUser({ ...selectedUser, role: e.target.value })
                }
                className="p-2 border rounded w-full"
              >
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Status</label>
              <select
                value={selectedUser.status}
                onChange={(e) =>
                  setSelectedUser({ ...selectedUser, status: e.target.value })
                }
                className="p-2 border rounded w-full"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-gray-200 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="p-2 bg-blue-500 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
