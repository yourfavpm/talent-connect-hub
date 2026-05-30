import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  Search,
  Send,
  Users,
  DollarSign,
  Hourglass,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/email/emailService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ScholarshipApplication = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  state?: string;
  age?: number;
  program_of_interest: string;
  current_occupation?: string;
  supporting_document_url?: string;
  university_name?: string;
  education_status?: string;
  payment_status: string;
  application_status: string;
  payment_reference?: string;
  created_at: string;
};

const ScholarshipApplications = () => {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailOpen, setEmailOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("scholarship_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications((data || []) as ScholarshipApplication[]);
    } catch (err: any) {
      console.error("Failed to fetch scholarship applications:", err);
      toast.error(err?.message || "Failed to load scholarship applications");
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || [
        app.full_name,
        app.email,
        app.phone,
        app.state,
        app.program_of_interest,
      ].some((value) => (value || "").toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || app.application_status === statusFilter || app.payment_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const selectedApplicants = useMemo(
    () => applications.filter((app) => selectedIds.includes(app.id) && app.email),
    [applications, selectedIds]
  );

  // Fixed scholarship fee — no amount column stored in the table
  const SCHOLARSHIP_FEE = 5000;

  const stats = {
    total: applications.length,
    submitted: applications.filter((app) => app.application_status === "submitted").length,
    pending: applications.filter((app) => app.application_status === "pending_payment").length,
    paid: applications.filter((app) => app.payment_status === "success").length,
    revenueCollected:
      applications.filter((app) => app.payment_status === "success").length * SCHOLARSHIP_FEE,
    revenuePending:
      applications.filter((app) => app.payment_status !== "success").length * SCHOLARSHIP_FEE,
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredApplications.map((app) => app.id) : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...new Set([...prev, id])] : prev.filter((item) => item !== id));
  };

  const insertFirstName = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage((prev) => `${prev}{{first_name}}`);
      return;
    }

    const before = message.slice(0, textarea.selectionStart);
    const after = message.slice(textarea.selectionEnd);
    setMessage(`${before}{{first_name}}${after}`);
  };

  const handleBroadcast = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Add a subject and message before sending.");
      return;
    }
    if (selectedApplicants.length === 0) {
      toast.error("Select at least one applicant.");
      return;
    }

    setSending(true);
    let sent = 0;

    for (const applicant of selectedApplicants) {
      const firstName = applicant.full_name?.split(" ")[0] || "there";
      const body = message
        .replace(/{{first_name}}/g, firstName)
        .replace(/{{full_name}}/g, applicant.full_name || firstName)
        .replace(/\n/g, "<br/>");

      const ok = await sendEmail({
        to: applicant.email,
        toName: applicant.full_name,
        subject,
        htmlTemplate: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5efff;border-radius:20px;overflow:hidden;">
            <div style="background:#0f2147;padding:34px;text-align:center;">
              <img src="https://opslyhr.com/images/logocolored.svg" alt="OPSlyHR" style="width:136px;height:auto;" />
            </div>
            <div style="padding:36px;color:#334155;font-size:16px;line-height:1.75;">${body}</div>
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px;text-align:center;color:#94a3b8;font-size:12px;">
              OPSly Academy Admissions Team
            </div>
          </div>
        `,
      });

      if (ok) sent++;
    }

    setSending(false);
    setEmailOpen(false);
    setSubject("");
    setMessage("");
    toast.success(`Broadcast sent to ${sent} of ${selectedApplicants.length} applicant${selectedApplicants.length === 1 ? "" : "s"}.`);
  };

  return (
    <div className="min-h-screen space-y-6 bg-white p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-600">
            <GraduationCap className="h-3.5 w-3.5" />
            Academy
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950">Scholarship Applications</h1>
          <p className="text-sm text-slate-500">Review paid scholarship applications and communicate with applicants.</p>
        </div>
        <Button
          onClick={() => setEmailOpen(true)}
          disabled={selectedApplicants.length === 0}
          className="gap-2 bg-blue-600 font-bold hover:bg-blue-700"
        >
          <Mail className="h-4 w-4" />
          Broadcast to {selectedApplicants.length || "selected"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-blue-500" },
          { label: "Submitted", value: stats.submitted, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Pending Payment", value: stats.pending, icon: Loader2, color: "text-amber-500" },
          { label: "Paid", value: stats.paid, icon: Mail, color: "text-blue-500" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <stat.icon className={`mb-3 h-4 w-4 ${stat.color}`} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{stat.value}</p>
          </div>
        ))}
        {/* Revenue collected */}
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-900 to-slate-900 p-4 shadow-sm text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-6 -mt-6" />
          <DollarSign className="mb-3 h-4 w-4 text-emerald-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/70">Revenue Collected</p>
          <p className="mt-1 text-2xl font-bold">₦{stats.revenueCollected.toLocaleString()}</p>
        </div>
        {/* Revenue pending */}
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <Hourglass className="mb-3 h-4 w-4 text-amber-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unsettled Revenue</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">₦{stats.revenuePending.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applicants..."
            className="h-10 border-slate-100 bg-slate-50 pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full border-slate-100 bg-slate-50 md:w-52">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="pending_payment">Pending payment</SelectItem>
            <SelectItem value="success">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredApplications.length > 0 && selectedIds.length === filteredApplications.length}
                  onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                />
              </TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Education Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Applied</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-300" />
                </TableCell>
              </TableRow>
            ) : filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-sm text-slate-400">
                  No scholarship applications found.
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(app.id)}
                      onCheckedChange={(checked) => toggleOne(app.id, Boolean(checked))}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{app.full_name}</div>
                    <div className="text-xs text-slate-400">{app.email}</div>
                    <div className="text-xs text-slate-400">{app.phone}</div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{app.program_of_interest}</TableCell>
                  <TableCell className="text-slate-600 text-xs font-semibold max-w-[150px] truncate" title={app.university_name}>{app.university_name || "-"}</TableCell>
                  <TableCell className="text-slate-500 text-xs font-medium capitalize">{app.education_status?.replace(/_/g, " ") || "-"}</TableCell>
                  <TableCell>{paymentBadge(app.payment_status)}</TableCell>
                  <TableCell>{statusBadge(app.application_status)}</TableCell>
                  <TableCell className="text-right text-xs text-slate-500">
                    {app.created_at ? format(new Date(app.created_at), "MMM d, yyyy") : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={emailOpen} onOpenChange={(open) => !sending && setEmailOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Broadcast Email</DialogTitle>
            <DialogDescription>
              Send a message to {selectedApplicants.length} selected scholarship applicant{selectedApplicants.length === 1 ? "" : "s"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={insertFirstName}>
                Insert {"{{first_name}}"}
              </Button>
            </div>
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hello {{first_name}}, ..."
              className="min-h-[240px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailOpen(false)} disabled={sending}>Cancel</Button>
            <Button onClick={handleBroadcast} disabled={sending} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const paymentBadge = (status: string) => (
  <Badge className={cn("border-0 text-[10px] font-bold uppercase", status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
    {status === "success" ? "Paid" : "Pending"}
  </Badge>
);

const statusBadge = (status: string) => (
  <Badge className={cn("border-0 text-[10px] font-bold uppercase", status === "submitted" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600")}>
    {status.replace(/_/g, " ")}
  </Badge>
);

export default ScholarshipApplications;
