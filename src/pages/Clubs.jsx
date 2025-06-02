import { motion } from 'framer-motion';
import JoinClub from '../components/clubs/JoinClub';

export default function Clubs() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Clubs</h1>
      
      <div className="max-w-4xl mx-auto">
        <JoinClub />
      </div>
    </motion.div>
  );
} 