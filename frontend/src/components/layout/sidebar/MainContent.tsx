import React from "react";

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return <div className="flex-1 bg-gray-100 overflow-auto p-8">{children}</div>;
};

export default MainContent;
