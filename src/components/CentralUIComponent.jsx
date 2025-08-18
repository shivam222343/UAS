// src/components/CentralUIComponent.jsx
import React from 'react';
import { motion } from 'framer-motion';

const CentralUIComponent = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4" // Adjust min-height to account for header/footer
    >
      <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-4">
          Centralized UI Experience
        </h1>
        <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
          This is an example of a vertically centered component with a clean, modern design. Use this space for a feature highlight, a welcome message, or an important call to action.
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors duration-300">
          Get Started
        </button>
      </div>
    </motion.div>
  );
};

export default CentralUIComponent;