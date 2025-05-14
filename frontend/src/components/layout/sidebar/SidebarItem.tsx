import React from "react";
import { Link, useLocation } from "react-router-dom";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  link: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isOpen,
  link,
}) => {
  const location = useLocation();
  const isActive = location.pathname === link;

  return (
    <Link
      to={link}
      className={`flex items-center p-4 text-gray-400 hover:bg-gray-700 hover:text-white ${
        isActive ? "bg-gray-700 text-white" : ""
      }`}
    >
      <div className="h-6 w-6">{icon}</div>
      {isOpen && <span className="ml-4">{label}</span>}
    </Link>
  );
};

export default SidebarItem;
