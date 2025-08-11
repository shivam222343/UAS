import React from "react";
import { BookOpen, Plus, Check } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../../public/logo.png"; 
import { Link } from "react-router-dom";

const ClubCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-[280px] rounded-2xl overflow-hidden shadow-lg font-sans bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2] dark:from-gray-800 dark:to-gray-900 relative"
    >
      {/* Decorative elements */}
      <div className="absolute w-[100px] h-[100px] bg-white/10 rounded-full top-[-30px] right-[-30px]" />
      <div className="absolute w-[60px] h-[60px] bg-white/10 rounded-full bottom-[20px] left-[-20px]" />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-5 text-center relative dark:from-purple-700 dark:to-indigo-800">
        <div className="w-[60px] h-[60px] overflow-hidden bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-md">
        <img src={logo} alt="Logo" />
        </div>
        <h3 className="text-xl font-semibold m-0 text-white">Welcome to the Team Mavericks!</h3>
      </div>

      {/* Status */}
      <div className="p-4 bg-white justify-center  dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <div className="bg-green-400 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
          <Check size={14} />
          Active
        </div>
        <p className="ml-3 text-gray-600 dark:text-gray-300 text-sm m-0">
          You're a member
        </p>
      </div>

      {/* Action */}
      <Link to="/settings">
      <div className="p-5 text-center bg-white dark:bg-gray-900">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-blue-600 to-blue-400 dark:from-blue-600 dark:to-blue-400 text-white font-semibold text-base px-6 py-2.5 rounded-full shadow-md flex items-center justify-center gap-2 mx-auto"
        >
          <Plus size={18} />
          Join Another Club
        </motion.button>
      </div>
      </Link>
    </motion.div>
  );
};

export default ClubCard;
