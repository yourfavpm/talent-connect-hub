import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Calendar } from "lucide-react";

interface ClientInterviewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proposedTimes: string[]) => void;
  loading: boolean;
}

export function ClientInterviewRequestModal({
  isOpen,
  onClose,
  onSubmit,
  loading
}: ClientInterviewRequestModalProps) {
  const [time1, setTime1] = useState("");
  const [time2, setTime2] = useState("");
  const [time3, setTime3] = useState("");

  const handleSubmit = () => {
    const times = [time1, time2, time3].filter(t => t);
    if (times.length === 0) return;
    onSubmit(times);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Request Interview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-500">
            Please propose up to 3 possible dates and times for the interview. The Opsly admin team will confirm with the candidate.
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Option 1 (Preferred)</label>
              <Input type="datetime-local" value={time1} onChange={(e) => setTime1(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Option 2 (Alternative)</label>
              <Input type="datetime-local" value={time2} onChange={(e) => setTime2(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Option 3 (Alternative)</label>
              <Input type="datetime-local" value={time3} onChange={(e) => setTime3(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !time1} className="bg-slate-900 text-white hover:bg-slate-800">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
            Request Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
