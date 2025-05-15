import React from "react";
import { motion } from "framer-motion";

interface AuthContainerProps {
  children: React.ReactNode;
  left?: React.ReactNode;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ children, left }) => (
  <div className="min-h-screen w-full flex flex-col md:flex-row bg-gradient-to-br from-blue-50 to-blue-100">
    {/* Left branding/visual */}
    {left && (
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 bg-white/60 backdrop-blur-lg shadow-lg min-h-[300px]"
      >
        {left}
      </motion.div>
    )}
    {/* Right: Form/content */}
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
      className="flex-1 flex items-center justify-center p-6 md:p-16"
    >
      {children}
    </motion.div>
  </div>
);

export default AuthContainer;
