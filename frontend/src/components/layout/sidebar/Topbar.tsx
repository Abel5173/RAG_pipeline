import React from "react";
import { useAuth } from "../../../context/AuthContext";

const Topbar: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="flex items-center justify-between bg-gray-100 p-4 shadow-md">
      <h1 className="text-lg font-bold">Dashboard</h1>
      <div className="flex items-center space-x-4">
        {/* Theme Switcher (Optional) */}
        <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m8.485-8.485h-1M4.515 12h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707"
            />
          </svg>
        </button>

        {/* User Avatar */}
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gray-500"></div>
          <button
            onClick={logout}
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
