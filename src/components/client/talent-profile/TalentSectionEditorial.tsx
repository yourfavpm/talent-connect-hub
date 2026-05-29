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
      className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${className}`}
      id={id}
    >
      <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-slate-500" />
          </div>
        )}
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="px-5 sm:px-6 py-5">
        {children}
      </div>
    </div>
  );
}
