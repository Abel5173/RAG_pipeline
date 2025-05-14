import React from "react";

const LoadingSpinner: React.FC<{ small?: boolean }> = ({ small = false }) => {
  const size = small ? "h-5 w-5" : "h-8 w-8";
  return (
    <div
      className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-blue-500`}
    ></div>
  );
};

export default LoadingSpinner;
