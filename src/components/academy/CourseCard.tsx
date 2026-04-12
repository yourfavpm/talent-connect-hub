import { Link } from "react-router-dom";
import { ArrowRight, Clock, Star } from "lucide-react";
import { AcademyCourse } from "@/data/academy-courses";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface CourseCardProps {
    course: AcademyCourse;
}

const CourseCard = ({ course }: CourseCardProps) => {
    const levelColor = course.level === "Beginner" 
        ? "bg-blue-50 text-blue-600 border-blue-100" 
        : "bg-amber-50 text-amber-600 border-amber-100";

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="group flex flex-col bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden h-full"
        >
            <div className="p-3 md:p-8 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                    <Badge variant="outline" className={`text-xs md:text-sm font-bold hover:bg-transparent ${levelColor}`}>
                        {course.level}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        {course.duration}
                    </div>
                </div>

                <div className="mb-4 md:mb-6 flex-grow">
                    <h3 className="text-base md:text-xl font-bold text-slate-900 mb-2 md:mb-3 group-hover:text-blue-600 transition-colors">
                        {course.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed line-clamp-2">
                        {course.description}
                    </p>
                </div>

                <div className="space-y-3 md:space-y-4 pt-4 md:pt-6 border-t border-slate-50">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outcome</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs md:text-sm font-bold text-slate-700">{course.outcome}</span>
                        </div>
                    </div>

                    <Link 
                        to={`/courses/${course.slug}`}
                        className="flex items-center justify-between w-full py-2 md:py-3 px-3 md:px-4 rounded-lg md:rounded-xl bg-slate-50 text-slate-900 text-xs md:text-sm font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <span>View Program</span>
                        <ArrowRight className="w-3 md:w-4 h-3 md:h-4 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
            {course.isFlagship && (
                <div className="bg-blue-600 py-1 md:py-1.5 px-3 md:px-4 text-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-[0.2em]">Flagship Program</span>
                </div>
            )}
        </motion.div>
    );
};

export default CourseCard;
