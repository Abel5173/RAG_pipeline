import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextProps {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token); // Set to true only if a token exists
  }, []);

  const login = (token: string) => {
    localStorage.setItem("authToken", token);
    setIsAuthenticated(true);
    navigate("/"); // Redirect to the dashboard after login
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    navigate("/login"); // Redirect to the login page after logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
