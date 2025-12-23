import { useState } from "react";
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
  const [team] = useState<TeamMember[]>(mockTeam);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
      {team.length === 0 ? (
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
              className="bg-card rounded-xl border border-border p-6 hover:shadow-taskive-md transition-all duration-200 animate-slide-up"
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
                    <Badge
                      className={
                        member.status === "active"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-warning/10 text-warning border-warning/20"
                      }
                    >
                      {member.status === "active" ? "Active" : "On Leave"}
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
                          Hours this month
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {member.hoursThisMonth}h
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-muted-foreground">
                        Rate: ${member.rate}/hr
                      </span>
                      <span className="font-semibold text-primary">
                        ${(member.hoursThisMonth * member.rate).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member);
                        setDetailsOpen(true);
                      }}
                    >
                      View Details
                    </Button>
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
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Started{" "}
                    {new Date(selectedMember.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Timesheets */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">
                  Recent Timesheets
                </h4>
                <div className="space-y-2">
                  {selectedMember.timesheets.map((ts) => (
                    <div
                      key={ts.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{ts.week}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {ts.hours} hours
                        </span>
                        <Badge className={getTimesheetStatusConfig(ts.status)}>
                          {ts.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
