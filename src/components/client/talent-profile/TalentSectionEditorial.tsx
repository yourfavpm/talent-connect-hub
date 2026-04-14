import { ReactNode } from "react";

interface TalentSectionEditorialProps {
  title: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function TalentSectionEditorial({ title, children, className = "", id }: TalentSectionEditorialProps) {
  return (
    <div className={`py-12 first:pt-0 border-b border-gray-100 last:border-0 ${className}`} id={id}>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 sticky top-12">
            {title}
          </h2>
        </div>
        <div className="w-full md:w-3/4">
          {children}
        </div>
      </div>
    </div>
  );
}
