import { LucideIcon, FileText, Image as ImageIcon, Zap, Video, Terminal } from 'lucide-react';
import ToolCard from './ToolCard';
import { motion } from 'motion/react';

interface CategorySectionProps {
  title: string;
  icon: LucideIcon;
  color: string;
  tools: Array<{
    name: string;
    description: string;
    icon: LucideIcon;
    href: string;
    isNew?: boolean;
    color: string;
  }>;
}

export default function CategorySection({ title, icon: Icon, color, tools }: CategorySectionProps) {
  // Map color to beautiful gradients
  const gradientMap: Record<string, string> = {
    'bg-rose-500': 'bg-gradient-to-tr from-rose-500 to-pink-500 shadow-rose-200/50 dark:shadow-none',
    'bg-cyan-500': 'bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-cyan-200/50 dark:shadow-none',
    'bg-orange-500': 'bg-gradient-to-tr from-orange-400 to-amber-550 shadow-orange-200/50 dark:shadow-none',
    'bg-purple-600': 'bg-gradient-to-tr from-purple-500 to-indigo-600 shadow-purple-200/50 dark:shadow-none',
    'bg-indigo-600': 'bg-gradient-to-tr from-indigo-500 to-blue-650 shadow-indigo-200/50 dark:shadow-none',
    'bg-emerald-500': 'bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-emerald-200/50 dark:shadow-none'
  };

  const gradientClass = gradientMap[color] || 'bg-gradient-to-tr from-rose-500 to-pink-500';

  return (
    <section className="py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-3.5 rounded-2xl ${gradientClass} shadow-md`}>
          <Icon className="text-white w-5 h-5" />
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-black text-slate-800 dark:text-slate-100 tracking-tight">{title}</h2>
        <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800/80 ml-4 rounded-full" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map((tool, idx) => (
          <ToolCard 
            key={idx} 
            {...tool as any}
          />
        ))}
      </div>
    </section>
  );
}
