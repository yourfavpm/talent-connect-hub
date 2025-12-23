export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          billing_address: string | null
          client_id: string
          company_name: string
          company_size: string | null
          country: string | null
          created_at: string | null
          id: string
          industry: string | null
          preferred_currency: string | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string | null
          primary_contact_role: string | null
          status: Database["public"]["Enums"]["vetting_status"] | null
          terms_agreed: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          billing_address?: string | null
          client_id: string
          company_name: string
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          preferred_currency?: string | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone?: string | null
          primary_contact_role?: string | null
          status?: Database["public"]["Enums"]["vetting_status"] | null
          terms_agreed?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          billing_address?: string | null
          client_id?: string
          company_name?: string
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          preferred_currency?: string | null
          primary_contact_email?: string
          primary_contact_name?: string
          primary_contact_phone?: string | null
          primary_contact_role?: string | null
          status?: Database["public"]["Enums"]["vetting_status"] | null
          terms_agreed?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          admin_sent_at: string | null
          billing_details: Json | null
          client_id: string
          client_signed_at: string | null
          contract_number: string
          contract_terms: string | null
          created_at: string | null
          created_by: string
          end_date: string | null
          hourly_rate: number
          id: string
          offer_id: string
          role_title: string
          start_date: string
          status: Database["public"]["Enums"]["contract_status"] | null
          talent_id: string
          talent_rate: number
          talent_signed_at: string | null
          taskive_margin: number
          updated_at: string | null
          weekly_hours: number
        }
        Insert: {
          admin_sent_at?: string | null
          billing_details?: Json | null
          client_id: string
          client_signed_at?: string | null
          contract_number: string
          contract_terms?: string | null
          created_at?: string | null
          created_by: string
          end_date?: string | null
          hourly_rate: number
          id?: string
          offer_id: string
          role_title: string
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          talent_id: string
          talent_rate: number
          talent_signed_at?: string | null
          taskive_margin: number
          updated_at?: string | null
          weekly_hours: number
        }
        Update: {
          admin_sent_at?: string | null
          billing_details?: Json | null
          client_id?: string
          client_signed_at?: string | null
          contract_number?: string
          contract_terms?: string | null
          created_at?: string | null
          created_by?: string
          end_date?: string | null
          hourly_rate?: number
          id?: string
          offer_id?: string
          role_title?: string
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          talent_id?: string
          talent_rate?: number
          talent_signed_at?: string | null
          taskive_margin?: number
          updated_at?: string | null
          weekly_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          client_id: string
          contract_id: string | null
          created_at: string | null
          due_date: string
          hourly_rate: number
          id: string
          invoice_number: string
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          total_hours: number
          updated_at: string | null
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          client_id: string
          contract_id?: string | null
          created_at?: string | null
          due_date: string
          hourly_rate: number
          id?: string
          invoice_number: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          total_hours: number
          updated_at?: string | null
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          client_id?: string
          contract_id?: string | null
          created_at?: string | null
          due_date?: string
          hourly_rate?: number
          id?: string
          invoice_number?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          total_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          admin_notes: string | null
          cover_letter: string | null
          created_at: string | null
          id: string
          job_id: string
          shortlisted_by_admin: string | null
          status: string | null
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          shortlisted_by_admin?: string | null
          status?: string | null
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          shortlisted_by_admin?: string | null
          status?: string | null
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          admin_notes: string | null
          budget_max: number | null
          budget_min: number | null
          client_id: string
          created_at: string | null
          duration: string | null
          engagement_type:
            | Database["public"]["Enums"]["availability_type"]
            | null
          id: string
          published_at: string | null
          required_skills: string[] | null
          responsibilities: string | null
          role_needed: string
          special_notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at: string | null
          vetting_level_required: number | null
          weekly_hours: number | null
        }
        Insert: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_id: string
          created_at?: string | null
          duration?: string | null
          engagement_type?:
            | Database["public"]["Enums"]["availability_type"]
            | null
          id?: string
          published_at?: string | null
          required_skills?: string[] | null
          responsibilities?: string | null
          role_needed: string
          special_notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at?: string | null
          vetting_level_required?: number | null
          weekly_hours?: number | null
        }
        Update: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_id?: string
          created_at?: string | null
          duration?: string | null
          engagement_type?:
            | Database["public"]["Enums"]["availability_type"]
            | null
          id?: string
          published_at?: string | null
          required_skills?: string[] | null
          responsibilities?: string | null
          role_needed?: string
          special_notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string
          updated_at?: string | null
          vetting_level_required?: number | null
          weekly_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string
          duration: string | null
          hourly_rate: number
          id: string
          job_id: string | null
          role_title: string
          special_terms: string | null
          start_date: string
          status: Database["public"]["Enums"]["offer_status"] | null
          talent_id: string
          updated_at: string | null
          weekly_hours: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by: string
          duration?: string | null
          hourly_rate: number
          id?: string
          job_id?: string | null
          role_title: string
          special_terms?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["offer_status"] | null
          talent_id: string
          updated_at?: string | null
          weekly_hours: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string
          duration?: string | null
          hourly_rate?: number
          id?: string
          job_id?: string | null
          role_title?: string
          special_terms?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["offer_status"] | null
          talent_id?: string
          updated_at?: string | null
          weekly_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          attachment_url: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string | null
          description: string
          id: string
          priority: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          attachment_url?: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          attachment_url?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      talent_certifications: {
        Row: {
          certificate_url: string | null
          certification_name: string
          created_at: string | null
          credential_url: string | null
          expiry_date: string | null
          id: string
          issuing_organization: string
          talent_id: string
          year_obtained: number | null
        }
        Insert: {
          certificate_url?: string | null
          certification_name: string
          created_at?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issuing_organization: string
          talent_id: string
          year_obtained?: number | null
        }
        Update: {
          certificate_url?: string | null
          certification_name?: string
          created_at?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issuing_organization?: string
          talent_id?: string
          year_obtained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_certifications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_education: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          education_level: Database["public"]["Enums"]["education_level"]
          end_year: number | null
          field_of_study: string | null
          id: string
          institution_name: string
          is_current: boolean | null
          start_year: number | null
          talent_id: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          education_level: Database["public"]["Enums"]["education_level"]
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          institution_name: string
          is_current?: boolean | null
          start_year?: number | null
          talent_id: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          education_level?: Database["public"]["Enums"]["education_level"]
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          institution_name?: string
          is_current?: boolean | null
          start_year?: number | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_education_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_invoices: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          talent_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          talent_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_invoices_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_invoices_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_references: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          reference_name: string
          relationship: string | null
          talent_id: string
          verification_status:
            | Database["public"]["Enums"]["vetting_status"]
            | null
          verified_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          reference_name: string
          relationship?: string | null
          talent_id: string
          verification_status?:
            | Database["public"]["Enums"]["vetting_status"]
            | null
          verified_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          reference_name?: string
          relationship?: string | null
          talent_id?: string
          verification_status?:
            | Database["public"]["Enums"]["vetting_status"]
            | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_references_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_vetting: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          created_at: string | null
          id: string
          level: number
          level_name: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["vetting_status"] | null
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          level: number
          level_name: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["vetting_status"] | null
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          level?: number
          level_name?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["vetting_status"] | null
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_vetting_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_work_history: {
        Row: {
          company_name: string
          created_at: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          role_description: string | null
          role_title: string
          start_date: string | null
          talent_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          role_description?: string | null
          role_title: string
          start_date?: string | null
          talent_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          role_description?: string | null
          role_title?: string
          start_date?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_work_history_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talents: {
        Row: {
          availability: Database["public"]["Enums"]["availability_type"] | null
          bank_details: Json | null
          country: string | null
          created_at: string | null
          cv_url: string | null
          email: string
          first_name: string
          government_id_url: string | null
          id: string
          languages_spoken: string[] | null
          last_name: string
          nda_agreed: boolean | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          phone: string | null
          preferred_working_hours: string | null
          primary_role: string | null
          proof_of_address_url: string | null
          secondary_skills: string[] | null
          talent_id: string
          terms_agreed: boolean | null
          timezone: string | null
          tools_familiar_with: string[] | null
          updated_at: string | null
          user_id: string
          vetting_status: Database["public"]["Enums"]["talent_status"] | null
          years_of_experience: number | null
        }
        Insert: {
          availability?: Database["public"]["Enums"]["availability_type"] | null
          bank_details?: Json | null
          country?: string | null
          created_at?: string | null
          cv_url?: string | null
          email: string
          first_name: string
          government_id_url?: string | null
          id?: string
          languages_spoken?: string[] | null
          last_name: string
          nda_agreed?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          preferred_working_hours?: string | null
          primary_role?: string | null
          proof_of_address_url?: string | null
          secondary_skills?: string[] | null
          talent_id: string
          terms_agreed?: boolean | null
          timezone?: string | null
          tools_familiar_with?: string[] | null
          updated_at?: string | null
          user_id: string
          vetting_status?: Database["public"]["Enums"]["talent_status"] | null
          years_of_experience?: number | null
        }
        Update: {
          availability?: Database["public"]["Enums"]["availability_type"] | null
          bank_details?: Json | null
          country?: string | null
          created_at?: string | null
          cv_url?: string | null
          email?: string
          first_name?: string
          government_id_url?: string | null
          id?: string
          languages_spoken?: string[] | null
          last_name?: string
          nda_agreed?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          preferred_working_hours?: string | null
          primary_role?: string | null
          proof_of_address_url?: string | null
          secondary_skills?: string[] | null
          talent_id?: string
          terms_agreed?: boolean | null
          timezone?: string | null
          tools_familiar_with?: string[] | null
          updated_at?: string | null
          user_id?: string
          vetting_status?: Database["public"]["Enums"]["talent_status"] | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      timesheet_entries: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          hours: number
          id: string
          task_type: string | null
          timesheet_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          hours: number
          id?: string
          task_type?: string | null
          timesheet_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          hours?: number
          id?: string
          task_type?: string | null
          timesheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contract_id: string
          created_at: string | null
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["timesheet_status"] | null
          submitted_at: string | null
          talent_id: string
          total_hours: number | null
          updated_at: string | null
          week_end: string
          week_start: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contract_id: string
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["timesheet_status"] | null
          submitted_at?: string | null
          talent_id: string
          total_hours?: number | null
          updated_at?: string | null
          week_end: string
          week_start: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contract_id?: string
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["timesheet_status"] | null
          submitted_at?: string | null
          talent_id?: string
          total_hours?: number | null
          updated_at?: string | null
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_client_id: { Args: never; Returns: string }
      generate_contract_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_talent_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "operations_admin"
        | "vetting_admin"
        | "finance_admin"
        | "support_admin"
        | "client"
        | "talent"
      availability_type: "full_time" | "part_time"
      contract_status:
        | "pending"
        | "active"
        | "paused"
        | "completed"
        | "terminated"
      education_level:
        | "secondary_school"
        | "diploma"
        | "bachelors"
        | "masters"
        | "doctorate"
        | "other"
      invoice_status: "pending" | "sent" | "paid" | "overdue"
      job_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "published"
        | "filled"
        | "closed"
      offer_status:
        | "pending"
        | "sent_to_admin"
        | "contract_generated"
        | "sent_to_client"
        | "signed"
        | "rejected"
      talent_status: "unvetted" | "partially_vetted" | "fully_vetted"
      ticket_category:
        | "payment"
        | "job"
        | "technical"
        | "talent_issue"
        | "billing"
        | "other"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      timesheet_status: "draft" | "submitted" | "approved" | "rejected"
      vetting_status:
        | "pending"
        | "approved"
        | "rejected"
        | "needs_clarification"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "operations_admin",
        "vetting_admin",
        "finance_admin",
        "support_admin",
        "client",
        "talent",
      ],
      availability_type: ["full_time", "part_time"],
      contract_status: [
        "pending",
        "active",
        "paused",
        "completed",
        "terminated",
      ],
      education_level: [
        "secondary_school",
        "diploma",
        "bachelors",
        "masters",
        "doctorate",
        "other",
      ],
      invoice_status: ["pending", "sent", "paid", "overdue"],
      job_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "published",
        "filled",
        "closed",
      ],
      offer_status: [
        "pending",
        "sent_to_admin",
        "contract_generated",
        "sent_to_client",
        "signed",
        "rejected",
      ],
      talent_status: ["unvetted", "partially_vetted", "fully_vetted"],
      ticket_category: [
        "payment",
        "job",
        "technical",
        "talent_issue",
        "billing",
        "other",
      ],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      timesheet_status: ["draft", "submitted", "approved", "rejected"],
      vetting_status: [
        "pending",
        "approved",
        "rejected",
        "needs_clarification",
      ],
    },
  },
} as const
