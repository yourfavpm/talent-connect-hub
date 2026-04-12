import { CourseTestimonial } from "@/data/academy-courses";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
    testimonial: CourseTestimonial;
}

const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
    return (
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 border border-slate-100 shadow-sm flex flex-col h-full relative overflow-hidden group">
            {/* Quote Icon Background */}
            <div className="absolute top-2 md:top-4 right-3 md:right-6 text-slate-50 group-hover:text-blue-50 transition-colors">
                <Quote size={60} fill="currentColor" className="md:w-20 md:h-20" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="w-12 md:w-16 h-12 md:h-16 rounded-full overflow-hidden border-2 border-slate-50 shadow-sm shrink-0">
                        <img 
                            src={testimonial.image} 
                            alt={testimonial.name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm md:text-base">{testimonial.name}</span>
                            <span title={testimonial.country} className="text-base md:text-lg">{testimonial.flag}</span>
                        </div>
                        <div className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Verified Graduate
                        </div>
                    </div>
                </div>

                <div className="space-y-4 md:space-y-6 mb-6 md:mb-8 flex-grow">
                    <p className="text-slate-600 italic leading-relaxed relative text-sm md:text-base">
                        "{testimonial.quote}"
                    </p>
                </div>

                <div className="pt-4 md:pt-6 border-t border-slate-50 space-y-3 md:space-y-4 mt-auto">
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Before</span>
                            <span className="text-xs md:text-xs font-bold text-slate-500 line-clamp-1">{testimonial.before}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">After</span>
                            <span className="text-xs md:text-xs font-bold text-slate-900 line-clamp-1">{testimonial.after}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestimonialCard;
