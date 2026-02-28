import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Copy, 
  ExternalLink, 
  UserPlus, 
  BarChart, 
  MessageSquare, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TalentVettingStatus, SkillLevel } from "@/types/talent";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";

interface VettingHeaderProps {
  talent: any; // Using any for now due to complexity of talent object withRelations
  talentManager: { full_name: string, email: string } | null;
  onRefresh: () => void;
  onAssignManager: () => void;
}

const VettingHeader = ({ talent, talentManager, onRefresh, onAssignManager }: VettingHeaderProps) => {
  const copyId = () => {
    navigator.clipboard.writeText(talent.talent_id);
    toast.success("Talent ID copied");
  };

  const getStatusBadge = (status: TalentVettingStatus) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-50 text-blue-700 border-blue-100",
      in_review: "bg-purple-50 text-purple-700 border-purple-100",
      changes_requested: "bg-orange-50 text-orange-700 border-orange-100",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
      rejected: "bg-red-50 text-red-700 border-red-100",
    };
    return (
      <Badge className={cn("shadow-none border h-6 px-2.5 font-semibold uppercase text-[10px] tracking-wider", styles[status] || styles.draft)}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getSkillBadge = (level: SkillLevel) => {
    const styles: Record<string, string> = {
      junior: "bg-gray-50 text-gray-600 border-gray-200",
      mid: "bg-blue-50 text-blue-600 border-blue-100",
      senior: "bg-indigo-50 text-indigo-700 border-indigo-100",
      lead: "bg-purple-50 text-purple-700 border-purple-100",
    };
    return (
      <Badge variant="outline" className={cn("shadow-none h-6 px-2 text-[10px] font-semibold uppercase", styles[level] || "bg-gray-50 text-gray-400 border-gray-200")}>
        {level || "Unrated"}
      </Badge>
    );
  };

  return (
    <header className="h-16 border-b border-gray-100 px-6 flex items-center justify-between shrink-0 bg-white">
      <div className="flex items-center gap-4">
        <Avatar className="h-9 w-9 border border-gray-100">
          <AvatarImage src={talent.avatar_url} />
          <AvatarFallback className="bg-gray-50 text-gray-400">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-gray-900 tracking-tight">
                {talent.first_name} {talent.last_name}
              </h1>
              <div className="flex items-center gap-1 group cursor-pointer" onClick={copyId}>
                <span className="text-[10px] font-mono text-gray-400 group-hover:text-gray-600 transition-colors uppercase">
                  {talent.talent_id}
                </span>
                <Copy className="h-2.5 w-2.5 text-gray-300 group-hover:text-gray-400" />
              </div>
            </div>
          </div>
          <div className="h-4 w-px bg-gray-100 mx-1" />
          <div className="flex items-center gap-3">
            {getStatusBadge(talent.vetting_status)}
            <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-medium text-gray-400 tracking-widest">Skill</span>
                {getSkillBadge(talent.overall_skill_level)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {talentManager ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 rounded-lg border border-gray-100 mr-2">
                <div className="h-6 w-6 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-medium text-gray-400 leading-none">Manager</span>
                    <span className="text-[11px] font-semibold text-gray-700 leading-tight">{talentManager.full_name}</span>
                </div>
            </div>
        ) : (
            <Button variant="ghost" className="h-8 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3" onClick={onAssignManager}>
                <UserPlus className="h-3.5 w-3.5 mr-2" />
                Assign Manager
            </Button>
        )}

        <div className="h-6 w-px bg-gray-100 mx-2" />

        <div className="flex items-center gap-1.5">
            <Button variant="outline" className="h-8 w-8 p-0 border-gray-200" title="Internal Messages">
                <MessageSquare className="h-4 w-4 text-gray-400" />
            </Button>
            <Button variant="outline" className="h-8 w-8 p-0 border-gray-200" title="Assessment Details">
                <BarChart className="h-4 w-4 text-gray-400" />
            </Button>
            <Button variant="outline" className="h-8 text-[11px] font-semibold border-gray-200 px-3">
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                Public Profile
            </Button>
        </div>
      </div>
    </header>
  );
};

export default VettingHeader;
