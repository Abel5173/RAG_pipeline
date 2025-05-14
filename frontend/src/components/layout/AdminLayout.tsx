import React from "react";
import Sidebar from "./sidebar/Sidebar";
import Topbar from "./sidebar/Topbar";
import MainContent from "./sidebar/MainContent";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <Topbar />

        {/* Main Content */}
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
};

export default AdminLayout;
