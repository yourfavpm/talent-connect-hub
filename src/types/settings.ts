export type ServiceType = 'direct_hire' | 'trial_to_hire' | 'one_time';

export interface OrganizationSettings {
    id: string;
    org_id: string;
    legal_name: string | null;
    display_name: string | null;
    support_email: string | null;
    finance_email: string | null;
    default_timezone: string;
    default_currency: string;
    operating_regions: string[];
    office_address: string | null;
    registration_number: string | null;
    updated_at: string;
    updated_by: string | null;
}

export interface PricingRule {
    id: string;
    service_type: ServiceType;
    rule_key: string;
    value_json: any;
    effective_from: string;
    is_active: boolean;
    updated_at: string;
}

export interface FinanceSettings {
    id: string;
    invoicing_json: {
        numbering_scheme: {
            prefix: string;
            next_number: number;
            reset_yearly: boolean;
        };
        default_due_days: number;
        late_fee_policy?: {
            percent?: number;
            flat_fee?: number;
            grace_period_days: number;
        };
    };
    payout_json: {
        schedule: 'weekly' | 'bi-weekly' | 'monthly';
        minimum_threshold: number;
        require_approval: boolean;
    };
    deductions_json: {
        method: 'hourly_equivalent';
        rounding: 'round' | 'floor' | 'ceil';
        max_cap_percent?: number;
    };
    updated_at: string;
}

export interface WorkflowSettings {
    id: string;
    workflow_key: string;
    config_json: any;
    updated_at: string;
}

export interface NotificationTemplate {
    id: string;
    template_key: string;
    subject: string | null;
    body_html: string | null;
    body_text: string | null;
    updated_at: string;
}

export interface SecuritySettings {
    id: string;
    config_json: {
        require_2fa_admins: boolean;
        session_duration_hours: number;
        password_policy: {
            min_length: number;
            require_special: boolean;
        };
    };
    updated_at: string;
}

export interface Integration {
    id: string;
    provider: string;
    config_json_masked: Record<string, string>;
    status: 'active' | 'inactive' | 'error';
    updated_at: string;
}
