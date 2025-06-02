import { motion } from 'framer-motion';

export default function Home() {
  return (
    <motion.div
      className="p-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold mb-4">Home Page</h1>
      <p className="text-lg">Welcome to the Vite + React + Tailwind + Firebase + Framer Motion starter!</p>
    </motion.div>
  );
} 