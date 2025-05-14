import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SidebarItem from "./SidebarItem";
import UserProfile from "./UserProfile";

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <motion.div
      className="h-screen bg-gray-800 text-white shadow-lg flex flex-col"
      initial={{ width: isOpen ? "16rem" : "5rem" }}
      animate={{ width: isOpen ? "16rem" : "5rem" }}
      transition={{ duration: 0.3 }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {isOpen && <h1 className="text-xl font-bold">Admin</h1>}
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white focus:outline-none"
          aria-label="Toggle Sidebar"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronLeft className="h-6 w-6" />
          ) : (
            <ChevronRight className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar Items */}
      <nav className="mt-4 flex-1 overflow-hidden">
        <SidebarItem icon={<Home />} label="Home" isOpen={isOpen} link="/" />
        <SidebarItem
          icon={<FileText />}
          label="Documents"
          isOpen={isOpen}
          link="/documents"
        />
        <SidebarItem
          icon={<Settings />}
          label="Settings"
          isOpen={isOpen}
          link="/settings"
        />
      </nav>

      {/* User Profile */}
      <UserProfile isOpen={isOpen} />
    </motion.div>
  );
};

export default Sidebar;
