export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Row helpers ──────────────────────────────────────────────────────────────
// For tables where we only need the client to accept any shape, use a
// permissive Row type.  Fully-typed Rows are provided for the core
// vetting-engine tables.

type AnyRow   = Record<string, any>  // eslint-disable-line @typescript-eslint/no-explicit-any
type AnyWrite = Record<string, any>  // eslint-disable-line @typescript-eslint/no-explicit-any

interface GenericTable {
  Row: AnyRow
  Insert: AnyWrite
  Update: AnyWrite
}

// ── Database definition ──────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      // ── Core auth / user ─────────────────────────────────────────────
      user_roles: GenericTable

      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: AnyWrite
        Update: AnyWrite
      }

      // ── Talent (legacy) ──────────────────────────────────────────────
      talents: {
        Row: {
          id: string
          user_id: string
          talent_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          country: string | null
          timezone: string | null
          preferred_working_hours: string | null
          primary_role: string | null
          role_category: string | null
          secondary_skills: string[] | null
          years_of_experience: number | null
          tools_familiar_with: string[] | null
          languages_spoken: string[] | null
          availability: string | null
          cv_url: string | null
          government_id_url: string | null
          proof_of_address_url: string | null
          nda_agreed: boolean
          terms_agreed: boolean
          bank_details: Json | null
          vetting_status: string
          onboarding_completed: boolean
          onboarding_step: number
          assigned_manager: string | null
          overall_skill_level: string | null
          skill_assessment_notes: string | null
          skill_assessment_visible_to_clients: boolean | null
          current_step: number
          onboarding_status: string
          last_saved_step: number | null
          completed_steps: number[] | null
          onboarding_meta: Json | null
          profile_completion: number | null
          profile_change_status: string | null
          changed_sections: string[] | null
          draft_profile: Json | null
          headline: string | null
          short_bio: string | null
          portfolio_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: AnyWrite
        Update: AnyWrite
      }

      talent_work_history: GenericTable
      talent_education: GenericTable
      talent_certifications: GenericTable
      talent_references: GenericTable
      talent_vetting: GenericTable
      talent_profile_steps: GenericTable
      step_change_requests: GenericTable
      talent_profile_reviews: GenericTable

      // ── Vetting Engine (new) ─────────────────────────────────────────
      talent_profiles: {
        Row: {
          id: string
          user_id: string
          status: string
          completion_percent: number
          last_action_at: string
          locked_onboarding: boolean
          visibility_to_clients: boolean
          vetting_level: string | null
          assigned_admin_id: string | null
          submitted_at: string | null
          vetted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: AnyWrite
        Update: AnyWrite
      }

      talent_profile_sections: {
        Row: {
          id: string
          user_id: string
          section_key: string
          status: string
          data: Json
          requested_changes: Json | null
          requested_by_admin_id: string | null
          submitted_at: string | null
          approved_at: string | null
          updated_at: string
        }
        Insert: AnyWrite
        Update: AnyWrite
      }

      vetting_actions: GenericTable

      // ── Clients ──────────────────────────────────────────────────────
      clients: GenericTable

      // ── Jobs ─────────────────────────────────────────────────────────
      jobs: GenericTable
      job_applications: GenericTable

      // ── Offers & Contracts ───────────────────────────────────────────
      offers: GenericTable
      contracts: GenericTable

      // ── Time & Billing ───────────────────────────────────────────────
      timesheets: GenericTable
      timesheet_entries: GenericTable
      invoices: GenericTable
      talent_invoices: GenericTable

      // ── Communication ────────────────────────────────────────────────
      messages: GenericTable
      notifications: GenericTable
      support_tickets: GenericTable

      // ── Admin RBAC ───────────────────────────────────────────────────
      admin_users: GenericTable
      roles: GenericTable
      permissions: GenericTable
      role_permissions: GenericTable
      admin_roles: GenericTable
      admin_permission_overrides: GenericTable
      admin_invites: GenericTable
      audit_logs: GenericTable

      // ── Settings / Misc ──────────────────────────────────────────────
      agreement_templates: GenericTable
      consultations: GenericTable
      payouts: GenericTable
      payout_items: GenericTable
      support_ticket_replies: GenericTable
      admin_invoice_items: GenericTable
      admin_invoices: GenericTable
      platform_settings: GenericTable
      app_settings: {
        Row: { key: string; value: string; updated_at: string }
        Insert: AnyWrite
        Update: AnyWrite
      }

      // ── V2 Vetting System ────────────────────────────────────────────
      v2_talent_profiles: {
        Row: {
          id: string
          user_id: string
          talent_id: string | null
          status: string
          vetting_level: number | null
          assigned_talent_manager: string | null
          submitted_at: string | null
          vetted_at: string | null
          progress_percent: number
          locked_onboarding: boolean
          visible_to_clients: boolean
          created_at: string
          updated_at: string
        }
        Insert: AnyWrite
        Update: AnyWrite
      }
      v2_profile_sections: {
        Row: {
          id: string
          user_id: string
          section_key: string
          status: string
          data: Json
          last_saved_at: string | null
          submitted_at: string | null
          approved_at: string | null
          requested_changes: Json
          updated_at: string
        }
        Insert: AnyWrite
        Update: AnyWrite
      }
      v2_documents: GenericTable
      v2_vetting_actions: {
        Row: {
          id: string
          user_id: string
          admin_id: string | null
          action: string
          section_key: string | null
          note: string | null
          meta: Json
          created_at: string
        }
        Insert: AnyWrite
        Update: AnyWrite
      }
      v2_notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          payload: Json
          read: boolean
          created_at: string
        }
        Insert: AnyWrite
        Update: AnyWrite
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_section_data: {
        Args: {
          p_section_key: string
          p_data: Json
          p_completion_percent: number
        }
        Returns: void
      }
      submit_talent_onboarding: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      admin_start_review: {
        Args: {
          p_talent_user_id: string
        }
        Returns: void
      }
      admin_approve_section: {
        Args: {
          p_talent_user_id: string
          p_section_key: string
        }
        Returns: void
      }
      admin_request_changes: {
        Args: {
          p_talent_user_id: string
          p_section_key: string
          p_changes_note: string
          p_fields: string[]
        }
        Returns: void
      }
      resubmit_sections: {
        Args: {
          p_section_keys: string[]
        }
        Returns: void
      }
      admin_finalize_vetting: {
        Args: {
          p_talent_user_id: string
          p_vetting_level: string
        }
        Returns: void
      }
      // ── V2 RPCs ────────────────────────────────────────────────────
      v2_save_section_data: {
        Args: {
          p_section_key: string
          p_data: Json
        }
        Returns: Json
      }
      v2_submit_profile: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      v2_admin_start_review: {
        Args: {
          p_talent_user_id: string
        }
        Returns: Json
      }
      v2_admin_approve_section: {
        Args: {
          p_talent_user_id: string
          p_section_key: string
          p_note?: string
        }
        Returns: Json
      }
      v2_admin_request_changes: {
        Args: {
          p_talent_user_id: string
          p_section_key: string
          p_note: string
          p_fields?: string[]
        }
        Returns: Json
      }
      v2_talent_resubmit_sections: {
        Args: {
          p_section_keys: string[]
        }
        Returns: Json
      }
      v2_admin_finalize_vetting: {
        Args: {
          p_talent_user_id: string
          p_vetting_level: number
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: {
          _user_id: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: {
          p_key: string
        }
        Returns: boolean
      }
      get_admin_permissions: {
        Args: {
          p_admin_id: string
        }
        Returns: string[]
      }
    }
    Enums: {
      app_role: 'super_admin' | 'operations_admin' | 'vetting_admin' | 'finance_admin' | 'support_admin' | 'client' | 'talent'
      vetting_status: 'pending' | 'approved' | 'rejected' | 'needs_clarification'
      talent_status: 'unvetted' | 'partially_vetted' | 'fully_vetted' | 'draft' | 'submitted' | 'in_review' | 'changes_requested'
      job_status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'published' | 'filled' | 'closed'
      contract_status: 'pending' | 'active' | 'paused' | 'completed' | 'terminated'
      offer_status: 'pending' | 'sent_to_admin' | 'contract_generated' | 'sent_to_client' | 'signed' | 'rejected'
      timesheet_status: 'draft' | 'submitted' | 'approved' | 'rejected'
      invoice_status: 'pending' | 'sent' | 'paid' | 'overdue'
      ticket_status: 'open' | 'in_progress' | 'resolved' | 'closed'
      education_level: 'secondary_school' | 'diploma' | 'bachelors' | 'masters' | 'doctorate' | 'other'
      availability_type: 'full_time' | 'part_time'
      skill_level: 'junior' | 'mid' | 'senior' | 'lead'
      step_status: 'not_started' | 'incomplete' | 'submitted' | 'in_review' | 'changes_requested' | 'approved'
      talent_profile_status: 'DRAFT' | 'SUBMITTED' | 'VETTING_IN_PROGRESS' | 'CHANGES_REQUESTED' | 'RESUBMITTED' | 'VETTED' | 'REJECTED' | 'SUSPENDED'
      profile_section_status: 'NOT_STARTED' | 'COMPLETED' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'RESUBMITTED'
      admin_status: 'invited' | 'active' | 'suspended'
      invite_status: 'sent' | 'accepted' | 'expired' | 'revoked'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
