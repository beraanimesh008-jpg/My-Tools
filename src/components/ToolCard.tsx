import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface ToolCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  isNew?: boolean;
}

export default function ToolCard({ name, description, icon: Icon, href, color, isNew }: ToolCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Link 
        to={href}
        className="block p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 shadow-sm hover:shadow-xl transition-all h-full relative overflow-hidden group"
      >
        {isNew && (
          <span className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            New
          </span>
        )}
        
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{name}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
        
        <div className="mt-6 flex items-center text-rose-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          Open Tool →
        </div>

        {/* Subtle background decoration */}
        <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${color} opacity-5 rounded-full`} />
      </Link>
    </motion.div>
  );
}
