import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  FileSpreadsheet,
  Target,
  MessageSquare,
  Star,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  contract_id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  startDate: string;
  rate: number;
  status: "active" | "on_leave";
  user_id: string;
}

const Team = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (user) fetchTeam();
  }, [user]);

  const fetchTeam = async () => {
    try {
      const { data: cId } = await (supabase.rpc("get_my_client_id" as any) as any);
      if (!cId) return;

      const { data, error } = await supabase
        .from('contracts')
        .select(`
            id, role_title, start_date, hourly_rate, client_gross_rate, status,
            talents (user_id, first_name, last_name, email, phone, location, id, avatar_url)
         `)
        .eq('client_id', cId)
        .eq('status', 'active');

      if (error) throw error;

      const formattedTeam = (data || []).map((contract: any) => ({
        id: contract.talents?.id || Math.random().toString(),
        contract_id: contract.id,
        user_id: contract.talents?.user_id,
        name: `${contract.talents?.first_name || ''} ${contract.talents?.last_name || ''}`.trim() || 'Unknown',
        role: contract.role_title || 'N/A',
        email: contract.talents?.email || 'N/A',
        phone: contract.talents?.phone || 'N/A',
        location: contract.talents?.location || 'Remote',
        avatar: contract.talents?.avatar_url || `${contract.talents?.first_name?.[0] || ''}${contract.talents?.last_name?.[0] || ''}`,
        startDate: contract.start_date || new Date().toISOString(),
        rate: contract.client_gross_rate || contract.hourly_rate || 0,
        status: (contract.status === 'active' ? 'active' : 'on_leave') as 'active' | 'on_leave',
      }));

      setTeam(formattedTeam);
    } catch (e) {
      console.error("Error fetching team", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-none space-y-6 animate-fade-in px-4 md:px-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Team</h1>
        <p className="text-muted-foreground mt-1">
          Manage your hired talents, view performance, and communicate.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : team.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No team members yet
          </h3>
          <p className="text-muted-foreground">
            Your hired talents will appear here once contracts are active
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {team.map((member, index) => (
            <div
              key={member.id}
              className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-200 animate-slide-up flex flex-col"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Top Banner */}
              <div className="h-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-border/50 px-5 flex items-center justify-between">
                <Badge className={member.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" : ""}>
                  {member.status}
                </Badge>
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> ${member.rate}/hr
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-semibold text-primary">
                      {member.avatar}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg mb-0.5 truncate">
                      {member.name}
                    </h3>
                    <p className="text-primary font-medium text-sm truncate mb-2">{member.role}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {member.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Since {new Date(member.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full justify-start h-9 text-xs" onClick={() => { setSelectedMember(member); setDetailsOpen(true); }}>
                    <Users className="h-3.5 w-3.5 mr-2 text-blue-600" /> Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-9 text-xs" onClick={() => navigate('/client/timesheets')}>
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Timesheets
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-9 text-xs" onClick={() => navigate('/client/performance')}>
                    <TrendingUp className="h-3.5 w-3.5 mr-2 text-indigo-600" /> Performance
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-9 text-xs" onClick={() => navigate('/client/messages')}>
                    <MessageSquare className="h-3.5 w-3.5 mr-2 text-sky-600" /> Message
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Team Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">
                    {selectedMember.avatar}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {selectedMember.name}
                  </h3>
                  <p className="text-primary">{selectedMember.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="truncate">{selectedMember.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{selectedMember.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{selectedMember.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>${selectedMember.rate}/hr</span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button className="w-full" onClick={() => { setDetailsOpen(false); navigate('/client/messages'); }}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
