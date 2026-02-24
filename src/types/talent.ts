export type TalentVettingStatus = 
  | "draft" 
  | "submitted" 
  | "in_review" 
  | "changes_requested" 
  | "approved" 
  | "rejected";

export type StepStatus = 
  | "not_started" 
  | "incomplete" 
  | "submitted" 
  | "in_review" 
  | "changes_requested" 
  | "approved";

export type SkillLevel = "junior" | "mid" | "senior" | "lead";

export interface TalentProfileStep {
  id: string;
  talent_id: string;
  step_key: string;
  status: StepStatus;
  last_submitted_at: string | null;
  last_reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StepChangeRequest {
  id: string;
  talent_id: string;
  step_key: string;
  message: string;
  created_by: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

export interface TalentVettingData {
  talent: any; // Basic talent info
  steps: TalentProfileStep[];
  changeRequests: StepChangeRequest[];
}

export interface ClientTalentProfileData {
  talent_id: string;
  full_name: string;
  avatar: string | null;
  primary_role: string;
  skill_level: SkillLevel;
  vetting_status: TalentVettingStatus;
  location: string;
  timezone: string;
  years_experience: number;
  availability: string;
  about: string;
  skills: string[];
  tools: string[];
  languages: string[];
  work_history: {
    id: string;
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    year: string;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
  }[];
  references: {
    id: string;
    name: string;
    company: string;
  }[];
}
