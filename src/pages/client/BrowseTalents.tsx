import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { TalentListPanel } from "@/components/client/talents/TalentListPanel";
import { FilterDrawer } from "@/components/client/talents/FilterDrawer";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TalentGridSkeleton } from "@/components/client/talents/TalentGridSkeleton";

const BrowseTalents = () => {
  const navigate = useNavigate();
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("client_visible_talents" as any)
        .select("*")
        .order("vetted_at", { ascending: false });

      if (error) throw error;
      setTalents(data || []);
    } catch (error) {
      console.error("Error fetching talents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTalent = (talent: any) => {
    navigate(`/client/browse-talents/${talent.talent_id}`);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setAvailabilityFilter("all");
  };

  const filteredTalents = talents.filter((talent) => {
    const name = (talent.anonymized_name || "").toLowerCase();
    const headline = (talent.headline || "").toLowerCase();
    const skills = (talent.skills || []).map((s: string) => s.toLowerCase());
    
    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) ||
      headline.includes(searchQuery.toLowerCase()) ||
      skills.some((skill: string) => skill.includes(searchQuery.toLowerCase()));
      
    const matchesRole = roleFilter === "all" || talent.headline === roleFilter;
    const matchesAvailability = availabilityFilter === "all" || talent.availability === availabilityFilter;
    
    return matchesSearch && matchesRole && matchesAvailability;
  });
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col font-sans px-4 py-8">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <TalentGridSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col font-sans px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Browse Talents</h1>
          <p className="text-gray-500 mt-1">Explore vetted professionals available on Taskive.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search roles or skills..."
              className="pl-9 h-10 border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <FilterDrawer 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            roleFilter={roleFilter} setRoleFilter={setRoleFilter}
            availabilityFilter={availabilityFilter} setAvailabilityFilter={setAvailabilityFilter}
            onReset={handleResetFilters}
          />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 shrink-0">
          {filteredTalents.length} Available Talents
        </div>
        <TalentListPanel 
          talents={filteredTalents} 
          selectedTalentId={null}
          onSelectTalent={handleSelectTalent}
        />
      </div>
    </div>
  );
};

export default BrowseTalents;

