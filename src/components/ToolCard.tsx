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

const colorGradients: Record<string, { bg: string; text: string; shadow: string; border: string; hoverBg: string; badge: string }> = {
  'bg-rose-500': {
    bg: 'from-rose-500 to-pink-500',
    text: 'text-rose-600 dark:text-rose-400',
    shadow: 'shadow-rose-500/10 dark:shadow-none',
    border: 'group-hover:border-rose-200 dark:group-hover:border-rose-900/40',
    hoverBg: 'group-hover:bg-rose-50/10',
    badge: 'bg-rose-500/10 text-rose-650 dark:text-rose-300 border-rose-200/30'
  },
  'bg-cyan-500': {
    bg: 'from-cyan-500 to-blue-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    shadow: 'shadow-cyan-500/10 dark:shadow-none',
    border: 'group-hover:border-cyan-200 dark:group-hover:border-cyan-900/40',
    hoverBg: 'group-hover:bg-cyan-50/10',
    badge: 'bg-cyan-500/10 text-cyan-650 dark:text-cyan-300 border-cyan-200/30'
  },
  'bg-orange-500': {
    bg: 'from-orange-500 to-amber-500',
    text: 'text-orange-600 dark:text-orange-400',
    shadow: 'shadow-orange-500/10 dark:shadow-none',
    border: 'group-hover:border-orange-200 dark:group-hover:border-orange-900/40',
    hoverBg: 'group-hover:bg-orange-50/10',
    badge: 'bg-orange-500/10 text-orange-650 dark:text-orange-300 border-orange-200/30'
  },
  'bg-purple-600': {
    bg: 'from-purple-600 to-indigo-500',
    text: 'text-purple-600 dark:text-purple-400',
    shadow: 'shadow-purple-500/10 dark:shadow-none',
    border: 'group-hover:border-purple-200 dark:group-hover:border-purple-900/40',
    hoverBg: 'group-hover:bg-purple-50/10',
    badge: 'bg-purple-600/10 text-purple-650 dark:text-purple-300 border-purple-200/30'
  },
  'bg-indigo-600': {
    bg: 'from-indigo-600 to-violet-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    shadow: 'shadow-indigo-500/10 dark:shadow-none',
    border: 'group-hover:border-indigo-200 dark:group-hover:border-indigo-900/40',
    hoverBg: 'group-hover:bg-indigo-50/10',
    badge: 'bg-indigo-600/10 text-indigo-650 dark:text-indigo-300 border-indigo-200/30'
  },
  'bg-emerald-500': {
    bg: 'from-emerald-500 to-teal-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    shadow: 'shadow-emerald-500/10 dark:shadow-none',
    border: 'group-hover:border-emerald-200 dark:group-hover:border-emerald-900/40',
    hoverBg: 'group-hover:bg-emerald-50/10',
    badge: 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-300 border-emerald-200/30'
  }
};

export default function ToolCard({ name, description, icon: Icon, href, color, isNew }: ToolCardProps) {
  const c = colorGradients[color] || {
    bg: 'from-rose-500 to-pink-500',
    text: 'text-rose-600 dark:text-rose-400',
    shadow: 'shadow-rose-500/10',
    border: 'group-hover:border-rose-200 dark:group-hover:border-rose-900/40',
    hoverBg: 'group-hover:bg-rose-50/10',
    badge: 'bg-rose-500/10 text-rose-600 border-rose-200/30'
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="h-full"
    >
      <Link 
        to={href}
        className={`block p-6 h-full bg-white dark:bg-[#0f172a] rounded-[2rem] border border-slate-100/90 dark:border-slate-800/80 ${c.border} shadow-sm hover:shadow-xl ${c.shadow} transition-all duration-300 relative overflow-hidden group`}
      >
        {isNew && (
          <span className={`absolute top-5 right-5 ${c.badge} text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wider uppercase`}>
            New
          </span>
        )}
        
        <div className={`w-14 h-14 bg-gradient-to-tr ${c.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 group-hover:scale-105 transition-all duration-300 shadow-md`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        
        <h3 className="text-xl font-display font-extrabold text-slate-850 dark:text-slate-100 mb-2.5 tracking-tight group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">
          {name}
        </h3>
        <p className="text-[14px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
          {description}
        </p>
        
        <div className={`mt-5 flex items-center ${c.text} font-bold text-xs uppercase tracking-wider gap-1.5 opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300`}>
          Open Tool <span className="text-md font-semibold font-display">→</span>
        </div>

        {/* Dynamic ambient color node */}
        <div className={`absolute -bottom-10 -right-10 w-28 h-28 bg-gradient-to-tr ${c.bg} opacity-[0.03] dark:opacity-[0.05] rounded-full blur-xl group-hover:opacity-[0.08] transition-opacity duration-300`} />
      </Link>
    </motion.div>
  );
}
