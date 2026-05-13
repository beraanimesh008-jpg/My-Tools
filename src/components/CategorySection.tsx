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
  return (
    <section className="py-12">
      <div className="flex items-center gap-4 mb-10">
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className="text-white w-6 h-6" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{title}</h2>
        <div className="h-[2px] flex-1 bg-slate-100 dark:bg-slate-800 ml-4 rounded-full" />
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
