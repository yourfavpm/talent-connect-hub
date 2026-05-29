import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface CourseCardProps {
    course: {
        id?: string;
        slug: string;
        title: string;
        description: string;
        level: string;
        duration: string;
        outcome?: string;
        image_url?: string;
        is_live?: boolean;
        has_open_cohort?: boolean;
    };
    onViewDetails?: (slug: string) => void;
}

const CourseCard = ({ course, onViewDetails }: CourseCardProps) => {
    const levelColor = course.level === "Beginner" 
        ? "bg-blue-50/60 text-blue-600 border-blue-100/40" 
        : "bg-amber-50/60 text-amber-600 border-amber-100/40";

    return (
        <motion.div 
            whileHover={{ y: -3 }}
            className="group flex flex-col bg-white rounded-xl border border-slate-200/60 shadow-sm hover:border-slate-300/80 hover:shadow transition-all duration-300 overflow-hidden h-full w-full"
        >
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {course.duration}
                    </div>
                    <Badge variant="outline" className={`h-5 px-2 rounded font-semibold text-[8px] uppercase tracking-wider ${levelColor}`}>
                        {course.level}
                    </Badge>
                </div>

                <div className="mb-4 flex-grow">
                    <Link to={`/courses/${course.slug}`} className="block">
                        <h3 className="text-sm font-semibold text-slate-800 mb-1.5 group-hover:text-blue-600 transition-colors tracking-tight leading-snug">
                            {course.title}
                        </h3>
                    </Link>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 font-normal">
                        {course.description}
                    </p>
                </div>

                <div className="space-y-3.5 pt-4 border-t border-slate-100/60">
                    {course.outcome && (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Key Outcome</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shrink-0" />
                                <span className="text-xs font-medium text-slate-600 line-clamp-1">{course.outcome}</span>
                            </div>
                        </div>
                    )}

                    {onViewDetails ? (
                        <button 
                            onClick={() => onViewDetails(course.slug)}
                            className="flex items-center justify-between w-full h-8.5 px-3 rounded-lg bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white text-[11px] font-medium transition-colors shadow-sm"
                        >
                            <span>View Program Details</span>
                            <ArrowRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    ) : (
                        <Link 
                            to={`/courses/${course.slug}`}
                            className="flex items-center justify-between w-full h-8.5 px-3 rounded-lg bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white text-[11px] font-medium transition-colors shadow-sm"
                        >
                            <span>View Program Details</span>
                            <ArrowRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    )}
                </div>
            </div>
            {course.is_live && (
                <div className={`py-1.5 px-4 text-center border-t border-slate-100 ${course.has_open_cohort ? 'bg-blue-50/40 text-blue-600' : 'bg-slate-50/50 text-slate-400'}`}>
                    <span className="text-[9px] font-semibold uppercase tracking-widest">
                        {course.has_open_cohort ? 'Enrollment Open' : 'Enrollment Closed'}
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default CourseCard;
