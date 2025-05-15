import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextProps {
  isAuthenticated: boolean;
  role: string | null; // Add role to the context
  login: (token: string, role: string) => void; // Accept role during login
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null); // State to store the user's role
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedRole = localStorage.getItem("userRole"); // Retrieve the role from localStorage
    setIsAuthenticated(!!token);
    setRole(storedRole);
  }, []);

  const login = (token: string, role: string) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userRole", role); // Store the role in localStorage
    setIsAuthenticated(true);
    setRole(role);
    navigate("/"); // Redirect to the dashboard after login
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole"); // Remove the role from localStorage
    setIsAuthenticated(false);
    setRole(null);
    navigate("/login"); // Redirect to the login page after logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
