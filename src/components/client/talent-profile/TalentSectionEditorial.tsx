import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface TalentSectionEditorialProps {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
  id?: string;
}

export function TalentSectionEditorial({ title, children, icon: Icon, className = "", id }: TalentSectionEditorialProps) {
  return (
    <div 
      className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${className}`} 
      id={id}
    >
      <div className="p-8 md:p-10">
        <div className="flex items-center gap-4 mb-10">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 shadow-sm">
               <Icon className="w-5 h-5" />
            </div>
          )}
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {title}
          </h2>
        </div>
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
