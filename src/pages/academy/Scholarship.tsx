import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PaystackService } from "@/lib/paystack";

const SCHOLARSHIP_FEE_NAIRA = 5000;
const SCHOLARSHIP_FEE_KOBO = SCHOLARSHIP_FEE_NAIRA * 100;

const programs = [
  "Virtual Assistance",
  "Customer Support Operations",
  "AI Automation",
  "Project Management",
];

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  state: string;
  age: string;
  gender: string;
  universityName: string;
  educationStatus: string;
  currentOccupation: string;
  program: string;
  careerGoal: string;
};

const EMPTY_FORM: FormData = {
  fullName: "",
  email: "",
  phone: "",
  state: "",
  age: "",
  gender: "",
  universityName: "",
  educationStatus: "",
  currentOccupation: "",
  program: "",
  careerGoal: "",
};

const Scholarship = () => {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Paystack handles its own loading
  }, []);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment_status");
    const reference = searchParams.get("reference");
    const applicationId = searchParams.get("session_id");

    if (paymentStatus === "success" && reference && applicationId) {
      const saved = localStorage.getItem("scholarship_pending");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setForm(parsed.form || EMPTY_FORM);
        } catch {
          // Ignore malformed recovery data.
        }
      }
      finalizeApplication(applicationId, reference);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const firstName = useMemo(() => form.fullName.trim().split(" ")[0] || "there", [form.fullName]);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<FormData> = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = "Valid email is required";
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required";
    if (!form.state.trim()) nextErrors.state = "Location is required";
    if (!form.age || Number(form.age) < 16) nextErrors.age = "Enter a valid age";
    if (!form.gender) nextErrors.gender = "Select an option";
    if (!form.universityName.trim()) nextErrors.universityName = "University name is required";
    if (!form.educationStatus) nextErrors.educationStatus = "Select your education status";
    if (!form.program) nextErrors.program = "Select a training track";
    if (form.careerGoal.trim().length < 30) nextErrors.careerGoal = "Write at least 30 characters";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createPendingApplication = async () => {
    const { data, error } = await (supabase.from("scholarship_applications") as any)
      .insert({
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        state: form.state.trim(),
        age: Number(form.age),
        gender: form.gender,
        university_name: form.universityName.trim(),
        education_status: form.educationStatus,
        current_occupation: form.currentOccupation.trim(),
        program_of_interest: form.program,
        why_scholarship: "N/A",
        career_goal: form.careerGoal.trim(),
        commitment_statement: "N/A",
        payment_provider: "paystack",
        payment_status: "pending",
        application_status: "pending_payment",
      })
      .select("id")
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned from insert");
    return data.id as string;
  };

  const sendConfirmationEmail = async (reference: string, email = form.email, name = form.fullName) => {
    const resolvedName = name.trim() || "there";
    await supabase.functions.invoke("send-email", {
      body: {
        templateKey: "scholarship_application_received",
        to: email.trim().toLowerCase(),
        variables: {
          firstName: resolvedName.split(" ")[0] || "there",
          studentName: resolvedName,
          reference,
        },
      },
    });
  };

  const finalizeApplication = async (applicationId: string, reference: string) => {
    setProcessing(true);
    try {
      const { data, error } = await (supabase.from("scholarship_applications") as any)
        .update({
          payment_reference: reference,
          payment_provider: "paystack",
          payment_status: "success",
          application_status: "submitted",
          paid_at: new Date().toISOString(),
        })
        .eq("id", applicationId)
        .select("full_name, email")
        .maybeSingle();

      if (error) throw error;

      if (data?.full_name || data?.email) {
        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || data.full_name || "",
          email: prev.email || data.email || "",
        }));
      }

      await sendConfirmationEmail(reference, data?.email || form.email, data?.full_name || form.fullName);
      localStorage.removeItem("scholarship_pending");
      setSuccess(true);
    } catch (err: any) {
      console.error("Scholarship finalization error:", err);
      toast({
        title: "Payment received",
        description: "We received your payment, but could not finish syncing the application. Our team will reconcile it.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!validate()) {
      toast({
        title: "Almost there",
        description: "Please complete the highlighted fields before payment.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!paystackPublicKey) throw new Error("Paystack public key is not configured.");

      const applicationId = await createPendingApplication();
      const reference = `SCH-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      localStorage.setItem("scholarship_pending", JSON.stringify({ applicationId, reference, form }));

      const paystack = new PaystackService({ publicKey: paystackPublicKey });
      await paystack.initializePayment({
        amount: SCHOLARSHIP_FEE_KOBO,
        email: form.email.trim().toLowerCase(),
        reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Application",
              variable_name: "application",
              value: "Scholarship"
            }
          ],
          course_id: "scholarship-application",
          cohort_id: applicationId,
          checkout_session_id: applicationId,
          student_name: form.fullName.trim(),
        },
        onSuccess: async (response) => {
          await finalizeApplication(applicationId, response.reference || reference);
        },
        onClose: () => {
          setProcessing(false);
          toast({ title: "Payment cancelled", description: "Your application has not been submitted yet." });
        },
      });
    } catch (err: any) {
      console.error("Scholarship payment error:", err);
      toast({
        title: "Could not start payment",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-[#f7fbff] px-4 py-28">
        <BackgroundDiagrams />
        <section className="relative mx-auto max-w-2xl rounded-[28px] border border-blue-100 bg-white p-8 text-center shadow-xl shadow-blue-950/5">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-500">Application received</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">Thank you, {firstName}.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
            Your scholarship application and application fee have been received. A confirmation email has been sent to{" "}
            <span className="font-semibold text-slate-800">{form.email}</span>.
          </p>
          <a
            href="/scholarship"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
          >
            Submit another application
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff] px-4 pb-20 pt-28 font-inter">
      <BackgroundDiagrams />

      <section className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-blue-100 bg-white/90 p-6 shadow-lg shadow-blue-950/5 backdrop-blur"
          >
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">Apply for the OPSly Academy Scholarship</h1>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              This scholarship is designed to help undergraduates and recent graduates build digital skills for global opportunities, preparing them for remote work and international careers.
            </p>
            <button
              onClick={() => document.getElementById("scholarship-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              Apply for Scholarship <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <div className="hidden lg:grid gap-3 lg:grid-cols-1">
            {programs.map((program) => (
              <div key={program} className="rounded-2xl border border-blue-100 bg-white/80 p-4 text-sm font-semibold text-slate-700">
                {program}
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 text-sm text-slate-500">
            <p className="font-bold text-slate-900">What happens next?</p>
            <p className="mt-2 leading-6">
              To ensure we only process dedicated candidates, a non-refundable commitment fee of ₦{SCHOLARSHIP_FEE_NAIRA.toLocaleString()} is required upon submission. Once paid, the admission team will review the application and send admission and class schedule.
            </p>
          </div>
        </aside>

        <section id="scholarship-form" className="space-y-5">
          <FormSection title="Applicant Details" icon={User}>
            <Field label="Full name" error={errors.fullName} icon={User}>
              <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={inputClass(errors.fullName)} placeholder="Your full name" />
            </Field>
            <Field label="Email address" error={errors.email} icon={Mail}>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass(errors.email)} placeholder="you@example.com" />
            </Field>
            <Field label="Phone number" error={errors.phone} icon={Phone}>
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass(errors.phone)} placeholder="+234..." />
            </Field>
            <Field label="State / location" error={errors.state} icon={MapPin}>
              <input value={form.state} onChange={(e) => update("state", e.target.value)} className={inputClass(errors.state)} placeholder="Lagos" />
            </Field>
            <Field label="Age" error={errors.age}>
              <input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} className={inputClass(errors.age)} placeholder="21" />
            </Field>
            <Field label="Gender" error={errors.gender}>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={inputClass(errors.gender)}>
                <option value="" className="bg-white text-slate-900">Select</option>
                <option value="female" className="bg-white text-slate-900">Female</option>
                <option value="male" className="bg-white text-slate-900">Male</option>
                <option value="prefer_not_to_say" className="bg-white text-slate-900">Prefer not to say</option>
              </select>
            </Field>
          </FormSection>

          <FormSection title="Education & Track" icon={GraduationCap}>
            <Field label="University Name" error={errors.universityName} icon={GraduationCap}>
              <input value={form.universityName} onChange={(e) => update("universityName", e.target.value)} className={inputClass(errors.universityName)} placeholder="e.g. University of Lagos" />
            </Field>
            <Field label="Education Status" error={errors.educationStatus} icon={GraduationCap}>
              <select value={form.educationStatus} onChange={(e) => update("educationStatus", e.target.value)} className={inputClass(errors.educationStatus)}>
                <option value="" className="bg-white text-slate-900">Select status</option>
                <option value="studying" className="bg-white text-slate-900">Currently studying</option>
                <option value="graduate_less_2" className="bg-white text-slate-900">Graduate (less than 2 years)</option>
                <option value="graduate_more_2" className="bg-white text-slate-900">Graduate (more than 2 years)</option>
              </select>
            </Field>
            <Field label="Current occupation" icon={Briefcase}>
              <input value={form.currentOccupation} onChange={(e) => update("currentOccupation", e.target.value)} className={inputClass()} placeholder="Student, graduate, employed..." />
            </Field>
            <div className="md:col-span-2">
              <Field label="Preferred scholarship track" error={errors.program} icon={FileText}>
                <select value={form.program} onChange={(e) => update("program", e.target.value)} className={inputClass(errors.program)}>
                  <option value="" className="bg-white text-slate-900">Select a track</option>
                  {programs.map((program) => (
                    <option key={program} value={program} className="bg-white text-slate-900">{program}</option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Application Notes" icon={FileText}>
            <TextField label="What career outcome are you working toward?" error={errors.careerGoal} value={form.careerGoal} onChange={(v) => update("careerGoal", v)} />
          </FormSection>

          <button
            onClick={handleApply}
            disabled={processing}
            className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 transition-all"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Apply for Scholarship
          </button>
        </section>
      </section>
    </main>
  );
};

const BackgroundDiagrams = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute left-[-120px] top-24 h-72 w-72 rounded-full border border-blue-200/70" />
    <div className="absolute left-10 top-48 h-36 w-36 rounded-full border border-blue-300/60" />
    <div className="absolute right-[-80px] top-28 h-80 w-80 rounded-full border border-blue-200/70" />
    <div className="absolute right-16 top-44 grid grid-cols-4 gap-2 opacity-40">
      {Array.from({ length: 16 }).map((_, i) => <span key={i} className="h-2 w-2 rounded-full bg-blue-400" />)}
    </div>
    <div className="absolute bottom-20 left-1/3 h-px w-72 rotate-[-18deg] bg-blue-200" />
    <div className="absolute bottom-28 left-1/3 h-px w-44 rotate-[18deg] bg-blue-300" />
  </div>
);

const FormSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-lg shadow-blue-950/5 backdrop-blur"
  >
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2">{children}</div>
  </motion.div>
);

const Field = ({ label, error, icon: Icon, children }: { label: string; error?: string; icon?: any; children: ReactNode }) => (
  <label className="block rounded-2xl border-2 border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 bg-white p-4 transition-all">
    <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
      {Icon && <Icon className="h-3.5 w-3.5 text-blue-500" />}
      {label}
    </span>
    {children}
    {error && <span className="mt-2 block text-xs font-medium text-red-500">{error}</span>}
  </label>
);

const TextField = ({ label, error, value, onChange }: { label: string; error?: string; value: string; onChange: (value: string) => void }) => (
  <label className="block rounded-2xl border-2 border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 bg-white p-4 md:col-span-2 transition-all">
    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className="w-full resize-none bg-transparent text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-300"
      placeholder="Write a short, honest answer..."
    />
    {error && <span className="mt-2 block text-xs font-medium text-red-500">{error}</span>}
  </label>
);

const inputClass = (error?: string) =>
  `h-10 w-full bg-transparent text-base md:text-sm text-slate-900 outline-none placeholder:text-slate-300 ${error ? "text-red-700" : ""}`;

export default Scholarship;
