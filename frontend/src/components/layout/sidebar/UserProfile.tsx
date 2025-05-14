import React from "react";

interface UserProfileProps {
  isOpen: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen }) => {
  return (
    <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-gray-500"></div>
        {isOpen && (
          <div className="ml-4">
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
