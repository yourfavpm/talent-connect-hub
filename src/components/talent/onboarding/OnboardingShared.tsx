import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import clsx from "clsx";
import { RoleSelector } from "./RoleSelector";
import { TimezoneSelector } from "./TimezoneSelector";
import { CountrySelector } from "./CountrySelector";
import { TagInput } from "@/components/ui/tag-input";

// ── Reusable primitives ────────────────────────────────────────────────────

// ── Reusable primitives ────────────────────────────────────────────────────

import { STEPS, SECTION_KEYS, OB_INPUT_CLASS } from "./onboarding_config";

// Re-export STEPS and SECTION_KEYS for use in other components
export { STEPS, SECTION_KEYS };

export const FieldGroup = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-0.5">
    <Label className="text-[9px] font-medium text-slate-400 uppercase tracking-widest pl-0.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

export const CardBlock = ({ children, onDelete, disabled }: { children: React.ReactNode; onDelete?: () => void; disabled?: boolean }) => (
  <div className="relative p-4 bg-white border border-slate-100/50 rounded-xl group shadow-[0_2px_8px_-4px_rgba(0,0,0,0.01)]">
    {onDelete && !disabled && (
      <button type="button" onClick={onDelete} className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    )}
    {children}
  </div>
);

export const AddButton = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => {
  if (disabled) return null;
  return (
    <button type="button" onClick={onClick} className="w-full h-9 border border-dashed border-slate-200 rounded-xl text-[11px] font-medium text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all flex items-center justify-center gap-2 hover:bg-slate-50/30">
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
};

export interface FileUploadRowProps {
  label: string; hint: string; accept: string;
  uploaded: boolean; uploading: boolean; disabled?: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUploadRow = ({ label, hint, accept, uploaded, uploading, disabled, onUpload }: FileUploadRowProps) => (
  <div className="flex items-center justify-between p-4 bg-white border border-slate-100/50 rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)]">
    <div className="min-w-0 pr-4">
      <p className="text-[13px] font-medium text-slate-700 truncate">{label}</p>
      <p className="text-[11px] text-slate-400 mt-0.5 font-light truncate">{hint}</p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {uploaded && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
      {!disabled && (
        <label className={clsx(
          "cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium uppercase tracking-wider transition-all",
          uploaded ? "bg-slate-100 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
        )}>
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
          {uploaded ? "Replace" : "Upload"}
          <input type="file" accept={accept} onChange={onUpload} className="hidden" disabled={uploading || disabled} />
        </label>
      )}
    </div>
  </div>
);

// ── Zod Schema (same fields as V1/V2) ────────────────────────────────────────

export const onboardSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(5, "Phone number is required"),
  country: z.string().min(2, "Country is required"),
  timezone: z.string().min(1, "Timezone is required"),
  primaryRole: z.string().min(1, "Primary role is required"),
  headline: z.string().min(10, "Headline must be at least 10 characters"),
  shortBio: z.string().min(20, "Bio must be at least 20 characters"),
  yearsOfExperience: z.string().min(1, "Experience is required"),
  availability: z.string().min(1, "Availability is required"),
  roleCategory: z.string().min(1, "Role category is required"),
  secondarySkills: z.array(z.string()).default([]),
  toolsFamiliarWith: z.array(z.string()).default([]),
  languagesSpoken: z.array(z.string()).default([]),
  industryFocus: z.array(z.string()).default([]),
  functionalAreas: z.array(z.string()).default([]),
  governmentIdUrl: z.string().min(1, "Government ID is required"),
  cvUrl: z.string().min(1, "Resume/CV is required"),
  proofOfAddressUrl: z.string().min(1, "Proof of address is required"),
  portfolioUrl: z.string().optional(),
  workHistory: z.array(z.object({
    id: z.string(), companyName: z.string().min(2, "Company name required"),
    roleTitle: z.string().min(2, "Role title required"),
    roleDescription: z.string().optional(),
    startDate: z.string().optional(), endDate: z.string().optional(),
    isCurrent: z.boolean().default(false),
  })).default([]),
  education: z.array(z.object({
    id: z.string(), institutionName: z.string().min(2, "Institution required"),
    degree: z.string().min(2, "Degree required"),
    startYear: z.string().optional(), endYear: z.string().optional(),
    isCurrent: z.boolean().default(false),
  })).default([]),
  certifications: z.array(z.object({
    id: z.string(), certificationName: z.string().min(2, "Certification name required"),
    issuer: z.string().optional(), yearObtained: z.string().optional(),
    fileUrl: z.string().optional(),
  })).default([]),
  references: z.array(z.object({
    id: z.string(), name: z.string().min(2, "Name required"),
    company: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
  })).default([]),
});

export type OnboardFormValues = z.infer<typeof onboardSchema>;

export function getSectionData(step: number, values: OnboardFormValues): Record<string, unknown> {
  switch (step) {
    case 1: return { firstName: values.firstName, lastName: values.lastName, phone: values.phone, country: values.country, timezone: values.timezone, languagesSpoken: values.languagesSpoken };
    case 2: return { roleCategory: values.roleCategory, primaryRole: values.primaryRole, headline: values.headline, shortBio: values.shortBio, yearsOfExperience: values.yearsOfExperience, availability: values.availability, secondarySkills: values.secondarySkills, toolsFamiliarWith: values.toolsFamiliarWith, industryFocus: values.industryFocus, functionalAreas: values.functionalAreas };
    case 3: return { workHistory: values.workHistory };
    case 4: return { cvUrl: values.cvUrl, governmentIdUrl: values.governmentIdUrl, proofOfAddressUrl: values.proofOfAddressUrl, portfolioUrl: values.portfolioUrl };
    case 5: return { education: values.education };
    case 6: return { certifications: values.certifications };
    case 7: return { references: values.references };
    default: return {};
  }
}

// ── Form Section Components ──────────────────────────────────────────────────

export const BasicInfoForm = ({ disabled }: { disabled?: boolean }) => {
  const { watch, setValue } = useFormContext<OnboardFormValues>();
  const formData = watch();
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <FieldGroup label="First Name" required>
          <Input className={OB_INPUT_CLASS} value={formData.firstName} onChange={e => setValue("firstName", e.target.value)} placeholder="John" disabled={disabled} />
        </FieldGroup>
        <FieldGroup label="Last Name" required>
          <Input className={OB_INPUT_CLASS} value={formData.lastName} onChange={e => setValue("lastName", e.target.value)} placeholder="Doe" disabled={disabled} />
        </FieldGroup>
      </div>
      <FieldGroup label="Email" required>
        <Input className={OB_INPUT_CLASS} value={formData.email} disabled placeholder="email@example.com" />
      </FieldGroup>
      <div className="grid md:grid-cols-2 gap-4">
        <FieldGroup label="Phone" required>
          <Input className={OB_INPUT_CLASS} value={formData.phone} onChange={e => setValue("phone", e.target.value)} placeholder="+234..." disabled={disabled} />
        </FieldGroup>
        <FieldGroup label="Country" required>
          <CountrySelector value={formData.country} onChange={v => setValue("country", v)} disabled={disabled} />
        </FieldGroup>
      </div>
      <FieldGroup label="Timezone" required>
        <TimezoneSelector value={formData.timezone} onChange={v => setValue("timezone", v)} disabled={disabled} />
      </FieldGroup>
      <FieldGroup label="Languages Spoken">
        <TagInput 
          value={formData.languagesSpoken || []} 
          onChange={v => setValue("languagesSpoken", v)} 
          placeholder="English, Spanish, etc." 
          disabled={disabled} 
        />
      </FieldGroup>
    </div>
  );
};

export const ProfessionalDetailsForm = ({ disabled }: { disabled?: boolean }) => {
  const { watch, setValue } = useFormContext<OnboardFormValues>();
  const formData = watch();
  return (
    <div className="space-y-6">
      <FieldGroup label="Role Category & Primary Role" required>
        <RoleSelector
          category={formData.roleCategory} onCategoryChange={v => setValue("roleCategory", v)}
          value={formData.primaryRole} onChange={v => setValue("primaryRole", v)}
          disabled={disabled}
        />
      </FieldGroup>
      <FieldGroup label="Headline" required>
        <Input className={OB_INPUT_CLASS} value={formData.headline} onChange={e => setValue("headline", e.target.value)} placeholder="Senior React Developer" disabled={disabled} />
      </FieldGroup>
      <FieldGroup label="Short Bio" required>
        <Textarea className="min-h-[80px] rounded-lg border border-slate-100 bg-white focus:border-slate-800 disabled:opacity-50 disabled:bg-slate-50 text-[12px] font-light placeholder:text-slate-200" value={formData.shortBio} onChange={e => setValue("shortBio", e.target.value)} placeholder="Tell us about yourself..." disabled={disabled} />
      </FieldGroup>
      <div className="grid md:grid-cols-2 gap-4">
        <FieldGroup label="Years of Experience" required>
          <Select value={formData.yearsOfExperience} onValueChange={v => setValue("yearsOfExperience", v)} disabled={disabled}>
            <SelectTrigger className={OB_INPUT_CLASS}><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {["0-1", "1-3", "3-5", "5-10", "10+"].map(y => <SelectItem key={y} value={y}>{y} years</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>
        <FieldGroup label="Availability" required>
          <Select value={formData.availability} onValueChange={v => setValue("availability", v)} disabled={disabled}>
            <SelectTrigger className={OB_INPUT_CLASS}><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full-Time</SelectItem>
              <SelectItem value="part_time">Part-Time</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>
      </div>
      <FieldGroup label="Secondary Skills">
        <TagInput 
          value={formData.secondarySkills || []} 
          onChange={v => setValue("secondarySkills", v)} 
          placeholder="React, Node.js, PostgreSQL" 
          disabled={disabled} 
        />
      </FieldGroup>
      <FieldGroup label="Tools & Software">
        <TagInput 
          value={formData.toolsFamiliarWith || []} 
          onChange={v => setValue("toolsFamiliarWith", v)} 
          placeholder="VS Code, Figma, Jira" 
          disabled={disabled} 
        />
      </FieldGroup>
    </div>
  );
};

export const WorkHistoryForm = ({ disabled }: { disabled?: boolean }) => {
  const { control, watch, setValue } = useFormContext<OnboardFormValues>();
  const formData = watch();
  const { fields, append, remove } = useFieldArray({ control, name: "workHistory" });
  
  return (
    <div className="space-y-4">
      {fields.map((field, idx) => (
        <CardBlock key={field.id} onDelete={() => remove(idx)} disabled={disabled || fields.length <= 1}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="Company Name" required>
                <Input className={OB_INPUT_CLASS} value={formData.workHistory?.[idx]?.companyName || ""} onChange={e => setValue(`workHistory.${idx}.companyName`, e.target.value)} disabled={disabled} />
              </FieldGroup>
              <FieldGroup label="Role Title" required>
                <Input className={OB_INPUT_CLASS} value={formData.workHistory?.[idx]?.roleTitle || ""} onChange={e => setValue(`workHistory.${idx}.roleTitle`, e.target.value)} disabled={disabled} />
              </FieldGroup>
            </div>
            <FieldGroup label="Description">
              <Textarea className="rounded-lg border border-slate-200 bg-white disabled:opacity-50 disabled:bg-slate-50" value={formData.workHistory?.[idx]?.roleDescription || ""} onChange={e => setValue(`workHistory.${idx}.roleDescription`, e.target.value)} disabled={disabled} />
            </FieldGroup>
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="Start Date">
                <Input type="date" className={OB_INPUT_CLASS} value={formData.workHistory?.[idx]?.startDate || ""} onChange={e => setValue(`workHistory.${idx}.startDate`, e.target.value)} disabled={disabled} />
              </FieldGroup>
              <FieldGroup label="End Date">
                <Input type="date" className={OB_INPUT_CLASS} value={formData.workHistory?.[idx]?.endDate || ""} onChange={e => setValue(`workHistory.${idx}.endDate`, e.target.value)} disabled={disabled || formData.workHistory?.[idx]?.isCurrent} />
              </FieldGroup>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.workHistory?.[idx]?.isCurrent || false} onCheckedChange={checked => setValue(`workHistory.${idx}.isCurrent`, !!checked)} disabled={disabled} />
              <span className="text-sm text-slate-600">I currently work here</span>
            </div>
          </div>
        </CardBlock>
      ))}
      <AddButton label="Add Work Experience" onClick={() => append({ id: Date.now().toString(), companyName: "", roleTitle: "", roleDescription: "", startDate: "", endDate: "", isCurrent: false })} disabled={disabled} />
    </div>
  );
};

export const DocumentsForm = ({ disabled, uploadingFields, onUpload }: { disabled?: boolean; uploadingFields: Record<string, boolean>; onUpload: (e: React.ChangeEvent<HTMLInputElement>, field: keyof OnboardFormValues) => void }) => {
  const { watch, setValue } = useFormContext<OnboardFormValues>();
  const formData = watch();

  return (
    <div className="space-y-4">
      <FileUploadRow label="Resume / CV" hint="PDF or DOCX" accept=".pdf,.doc,.docx" uploaded={!!formData.cvUrl} uploading={!!uploadingFields.cvUrl} disabled={disabled} onUpload={e => onUpload(e, "cvUrl")} />
      <FileUploadRow label="Government ID" hint="Passport, National ID, or Driver's License" accept=".pdf,.jpg,.png" uploaded={!!formData.governmentIdUrl} uploading={!!uploadingFields.governmentIdUrl} disabled={disabled} onUpload={e => onUpload(e, "governmentIdUrl")} />
      <FileUploadRow label="Proof of Address" hint="Utility bill or bank statement" accept=".pdf,.jpg,.png" uploaded={!!formData.proofOfAddressUrl} uploading={!!uploadingFields.proofOfAddressUrl} disabled={disabled} onUpload={e => onUpload(e, "proofOfAddressUrl")} />
      <FieldGroup label="Portfolio URL (optional)">
        <Input className={OB_INPUT_CLASS} value={formData.portfolioUrl || ""} onChange={e => setValue("portfolioUrl", e.target.value)} placeholder="https://..." disabled={disabled} />
      </FieldGroup>
    </div>
  );
};

export const EducationForm = ({ disabled }: { disabled?: boolean }) => {
  const { control, watch, setValue } = useFormContext<OnboardFormValues>();
  const formData = watch();
  const { fields, append, remove } = useFieldArray({ control, name: "education" });

  return (
    <div className="space-y-4">
      {fields.map((field, idx) => (
        <CardBlock key={field.id} onDelete={() => remove(idx)} disabled={disabled || fields.length <= 1}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="Institution" required>
                <Input className={OB_INPUT_CLASS} value={formData.education?.[idx]?.institutionName || ""} onChange={e => setValue(`education.${idx}.institutionName`, e.target.value)} disabled={disabled} />
              </FieldGroup>
              <FieldGroup label="Degree / Qualification" required>
                <Input className={OB_INPUT_CLASS} value={formData.education?.[idx]?.degree || ""} onChange={e => setValue(`education.${idx}.degree`, e.target.value)} disabled={disabled} />
              </FieldGroup>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="Start Year">
                <Input className={OB_INPUT_CLASS} value={formData.education?.[idx]?.startYear || ""} onChange={e => setValue(`education.${idx}.startYear`, e.target.value)} placeholder="2018" disabled={disabled} />
              </FieldGroup>
              <FieldGroup label="End Year">
                <Input className={OB_INPUT_CLASS} value={formData.education?.[idx]?.endYear || ""} onChange={e => setValue(`education.${idx}.endYear`, e.target.value)} placeholder="2022" disabled={disabled || formData.education?.[idx]?.isCurrent} />
              </FieldGroup>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.education?.[idx]?.isCurrent || false} onCheckedChange={checked => setValue(`education.${idx}.isCurrent`, !!checked)} disabled={disabled} />
              <span className="text-sm text-slate-600">I'm currently studying here</span>
            </div>
          </div>
        </CardBlock>
      ))}
      <AddButton label="Add Education" onClick={() => append({ id: Date.now().toString(), institutionName: "", degree: "", startYear: "", endYear: "", isCurrent: false })} disabled={disabled} />
    </div>
  );
};

export const CertificationsForm = ({ disabled }: { disabled?: boolean }) => {
  const { control, watch, setValue } = useFormContext<OnboardFormValues>();
  const formData = watch();
  const { fields, append, remove } = useFieldArray({ control, name: "certifications" });

  return (
    <div className="space-y-4">
      {fields.map((field, idx) => (
        <CardBlock key={field.id} onDelete={() => remove(idx)} disabled={disabled || fields.length <= 1}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="Certification Name" required>
                <Input className={OB_INPUT_CLASS} value={formData.certifications?.[idx]?.certificationName || ""} onChange={e => setValue(`certifications.${idx}.certificationName`, e.target.value)} disabled={disabled} />
              </FieldGroup>
              <FieldGroup label="Issuing Organization">
                <Input className={OB_INPUT_CLASS} value={formData.certifications?.[idx]?.issuer || ""} onChange={e => setValue(`certifications.${idx}.issuer`, e.target.value)} disabled={disabled} />
              </FieldGroup>
            </div>
            <FieldGroup label="Year Obtained">
              <Input className={OB_INPUT_CLASS} value={formData.certifications?.[idx]?.yearObtained || ""} onChange={e => setValue(`certifications.${idx}.yearObtained`, e.target.value)} placeholder="2023" disabled={disabled} />
            </FieldGroup>
          </div>
        </CardBlock>
      ))}
      <AddButton label="Add Certification" onClick={() => append({ id: Date.now().toString(), certificationName: "", issuer: "", yearObtained: "", fileUrl: "" })} disabled={disabled} />
    </div>
  );
};

export const ReferencesForm = ({ disabled }: { disabled?: boolean }) => {
  const { control, watch, setValue } = useFormContext<OnboardFormValues>();
  const formData = watch();
  const { fields, append, remove } = useFieldArray({ control, name: "references" });

  return (
    <div className="space-y-4">
      {fields.map((field, idx) => (
        <CardBlock key={field.id} onDelete={() => remove(idx)} disabled={disabled || fields.length <= 1}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="Full Name" required>
                <Input className={OB_INPUT_CLASS} value={formData.references?.[idx]?.name || ""} onChange={e => setValue(`references.${idx}.name`, e.target.value)} disabled={disabled} />
              </FieldGroup>
              <FieldGroup label="Company">
                <Input className={OB_INPUT_CLASS} value={formData.references?.[idx]?.company || ""} onChange={e => setValue(`references.${idx}.company`, e.target.value)} disabled={disabled} />
              </FieldGroup>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="Email">
                <Input className={OB_INPUT_CLASS} value={formData.references?.[idx]?.email || ""} onChange={e => setValue(`references.${idx}.email`, e.target.value)} disabled={disabled} />
              </FieldGroup>
              <FieldGroup label="Phone">
                <Input className={OB_INPUT_CLASS} value={formData.references?.[idx]?.phone || ""} onChange={e => setValue(`references.${idx}.phone`, e.target.value)} disabled={disabled} />
              </FieldGroup>
            </div>
          </div>
        </CardBlock>
      ))}
      <AddButton label="Add Reference" onClick={() => append({ id: Date.now().toString(), name: "", company: "", email: "", phone: "" })} disabled={disabled} />
    </div>
  );
};
