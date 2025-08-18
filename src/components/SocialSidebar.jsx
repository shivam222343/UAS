// src/components/SocialSidebar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';

const socialLinks = [
  { href: 'https://github.com/yourprofile', icon: Github, label: 'GitHub' },
  { href: 'https://linkedin.com/in/yourprofile', icon: Linkedin, label: 'LinkedIn' },
  { href: 'https://twitter.com/yourprofile', icon: Twitter, label: 'Twitter/X' },
  { href: 'mailto:youremail@example.com', icon: Mail, label: 'Email' },
];

const SocialSidebar = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-50 p-4 space-y-4 hidden md:flex flex-col items-center"
    >
      {socialLinks.map((link, index) => (
        <motion.a
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-colors duration-300"
          whileHover={{ scale: 1.2, y: -5 }}
          aria-label={link.label}
        >
          <link.icon className="h-6 w-6 text-blue-600 dark:text-blue-400 hover:text-white" />
        </motion.a>
      ))}
      <div className="w-0.5 h-16 bg-gray-300 dark:bg-gray-600"></div>
    </motion.div>
  );
};

export default SocialSidebar;