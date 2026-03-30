import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Download,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  startDate: string;
  hoursThisMonth: number;
  rate: number;
  status: "active" | "on_leave";
  timesheets: Timesheet[];
}

interface Timesheet {
  id: string;
  week: string;
  hours: number;
  status: "approved" | "pending" | "submitted";
}

// Mock team data
const mockTeam: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Product Manager",
    email: "sarah.chen@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, USA",
    avatar: "SC",
    startDate: "2024-01-15",
    hoursThisMonth: 120,
    rate: 85,
    status: "active",
    timesheets: [
      { id: "1", week: "Jan 15 - Jan 21", hours: 40, status: "approved" },
      { id: "2", week: "Jan 22 - Jan 28", hours: 38, status: "approved" },
      { id: "3", week: "Jan 29 - Feb 4", hours: 42, status: "pending" },
    ],
  },
  {
    id: "2",
    name: "Michael Okonkwo",
    role: "Operations Manager",
    email: "michael.o@email.com",
    phone: "+234 801 234 5678",
    location: "Lagos, Nigeria",
    avatar: "MO",
    startDate: "2023-11-01",
    hoursThisMonth: 160,
    rate: 65,
    status: "active",
    timesheets: [
      { id: "1", week: "Jan 15 - Jan 21", hours: 40, status: "approved" },
      { id: "2", week: "Jan 22 - Jan 28", hours: 40, status: "approved" },
      { id: "3", week: "Jan 29 - Feb 4", hours: 40, status: "submitted" },
      { id: "4", week: "Feb 5 - Feb 11", hours: 40, status: "submitted" },
    ],
  },
];

const Team = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase.from('clients').select('id').eq('user_id', user.id).maybeSingle();
      if (!client) return;

      // Fetch Active Contracts
      const { data, error } = await supabase
        .from('contracts')
        .select(`
            id, role_title, start_date, hourly_rate, client_gross_rate,
            talents (first_name, last_name, email, phone, location, id)
            id, role_title, start_date, hourly_rate, client_gross_rate, status,
            talents (first_name, last_name, email, phone, location, id, avatar_url)
         `)
        .eq('client_id', client.id)
        .eq('status', 'active');

      if (error) throw error;

      const formattedTeam = (data || []).map((contract: any) => ({
        id: contract.id,
        name: `${contract.talents?.first_name || ''} ${contract.talents?.last_name || ''}`.trim(),
        role: contract.role_title || 'N/A',
        email: contract.talents?.email || 'N/A',
        phone: contract.talents?.phone || 'N/A',
        location: contract.talents?.location || 'Remote',
        avatar: contract.talents?.avatar_url || `${contract.talents?.first_name?.[0] || ''}${contract.talents?.last_name?.[0] || ''}`,
        startDate: contract.start_date || new Date().toISOString(),
        hoursThisMonth: 0, // TODO: Calculate from timesheets
        rate: contract.hourly_rate || 0,
        status: (contract.status === 'active' ? 'active' : 'on_leave') as 'active' | 'on_leave',
        timesheets: [], // TODO: Fetch timesheets
      }));

      setTeam(formattedTeam);
    } catch (e) {
      console.error("Error fetching team", e);
    } finally {
      setLoading(false);
    }
  };

  const getTimesheetStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success border-success/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "submitted":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Team</h1>
        <p className="text-muted-foreground mt-1">
          Manage your hired talents and view their timesheets
        </p>
      </div>

      {/* Team Grid */}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {team.map((member, index) => (
            <div
              key={member.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-primary">
                    {member.avatar}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground text-lg">
                      {member.name}
                    </h3>
                    <Badge className="bg-success/10 text-success border-success/20">
                      Active
                    </Badge>
                  </div>
                  <p className="text-primary font-medium">{member.role}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {member.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Since {new Date(member.startDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Hours This Month */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Rate
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">
                        ${member.rate}/hr
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Timesheets
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Team Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6 mt-4">
              {/* Profile */}
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

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedMember.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedMember.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedMember.location}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
