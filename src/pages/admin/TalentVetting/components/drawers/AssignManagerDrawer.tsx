import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, UserPlus, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AssignManagerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talentId: string;
  currentManagerId?: string | null;
  onSuccess: () => void;
}

const AssignManagerDrawer = ({ open, onOpenChange, talentId, currentManagerId, onSuccess }: AssignManagerDrawerProps) => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(currentManagerId || null);

  useEffect(() => {
    if (open) {
      fetchAdmins();
      setSelectedId(currentManagerId || null);
    }
  }, [open, currentManagerId]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .order("first_name");

      if (error) throw error;
      setAdmins((data || []).map(p => ({
        id: p.user_id,
        full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Admin',
        email: p.email
      })));
    } catch (error: any) {
      toast.error("Failed to load admins: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("talents" as any)
        .update({ assigned_manager: selectedId } as any)
        .eq("id", talentId);

      if (error) throw error;
      
      toast.success("Talent manager assigned successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to assign manager: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredAdmins = admins.filter(admin => 
    admin.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b border-gray-100">
          <SheetTitle className="text-lg font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Manager
          </SheetTitle>
          <SheetDescription className="text-xs font-medium text-gray-400">
            Select a Talent Manager to oversee this candidate's vetting process.
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-10 h-11 border-gray-200 text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1">Available Managers</span>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-6 w-6 text-gray-200 animate-spin" />
                <span className="text-[10px] font-bold text-gray-300 uppercase">Fetching Admins...</span>
              </div>
            ) : filteredAdmins.length > 0 ? (
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                {filteredAdmins.map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => setSelectedId(admin.id)}
                    className={cn(
                      "w-full p-4 flex items-center justify-between text-left transition-all hover:bg-gray-50",
                      selectedId === admin.id ? "bg-blue-50/50" : "bg-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarFallback className="bg-gray-50 text-[10px] font-bold text-gray-500">
                          {admin.full_name?.split(' ').map((n: string) => n[0]).join('') || admin.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-bold text-gray-900 leading-tight">{admin.full_name || "Guest Admin"}</div>
                        <div className="text-[10px] font-medium text-gray-400">{admin.email}</div>
                      </div>
                    </div>
                    {selectedId === admin.id && (
                      <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                        <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                <span className="text-xs text-gray-400 font-medium italic">No managers found.</span>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
          <Button 
            className="w-full h-12 font-black uppercase text-[11px] tracking-widest"
            disabled={!selectedId || saving || loading}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assignment"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AssignManagerDrawer;
