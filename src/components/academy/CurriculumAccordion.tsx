import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { CurriculumWeek } from "@/data/academy-courses";
import { CheckCircle2 } from "lucide-react";

interface CurriculumAccordionProps {
    weeks: CurriculumWeek[];
}

const CurriculumAccordion = ({ weeks }: CurriculumAccordionProps) => {
    return (
        <Accordion type="single" collapsible className="w-full space-y-4">
            {weeks.map((week, index) => (
                <AccordionItem 
                    key={index} 
                    value={`week-${index}`}
                    className="border border-slate-100 rounded-2xl bg-white overflow-hidden px-4"
                >
                    <AccordionTrigger className="hover:no-underline py-6">
                        <div className="flex items-center gap-6 text-left">
                            <span className="text-xl font-display font-bold text-slate-200 group-hover:text-blue-200 transition-colors">
                                {week.week}
                            </span>
                            <div>
                                <h4 className="text-base font-bold text-slate-900 leading-tight">
                                    {week.title}
                                </h4>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {week.lessons.length} Modules Included
                                </p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-8 pl-[72px]">
                        <div className="space-y-4">
                            {week.lessons.map((lesson, lessonIndex) => (
                                <div key={lessonIndex} className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="text-sm text-slate-600 font-medium leading-relaxed">
                                        {lesson}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
};

export default CurriculumAccordion;
