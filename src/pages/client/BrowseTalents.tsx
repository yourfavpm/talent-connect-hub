import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Star, MapPin, Briefcase, Calendar } from "lucide-react";

// Mock talent data
const mockTalents = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Product Manager",
    location: "San Francisco, USA",
    experience: "8 years",
    skills: ["Agile", "Product Strategy", "User Research", "Roadmapping"],
    rating: 4.9,
    hourlyRate: 85,
    availability: "Immediate",
    avatar: "SC",
  },
  {
    id: "2",
    name: "Michael Okonkwo",
    role: "Operations Manager",
    location: "Lagos, Nigeria",
    experience: "6 years",
    skills: ["Process Optimization", "Team Leadership", "Supply Chain", "Analytics"],
    rating: 4.8,
    hourlyRate: 65,
    availability: "2 weeks",
    avatar: "MO",
  },
  {
    id: "3",
    name: "Emma Larsson",
    role: "Senior Product Designer",
    location: "Stockholm, Sweden",
    experience: "7 years",
    skills: ["UI/UX", "Design Systems", "Figma", "User Testing"],
    rating: 5.0,
    hourlyRate: 95,
    availability: "Immediate",
    avatar: "EL",
  },
  {
    id: "4",
    name: "Raj Patel",
    role: "Technical Program Manager",
    location: "Bangalore, India",
    experience: "10 years",
    skills: ["Scrum", "JIRA", "Risk Management", "Stakeholder Management"],
    rating: 4.7,
    hourlyRate: 70,
    availability: "1 month",
    avatar: "RP",
  },
];

const BrowseTalents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filteredTalents = mockTalents.filter((talent) => {
    const matchesSearch =
      talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.skills.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesRole = !roleFilter || talent.role.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Browse Talents</h1>
        <p className="text-muted-foreground mt-1">
          Discover top-tier Product and Operations professionals
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[200px] h-11">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Program">Program Management</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTalents.length} talent{filteredTalents.length !== 1 ? "s" : ""}
      </div>

      {/* Talent Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTalents.map((talent, index) => (
          <div
            key={talent.id}
            className="bg-card rounded-xl border border-border p-6 hover:shadow-taskive-md transition-all duration-200 animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-primary">
                  {talent.avatar}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground text-lg">
                    {talent.name}
                  </h3>
                  <div className="flex items-center gap-1 text-warning">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{talent.rating}</span>
                  </div>
                </div>
                <p className="text-primary font-medium">{talent.role}</p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {talent.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {talent.experience}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {talent.availability}
                  </span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {talent.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="secondary" className="font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                  <span className="text-lg font-semibold text-foreground">
                    ${talent.hourlyRate}
                    <span className="text-sm font-normal text-muted-foreground">
                      /hour
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                    <Button size="sm">Request Interview</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTalents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No talents found matching your criteria</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default BrowseTalents;
