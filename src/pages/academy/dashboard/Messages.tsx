import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const Messages = () => {
  return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="w-20 h-20 bg-blue-50 rounded-[24px] flex items-center justify-center text-blue-600 mb-6">
        <MessageSquare size={40} />
      </div>
      <h1 className="text-3xl font-semibold text-slate-800 tracking-tight mb-2">Internal Messaging</h1>
      <p className="text-slate-500 font-normal max-w-sm mb-8">
        The Academy messaging system is being refined to provide a better collaborative experience.
      </p>
      <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold px-8 h-12 shadow-lg shadow-blue-500/10">
        Contact Support via Email
      </Button>
    </div>
  );
};

export default Messages;
