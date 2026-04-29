import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2 } from "lucide-react";

// Decoupled from static data — accepts any curriculum shape
export interface CurriculumWeek {
    week: string;
    title: string;
    lessons: string[];
    assignment?: string;
}

interface CurriculumAccordionProps {
    weeks: CurriculumWeek[];
}

const CurriculumAccordion = ({ weeks }: CurriculumAccordionProps) => {
    return (
        <Accordion type="single" collapsible className="w-full space-y-3 md:space-y-4">
            {weeks.map((week, index) => (
                <AccordionItem 
                    key={index} 
                    value={`week-${index}`}
                    className="border border-slate-100 rounded-lg md:rounded-2xl bg-white overflow-hidden px-3 md:px-4"
                >
                    <AccordionTrigger className="hover:no-underline py-4 md:py-6 [&>svg]:shrink-0">
                        <div className="flex items-center gap-3 md:gap-6 text-left w-full min-w-0">
                            <span className="text-sm md:text-lg lg:text-xl flex-shrink-0 font-display font-semibold md:font-bold text-slate-300 group-hover:text-blue-200 transition-colors">
                                {week.week}
                            </span>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-xs md:text-base font-bold md:font-bold text-slate-900 leading-tight truncate">
                                    {week.title}
                                </h4>
                                <p className="text-[8px] md:text-[11px] font-semibold md:font-bold text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">
                                    {((week as any).lessons || (week as any).details || []).length} Modules
                                </p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 md:pb-8 px-0">
                        <div className="space-y-4 md:space-y-6">
                            <div className="space-y-3 md:space-y-4">
                                {((week as any).lessons || (week as any).details || []).map((lesson: string, lessonIndex: number) => (
                                    <div key={lessonIndex} className="flex items-start gap-2 md:gap-4">
                                        <div className="mt-0.5 md:mt-1 flex-shrink-0">
                                            <CheckCircle2 className="w-3 md:w-4 h-3 md:h-4 text-emerald-500" />
                                        </div>
                                        <span className="text-xs md:text-sm text-slate-600 font-medium md:font-medium leading-relaxed">
                                            {lesson}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {week.assignment && (
                                <div className="mt-4 pt-4 border-t border-slate-50">
                                    <div className="bg-blue-50/50 rounded-xl p-4 md:p-5">
                                        <h5 className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                                            Weekly Assignment
                                        </h5>
                                        <p className="text-xs md:text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                                            {week.assignment}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
};

export default CurriculumAccordion;
