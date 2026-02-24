import { ReactNode } from "react";

interface TalentSectionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function TalentSectionCard({ title, children, className = "" }: TalentSectionCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-5">{title}</h2>
      {children}
    </div>
  );
}
