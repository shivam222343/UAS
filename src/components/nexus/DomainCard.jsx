import { motion } from 'framer-motion';
import { Shield, Users, FileText } from 'lucide-react';

export default function DomainCard({ domain, onClick, isAdmin }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    teal: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className={`bg-gradient-to-br ${colorClasses[domain.color]} rounded-xl p-6 text-white shadow-lg transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <domain.icon className="h-10 w-10" />
          {isAdmin && (
            <Shield className="h-5 w-5 opacity-75" />
          )}
        </div>
        
        <h3 className="text-xl text-white font-bold mb-2">{domain.name}</h3>
        <p className="text-white/80 text-sm mb-4 line-clamp-2">
          {domain.description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
        </div>
        
        <div className="mt-4 flex flex-wrap gap-1">
          {domain.categories.slice(0, 3).map((category) => (
            <span
              key={category}
              className="px-2 py-1 bg-white/20 rounded-full text-xs"
            >
              {category}
            </span>
          ))}
          {domain.categories.length > 3 && (
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
              +{domain.categories.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
