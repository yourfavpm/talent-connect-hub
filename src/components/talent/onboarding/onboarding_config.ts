import { BasicInfoForm, ProfessionalDetailsForm, WorkHistoryForm, DocumentsForm, EducationForm, CertificationsForm, ReferencesForm } from "./OnboardingShared";

export const OB_INPUT_CLASS = "h-8 rounded-lg border border-slate-100 bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-[12px] font-light placeholder:text-slate-300 disabled:opacity-50 disabled:bg-slate-50 transition-all";

export const STEPS = [
  { id: 1, title: "Basic Information",    key: "basic_info" },
  { id: 2, title: "Professional Details", key: "professional_details" },
  { id: 3, title: "Work History",         key: "work_history" },
  { id: 4, title: "Documents",            key: "documents" },
  { id: 5, title: "Education",            key: "education" },
  { id: 6, title: "Certifications",       key: "certifications" },
  { id: 7, title: "References",           key: "references" },
];

export const SECTION_KEYS = STEPS.map(s => s.key);
