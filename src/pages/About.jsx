import { motion } from 'framer-motion';

export default function About() {
  return (
    <motion.div
      className="p-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold mb-4">About Page</h1>
      <p className="text-lg">This is the about page. Edit <code>src/pages/About.jsx</code> to customize.</p>
    </motion.div>
  );
} 