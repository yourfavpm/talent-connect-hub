export type JobStatus =
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'published'
    | 'filled'
    | 'closed';

export type ApplicationStatus =
    | 'applied'
    | 'shortlisted'
    | 'interview_requested'
    | 'interview_scheduled'
    | 'offer_initiated'
    | 'offer_sent'
    | 'hired'
    | 'rejected'
    | 'invited';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'job_approved' | 'job_rejected' | 'new_application' | 'application_shortlisted' | 'interview_requested' | 'interview_scheduled' | 'offer_sent' | 'offer_accepted' | 'offer_rejected' | 'contract_ready' | 'job_submitted';
    read_at: string | null;
    action_url?: string;
    created_at: string;
}

export type UserRole = 'client' | 'talent' | 'admin' | 'super_admin';
