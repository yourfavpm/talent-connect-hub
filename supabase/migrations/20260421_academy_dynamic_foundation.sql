-- ============================================================
-- ACADEMY DYNAMIC FOUNDATION MIGRATION
-- Makes the database the single source of truth for course catalog
-- ============================================================

-- ── 1. SCHEMA ADDITIONS ─────────────────────────────────────

-- Ensure testimonials JSONB column exists on academy_courses
ALTER TABLE public.academy_courses
ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]';

-- Add is_top_grad to enrollments for Top Grad tracking
ALTER TABLE public.academy_enrollments
ADD COLUMN IF NOT EXISTS is_top_grad boolean DEFAULT false;

-- Add is_flagship to courses (may already exist from hub_core)
ALTER TABLE public.academy_courses
ADD COLUMN IF NOT EXISTS is_flagship boolean DEFAULT false;

-- Add has_bonus to courses
ALTER TABLE public.academy_courses
ADD COLUMN IF NOT EXISTS has_bonus boolean DEFAULT false;

-- ── 2. FULL COURSE DATA SEED ────────────────────────────────
-- Upsert all 6 courses with complete rich metadata

INSERT INTO public.academy_courses (
    slug, title, tagline, description, duration, level, outcome,
    tools, price_naira, price_usd, is_live, is_flagship, has_bonus,
    bonus_description, image_url, what_youll_learn, learning_outcomes,
    who_is_it_for, curriculum, testimonials, slots_total, slots_filled,
    next_cohort_date
) VALUES

-- ── Course 1: AI Automation for Operations ──
(
    'ai-automation-for-operations',
    'AI Automation for Operations',
    'Build AI-Powered Workflows. Work With Global Clients.',
    'A 4-week intensive program where you master Zapier, Make, Notion AI, and GPT-4 to automate operations — and get fast-tracked into the OPSly HR talent marketplace upon completion.',
    '4 Weeks',
    'Beginner',
    'AI Operations Specialist',
    '["Zapier", "Make.com", "Notion AI", "GPT-4", "Airtable", "Loom"]'::jsonb,
    199000, 149, true, true, true,
    'The top-performing graduate of each cohort receives a MacBook Air M2 — sponsored by OPSly as our personal investment in your career. Judged on final project quality, consistency, and peer feedback.',
    'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80',
    '["Build end-to-end automation workflows that eliminate hours of manual work", "Integrate GPT-4 into real operational systems — email, SOPs, support", "Design and document AI-powered client-ready processes", "Connect your tools (CRM, Slack, email, forms) into a single working system", "Present and hand off operational systems professionally", "Pass the OPSly vetting process and get placed in the talent marketplace"]'::jsonb,
    '["Earn $2,500–$6,000/month as a remote AI Operations Specialist", "Work with global clients across 20+ countries", "Build automated systems that replace entire hours of manual operations", "Get fast-tracked into the OPSly HR talent marketplace", "Join a network of vetted African operations professionals"]'::jsonb,
    '["Ambitious operations professionals who want to 10x their output with AI tools", "Career switchers looking to break into tech-adjacent remote roles", "Executive Assistants and Admin professionals ready to level up their earning", "Recent graduates seeking high-income, globally competitive skills"]'::jsonb,
    '[
        {"week": "Week 01", "title": "Foundations of AI Operations", "lessons": ["What AI operations means in 2026 — and why it pays", "The modern ops stack: your essential tool map", "Setting up your Notion workspace like a professional operator", "Introduction to automation logic: triggers, actions, filters", "Workshop: Map your first manual process for automation"]},
        {"week": "Week 02", "title": "Automation Architecture", "lessons": ["Zapier deep dive: building multi-step zaps from scratch", "Make.com (Integromat): visual workflow construction", "Connecting your ecosystem: CRM → email → Slack → tasks", "Error handling, filters, and conditional logic", "Project: Build a fully automated onboarding workflow"]},
        {"week": "Week 03", "title": "AI Integration & Intelligent Systems", "lessons": ["Using GPT-4 as an operational co-pilot — the right way", "AI-powered documentation: SOPs, playbooks, and reports", "Smart form handling, routing, and data pipelines", "Building an AI-powered customer support system", "Workshop: AI-assisted email management and triage"]},
        {"week": "Week 04", "title": "Client-Ready Systems & Placement", "lessons": ["Portfolio project: build a real client operations system", "Documentation and handoff standards for global clients", "Positioning yourself for remote operations roles", "Interview prep: how global clients evaluate ops professionals", "OPSly marketplace onboarding and profile optimisation"]}
    ]'::jsonb,
    '[
        {"name": "Amara Osei", "country": "Nigeria", "flag": "🇳🇬", "before": "Customer Service Agent", "after": "AI Operations Specialist", "income": "$2,800/mo", "quote": "I had no idea what ''automation'' even meant before this. Six weeks after graduating I was billing a UK-based startup $2,800 a month to run their ops stack.", "image": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200"},
        {"name": "Tamara Boateng", "country": "Ghana", "flag": "🇬🇭", "before": "Office Administrator", "after": "Remote Operations Manager", "income": "$3,500/mo", "quote": "The curriculum was intense but the support was real. OPSly matched me to a client before I even finished the programme.", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"},
        {"name": "Chidi Emeka", "country": "Nigeria", "flag": "🇳🇬", "before": "Marketing Coordinator", "after": "Freelance Automation Specialist", "income": "$4,200/mo", "quote": "I now run automation systems for four clients across the US and Canada. OPSly gave me both the skill and the network to make that happen.", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"}
    ]'::jsonb,
    20, 14,
    'May 5, 2026'
),

-- ── Course 2: Virtual Operations Management ──
(
    'virtual-operations-management',
    'Virtual Operations Management',
    'Lead Remote Teams. Build Operating Systems That Scale.',
    'A 6-week intensive covering the systems, frameworks, and leadership skills required to manage remote operations teams and build scalable business infrastructure.',
    '6 Weeks',
    'Intermediate',
    'Remote Operations Manager',
    '["ClickUp", "Notion", "Slack", "Loom", "Calendly", "Google Workspace"]'::jsonb,
    249000, 179, true, false, false,
    null,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
    '["Design and implement operating systems for remote-first teams", "Build SOPs, playbooks, and team wikis from scratch", "Manage distributed teams across multiple time zones", "Track OKRs, KPIs, and team performance remotely", "Run weekly operations reviews and stakeholder communication", "Build a portfolio of real remote operations deliverables"]'::jsonb,
    '["Qualify for Head of Operations and VP Ops roles at remote companies", "Earn $3,000–$7,000/month managing global teams", "Build the systems infrastructure for early-stage startups", "Get placed via OPSly HR with vetted global clients"]'::jsonb,
    '["Operations professionals with 1–3 years of experience ready to lead", "Project managers transitioning into operations leadership", "Business owners who need to systemise and delegate effectively", "Remote workers who want to move from execution to management"]'::jsonb,
    '[
        {"week": "Week 01", "title": "The Architecture of Remote Operations", "lessons": ["How high-performance remote teams are structured", "The ops manager mandate: outcomes not activities", "Tool stack setup: ClickUp, Notion, Slack configuration", "Week 1 project: Audit an existing ops process"]},
        {"week": "Week 02", "title": "Process Design & Documentation", "lessons": ["SOP writing that teams actually follow", "Building a team wiki and knowledge base", "Process mapping with tools and swimlane diagrams", "Project: Write 3 SOPs for your target industry"]},
        {"week": "Week 03", "title": "Team Management & Communication", "lessons": ["Async-first communication frameworks", "Running daily standups and weekly ops reviews", "Managing across time zones without micromanagement", "1:1 structure and performance feedback systems"]},
        {"week": "Week 04", "title": "Goals, Metrics & Accountability", "lessons": ["OKR setup and tracking for remote teams", "KPI dashboards and team scorecards", "Identifying and resolving operational bottlenecks", "Project: Build a complete team performance dashboard"]},
        {"week": "Week 05", "title": "Stakeholder Management & Reporting", "lessons": ["How to communicate ops to non-ops leadership", "Building executive-level status reports", "Managing up, across, and down in a remote org", "Presentation: Present your operations plan to peers"]},
        {"week": "Week 06", "title": "Portfolio Build & Marketplace Onboarding", "lessons": ["Capstone: Build a complete remote ops system for a client scenario", "Positioning for senior ops roles globally", "OPSly marketplace profile and interview readiness", "Graduation + placement fast-track"]}
    ]'::jsonb,
    '[
        {"name": "Seun Adeyemi", "country": "Nigeria", "flag": "🇳🇬", "before": "Project Coordinator", "after": "Head of Operations", "income": "$4,500/mo", "quote": "This programme taught me how to lead — not just execute. I landed a Head of Ops role at a US fintech within two months of graduating.", "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"},
        {"name": "Kofi Mensah", "country": "Ghana", "flag": "🇬🇭", "before": "Operations Assistant", "after": "Remote Operations Manager", "income": "$3,800/mo", "quote": "The SOP and system-building modules were worth the entire programme alone. I use those frameworks every single day.", "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200"},
        {"name": "Blessing Okafor", "country": "Kenya", "flag": "🇰🇪", "before": "Team Lead", "after": "VP of Operations", "income": "$6,200/mo", "quote": "OPSly didn''t just give me skills — they gave me a professional network and a career path I didn''t know existed.", "image": "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=200"}
    ]'::jsonb,
    15, 9,
    'May 12, 2026'
),

-- ── Course 3: Customer Support Operations ──
(
    'customer-support-operations',
    'Customer Support Operations',
    'Build Support Systems That Scale. Lead Teams That Deliver.',
    'A 3-week program covering the tools, processes, and leadership skills to build and manage high-performance customer support operations for global companies.',
    '3 Weeks',
    'Beginner',
    'Support Operations Lead',
    '["Intercom", "Zendesk", "Notion", "Slack", "Loom", "Typeform"]'::jsonb,
    149000, 99, true, false, false,
    null,
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80',
    '["Design a customer support system from first principles", "Set up and configure Intercom and Zendesk for scale", "Build macro libraries, canned responses, and escalation flows", "Track CSAT, FRT, and resolution rate KPIs", "Train and manage remote support agents across time zones", "Create self-service help centers that reduce ticket volume"]'::jsonb,
    '["Earn $2,000–$4,500/month as a remote Support Ops Lead", "Run customer support operations for global SaaS companies", "Build systems that reduce response times and improve CSAT", "Fast-track into the OPSly talent marketplace"]'::jsonb,
    '["Customer service professionals ready to move into leadership", "Operations assistants looking to specialise in support systems", "Community managers who want to formalise their support function", "Beginners who want a fast path into global remote work"]'::jsonb,
    '[
        {"week": "Week 01", "title": "Support Systems Architecture", "lessons": ["How world-class support operations are designed", "Zendesk and Intercom setup: channels, routing, automations", "Writing macros and canned responses that actually help", "Building your support knowledge base from scratch"]},
        {"week": "Week 02", "title": "Metrics, Quality & Escalation", "lessons": ["The 5 KPIs every support ops lead must track", "Building a QA scorecard and review process", "Escalation flows, SLA management, and breach handling", "Project: Audit a real support inbox and redesign it"]},
        {"week": "Week 03", "title": "Team Management & Placement", "lessons": ["Hiring, onboarding, and managing remote support agents", "Shift coverage across multiple time zones", "Portfolio: present a full support operations plan", "OPSly marketplace onboarding and profile setup"]}
    ]'::jsonb,
    '[
        {"name": "Fatima Al-Hassan", "country": "Nigeria", "flag": "🇳🇬", "before": "Customer Service Rep", "after": "Support Operations Lead", "income": "$2,600/mo", "quote": "I went from answering tickets to designing the entire system. The transformation in just 3 weeks was unreal.", "image": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200"},
        {"name": "David Asante", "country": "Ghana", "flag": "🇬🇭", "before": "Call Centre Agent", "after": "Remote Support Manager", "income": "$3,100/mo", "quote": "I was skeptical about a 3-week programme but this was more practical than anything I''d done in 5 years of working in support.", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"},
        {"name": "Ngozi Eze", "country": "Nigeria", "flag": "🇳🇬", "before": "Social Media Manager", "after": "CX Operations Specialist", "income": "$2,400/mo", "quote": "The Zendesk setup and macros module alone was worth it. My first client hired me specifically because I could set up their entire support infrastructure.", "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"}
    ]'::jsonb,
    20, 11,
    'May 5, 2026'
),

-- ── Course 4: Social Media Operations Systems ──
(
    'social-media-operations-systems',
    'Social Media Operations Systems',
    'Stop Posting. Start Operating. Build Systems That Scale.',
    'A 3-week program that transforms social media management into a structured, systemised discipline — with content pipelines, scheduling automation, and analytics frameworks.',
    '3 Weeks',
    'Beginner',
    'Social Operations Manager',
    '["Buffer", "Later", "Notion", "Canva", "Zapier", "Meta Business Suite"]'::jsonb,
    149000, 99, true, false, false,
    null,
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80',
    '["Build a content production pipeline from ideation to publishing", "Set up scheduling automation across all major platforms", "Design a social media playbook for a brand or client", "Track social KPIs and report to stakeholders", "Manage content calendars and approval workflows for teams", "Build an analytics dashboard for social performance"]'::jsonb,
    '["Earn $1,800–$3,500/month managing social operations for global brands", "Run the social media function for multiple clients simultaneously", "Build scalable content systems that reduce time spent on manual work", "Access the OPSly talent marketplace as a Social Ops Specialist"]'::jsonb,
    '["Social media managers who want more structure and better systems", "VA and admin professionals adding social operations to their skill set", "Freelancers who want to manage multiple clients without chaos", "Beginners who want to break into social media management the right way"]'::jsonb,
    '[
        {"week": "Week 01", "title": "Social Operations Architecture", "lessons": ["The difference between posting and operating social media", "Building a content production pipeline with Notion", "Platform strategy: Instagram, LinkedIn, X, TikTok — what to run when", "Content calendar design and team approval workflow"]},
        {"week": "Week 02", "title": "Automation & Scheduling", "lessons": ["Buffer and Later setup for multi-platform scheduling", "Zapier automations for social content pipelines", "Repurposing content across platforms at scale", "Project: Automate a full week of content for a brand"]},
        {"week": "Week 03", "title": "Analytics, Reporting & Placement", "lessons": ["The 8 social KPIs that actually matter to clients", "Building a monthly social report clients understand", "Managing client relationships and retainer packages", "OPSly marketplace onboarding as a Social Ops Specialist"]}
    ]'::jsonb,
    '[
        {"name": "Adaeze Nwosu", "country": "Nigeria", "flag": "🇳🇬", "before": "Social Media Poster", "after": "Social Operations Manager", "income": "$2,200/mo", "quote": "I stopped being just a ''content person'' and became a systems thinker. Clients now pay me to run their entire social operation, not just post.", "image": "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=200"},
        {"name": "Emmanuel Darko", "country": "Ghana", "flag": "🇬🇭", "before": "Freelance Designer", "after": "Social & Content Ops Lead", "income": "$2,800/mo", "quote": "The content pipeline and Zapier modules changed everything. I now manage 3 clients on retainer with a system that practically runs itself.", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"},
        {"name": "Ife Adeleke", "country": "Kenya", "flag": "🇰🇪", "before": "Marketing Intern", "after": "SMO Specialist", "income": "$1,900/mo", "quote": "It''s a 3-week programme that gives you a 3-year headstart. The frameworks are genuinely world-class.", "image": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200"}
    ]'::jsonb,
    20, 7,
    'May 19, 2026'
),

-- ── Course 5: Admin & Executive Assistant Systems ──
(
    'admin-executive-assistant-systems',
    'Admin & Executive Assistant Systems',
    'Become the Most Valuable Person in the Room. Remotely.',
    'A 4-week program that transforms administrative professionals into high-value remote Executive Assistants and Chiefs of Staff — equipped with the systems and tools global executives need.',
    '4 Weeks',
    'Beginner',
    'Executive Assistant / Chief of Staff',
    '["Notion", "Calendly", "Gmail", "Google Workspace", "Loom", "Slack"]'::jsonb,
    199000, 149, true, false, false,
    null,
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80',
    '["Build a complete executive support system from scratch", "Manage complex scheduling and travel across time zones", "Create executive-level communication and correspondence", "Design and maintain the CEO''s Notion headquarters", "Handle confidential information and stakeholder relationships", "Operate as a strategic thought partner, not just an assistant"]'::jsonb,
    '["Earn $2,500–$5,000/month as a remote Executive Assistant", "Support C-suite executives at global companies", "Progress into Chief of Staff roles with the right client", "Access the OPSly talent marketplace as a vetted EA"]'::jsonb,
    '["Admin professionals ready to earn more and work globally", "Personal assistants who want to go remote and level up", "Operations professionals adding EA skills to their portfolio", "Career changers who are naturally organised, proactive, and detailed"]'::jsonb,
    '[
        {"week": "Week 01", "title": "The Executive Assistant Operating System", "lessons": ["What global executives actually need from an EA", "Building the CEO''s Notion HQ: structure and setup", "Inbox zero and email management for high-volume executives", "How to capture, organise, and follow up on priorities"]},
        {"week": "Week 02", "title": "Scheduling, Travel & Communication", "lessons": ["Calendly advanced setup: booking rules, buffers, and priorities", "Complex calendar management across 3+ time zones", "Professional correspondence: tone, clarity, and delegation", "Project: Design a travel and logistics system for an exec"]},
        {"week": "Week 03", "title": "Strategic Support & Thought Partnership", "lessons": ["Moving from task execution to strategic anticipation", "Meeting prep, note-taking, and follow-up frameworks", "Managing stakeholders on the exec''s behalf", "Handling confidential information and sensitive decisions"]},
        {"week": "Week 04", "title": "Portfolio, Positioning & Placement", "lessons": ["Building an EA portfolio that showcases systems thinking", "How to price and position yourself for global EA roles", "Interview preparation for executive-level communication", "OPSly HR marketplace onboarding and fast-track placement"]}
    ]'::jsonb,
    '[
        {"name": "Chioma Obi", "country": "Nigeria", "flag": "🇳🇬", "before": "Office Administrator", "after": "Remote Executive Assistant", "income": "$3,200/mo", "quote": "I used to think I wasn''t ''technical enough'' for remote work. OPSly proved me completely wrong. The Notion HQ module alone opened 3 client doors.", "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"},
        {"name": "Kwabena Asare", "country": "Ghana", "flag": "🇬🇭", "before": "Personal Assistant", "after": "Chief of Staff", "income": "$5,000/mo", "quote": "The strategic support module reframed my entire career. I''m not an assistant anymore — I''m a Chief of Staff to a US-based founder.", "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200"},
        {"name": "Amina Said", "country": "Kenya", "flag": "🇰🇪", "before": "Receptionist", "after": "Remote EA (Tech Startup)", "income": "$2,800/mo", "quote": "I didn''t think this was possible for me. Four weeks later, I was supporting a startup CEO in New York. OPSly is the real deal.", "image": "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=200"}
    ]'::jsonb,
    20, 12,
    'May 12, 2026'
),

-- ── Course 6: Client Acquisition for Operators ──
(
    'client-acquisition-for-operators',
    'Client Acquisition for Operators',
    'Build Your Pipeline. Win Clients. Work on Your Terms.',
    'A 4-week business development program for operations professionals who want to go freelance or build an agency — teaching client acquisition, proposal writing, and retainer structuring.',
    '4 Weeks',
    'Intermediate',
    'Freelance Operator / Agency Founder',
    '["LinkedIn", "Apollo.io", "Notion", "Calendly", "Stripe", "Loom"]'::jsonb,
    199000, 149, true, false, false,
    null,
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80',
    '["Build a client acquisition system from cold outreach to signed contract", "Write proposals and service offers that convert", "Price your services correctly for global markets", "Structure retainers, discovery calls, and client onboarding", "Build a LinkedIn presence that attracts inbound enquiries", "Manage multiple clients without burning out"]'::jsonb,
    '["Earn $3,000–$10,000/month running your own operations practice", "Build a client roster of 3–5 retainer clients globally", "Operate a lean, profitable one-person operations business", "Combine OPSly placements with your own client pipeline"]'::jsonb,
    '["Operations professionals who want to go freelance or consulting", "OPSly graduates looking to build their own client base", "Remote workers tired of single-employer dependency", "Operators with 2+ years of experience ready to bet on themselves"]'::jsonb,
    '[
        {"week": "Week 01", "title": "Offer Design & Positioning", "lessons": ["Defining your operations niche and ideal client profile", "Crafting a signature service offer that solves a specific problem", "Pricing frameworks: hourly vs retainer vs project", "Building your personal brand on LinkedIn as an operator"]},
        {"week": "Week 02", "title": "Outreach & Pipeline Building", "lessons": ["Cold outreach that doesn''t feel cold — the ops approach", "Apollo.io setup: list building and sequencing", "LinkedIn DM scripts that open conversations", "Project: Send 50 outreach messages and track results"]},
        {"week": "Week 03", "title": "Proposals, Discovery & Closing", "lessons": ["Running the perfect discovery call (30 minutes, every time)", "Writing proposals clients say yes to immediately", "Handling objections without being pushy", "Contract basics: what every freelance ops agreement needs"]},
        {"week": "Week 04", "title": "Onboarding, Delivery & Scale", "lessons": ["Onboarding a new client in 48 hours", "Managing multiple retainer clients without chaos", "When and how to bring in support or subcontractors", "Capstone: Present your 6-month business development plan"]}
    ]'::jsonb,
    '[
        {"name": "Tunde Afolabi", "country": "Nigeria", "flag": "🇳🇬", "before": "In-house Ops Manager", "after": "Freelance Operations Consultant", "income": "$6,500/mo", "quote": "I was terrified to go freelance. This programme gave me the exact system to find, close, and keep clients. I replaced my salary in 8 weeks.", "image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200"},
        {"name": "Grace Mwangi", "country": "Kenya", "flag": "🇰🇪", "before": "Remote Ops Specialist", "after": "Operations Agency Founder", "income": "$9,200/mo", "quote": "I went from one OPSly client to running my own agency with 6 clients. The proposal and retainer frameworks in this course are genuinely powerful.", "image": "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=200"},
        {"name": "Samuel Owusu", "country": "Ghana", "flag": "🇬🇭", "before": "Virtual Assistant", "after": "Client Acquisition Specialist", "income": "$4,800/mo", "quote": "The outreach system in Week 2 got me 4 discovery calls in my first week. This programme is the missing piece for operations professionals.", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"}
    ]'::jsonb,
    15, 5,
    'May 26, 2026'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    duration = EXCLUDED.duration,
    level = EXCLUDED.level,
    outcome = EXCLUDED.outcome,
    tools = EXCLUDED.tools,
    price_naira = EXCLUDED.price_naira,
    price_usd = EXCLUDED.price_usd,
    is_live = EXCLUDED.is_live,
    is_flagship = EXCLUDED.is_flagship,
    has_bonus = EXCLUDED.has_bonus,
    bonus_description = EXCLUDED.bonus_description,
    image_url = EXCLUDED.image_url,
    what_youll_learn = EXCLUDED.what_youll_learn,
    learning_outcomes = EXCLUDED.learning_outcomes,
    who_is_it_for = EXCLUDED.who_is_it_for,
    curriculum = EXCLUDED.curriculum,
    testimonials = EXCLUDED.testimonials,
    slots_total = EXCLUDED.slots_total,
    slots_filled = EXCLUDED.slots_filled,
    next_cohort_date = EXCLUDED.next_cohort_date,
    updated_at = now();
