import { Quote } from "lucide-react";

// Decoupled from static data — accepts any testimonial shape
export interface CourseTestimonial {
    name: string;
    country: string;
    flag: string;
    before: string;
    after: string;
    income: string;
    quote: string;
    image: string;
}

interface TestimonialCardProps {
    testimonial: CourseTestimonial;
}

const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
    return (
        <div className="bg-white rounded-xl p-5 md:p-6 border border-slate-200/60 shadow-sm flex flex-col h-full relative overflow-hidden group hover:border-slate-300 transition-all duration-300">
            {/* Quote Icon Background */}
            <div className="absolute top-2 right-4 text-slate-50/50 group-hover:text-blue-50/50 transition-colors">
                <Quote size={50} fill="currentColor" className="w-12 h-12" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-200/60 shadow-xs shrink-0">
                        <img 
                            src={testimonial.image} 
                            alt={testimonial.name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm leading-none">{testimonial.name}</span>
                            <span title={testimonial.country} className="text-sm">{testimonial.flag}</span>
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Verified Graduate
                        </div>
                    </div>
                </div>

                <div className="flex-grow mb-6">
                    <p className="text-slate-500 italic leading-relaxed text-[13px]">
                        "{testimonial.quote}"
                    </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 mt-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Before</span>
                            <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">{testimonial.before}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">After</span>
                            <span className="text-[11px] font-bold text-slate-800 line-clamp-1">{testimonial.after}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestimonialCard;
