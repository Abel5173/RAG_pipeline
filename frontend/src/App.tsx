import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <Routes>
      {/* Public pages: no AdminLayout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected/admin pages: use AdminLayout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/documents"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "staff"]}>
                        <h1>Documents Page</h1>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "staff"]}>
                        <h1>Settings Page</h1>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </ErrorBoundary>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
