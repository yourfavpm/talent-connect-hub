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
        ? "bg-blue-50 text-blue-600 border-blue-100" 
        : "bg-amber-50 text-amber-600 border-amber-100";

    return (
        <motion.div 
            whileHover={{ y: -4 }}
            className="group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all duration-300 overflow-hidden h-full w-full"
        >
            <div className="p-5 md:p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 text-[9px] font-normal text-slate-500 uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        {course.duration}
                    </div>
                    <Badge variant="outline" className={`h-6 px-2.5 rounded-lg border-none font-semibold text-[9px] uppercase tracking-widest ${levelColor}`}>
                        {course.level}
                    </Badge>
                </div>

                <div className="mb-6 flex-grow">
                    <Link to={`/courses/${course.slug}`} className="block">
                        <h3 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors tracking-tight leading-snug">
                            {course.title}
                        </h3>
                    </Link>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 font-normal">
                        {course.description}
                    </p>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-50">
                    {course.outcome && (
                        <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-normal text-slate-500 uppercase tracking-widest">Key Outcome</span>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                                <span className="text-xs font-semibold text-slate-700 line-clamp-1">{course.outcome}</span>
                            </div>
                        </div>
                    )}

                    {onViewDetails ? (
                        <button 
                            onClick={() => onViewDetails(course.slug)}
                            className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-50 text-slate-800 text-xs font-semibold group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                        >
                            <span>View Program Details</span>
                            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    ) : (
                        <Link 
                            to={`/courses/${course.slug}`}
                            className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-50 text-slate-800 text-xs font-semibold group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                        >
                            <span>View Program Details</span>
                            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    )}
                </div>
            </div>
            {course.is_live && (
                <div className={`py-1.5 px-4 text-center ${course.has_open_cohort ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    <span className={`text-[8px] font-semibold uppercase tracking-[0.2em] ${course.has_open_cohort ? 'text-white' : 'text-slate-500'}`}>
                        {course.has_open_cohort ? 'Enrollment Open' : 'Enrollment Closed'}
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default CourseCard;
