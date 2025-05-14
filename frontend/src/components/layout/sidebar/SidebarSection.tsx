import React from "react";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children }) => {
  return (
    <div className="mt-6">
      {title && (
        <h2 className="px-4 text-sm font-semibold text-gray-500 uppercase">
          {title}
        </h2>
      )}
      <div>{children}</div>
    </div>
  );
};

export default SidebarSection;
