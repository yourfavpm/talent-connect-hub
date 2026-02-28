import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { TalentListPanel } from "@/components/client/talents/TalentListPanel";
import { FilterDrawer } from "@/components/client/talents/FilterDrawer";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useVettingVersion } from "@/hooks/useVettingVersion";

const BrowseTalents = () => {
  const navigate = useNavigate();
  const { version, isLoading: isVersionLoading } = useVettingVersion();
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  useEffect(() => {
    if (!isVersionLoading) {
      fetchTalents();
    }
  }, [isVersionLoading, version]);

  const fetchTalents = async () => {
    try {
      setLoading(true);
      // 1. Fetch visible profiles
      const tableName = version === "v2" ? "v2_talent_profiles" : "talent_profiles";
      const { data: profiles, error: profileError } = await (supabase.from(tableName as any) as any)
        .select("*")
        .eq(version === "v2" ? "visible_to_clients" : "visibility_to_clients", true)
        .order("created_at", { ascending: false });

      if (profileError) throw profileError;
      
      const userIds = profiles?.map((p: any) => p.user_id) || [];
      if (userIds.length === 0) {
        setTalents([]);
        return;
      }
      
      // 2. Fetch talent details
      const { data: talentsData, error: talentsError } = await supabase
        .from("talents")
        .select("*")
        .in("user_id", userIds);

      if (talentsError) throw talentsError;

      const talentMap: Record<string, any> = {};
      (talentsData || []).forEach(t => {
        talentMap[t.user_id] = t;
      });

      // 3. Map to UI structure
      const mapped = (profiles || []).map((p: any) => {
        const t = talentMap[p.user_id] || {};
        return {
          ...t,
          vetting_status: p.status,
          talent_profile_id: p.id,
          vetting_level: p.vetting_level
        };
      }).filter(t => t.id); // Ensure we have a valid talent record

      setTalents(mapped);
    } catch (error) {
      console.error("Error fetching talents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTalent = (talent: any) => {
    navigate(`/client/browse-talents/${talent.id}`);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setAvailabilityFilter("all");
  };

  const filteredTalents = talents.filter((talent) => {
    const fullName = `${talent.first_name || ""} ${talent.last_name || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      talent.primary_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.secondary_skills?.some((skill: string) =>
        skill?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
    const matchesRole = roleFilter === "all" || talent.primary_role === roleFilter;
    const matchesAvailability = availabilityFilter === "all" || talent.availability === availabilityFilter;
    
    return matchesSearch && matchesRole && matchesAvailability;
  });
  
  if (loading || isVersionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500 text-sm">
        Loading talent network...
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

