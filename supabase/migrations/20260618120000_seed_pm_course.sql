-- ============================================================
-- Project Management Mastery: Beginner to Job-Ready
-- Seed Migration – 2026-06-18
-- ============================================================

INSERT INTO public.academy_courses (
    title,
    slug,
    tagline,
    description,
    price_naira,
    price_usd,
    level,
    category,
    duration,
    is_live,
    is_flagship,
    slots_total,
    slots_filled,
    next_cohort_date,
    image_url,
    bonus_description,
    learning_outcomes,
    tools,
    curriculum,
    who_is_it_for,
    what_youll_learn,
    testimonials,
    created_at,
    updated_at
) VALUES (
    'Project Management Mastery: Beginner to Job-Ready',
    'project-management-mastery',
    'Go from zero to certified-ready in 8 weeks — manage real projects, lead teams, and land your first PM role.',
    'Project management is one of the most in-demand skills across every industry. Whether you''re pivoting careers, stepping into a leadership role, or looking to formalise skills you already use, this 8-week intensive program takes you from the foundational principles of project management all the way to job-ready competence. You will master both traditional (Waterfall) and Agile frameworks, learn to use industry-standard PM tools, build a portfolio of real project plans, and develop the stakeholder communication and risk management skills that hiring managers look for. By graduation, you will be equipped to manage cross-functional projects confidently, prepare for PMI/CAPM or Scrum certifications, and step straight into a junior or mid-level PM role.',
    180000,
    120,
    'Beginner',
    'Operations',
    '8 Weeks',
    true,
    true,
    40,
    0,
    'August 4, 2026',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1600&auto=format&fit=crop',
    'Lifetime access to the OpslyHR PM Toolkit (templates, checklists, stakeholder maps), a 1-on-1 career coaching session, and a portfolio review with a senior PM mentor.',

    -- learning_outcomes
    '["Understand and apply both Waterfall and Agile (Scrum/Kanban) project methodologies", "Build a full project charter, WBS, Gantt chart, and risk register from scratch", "Lead stakeholder meetings, write status reports, and manage client expectations professionally", "Use Jira, Asana, Notion, and Microsoft Project for real project delivery", "Identify, assess, and mitigate project risks before they become blockers", "Manage project scope, time, cost, and quality simultaneously (the Triple Constraint)", "Facilitate sprint planning, daily standups, retrospectives, and sprint reviews", "Build a PM portfolio with 3 documented case studies ready for job applications", "Prepare for CAPM, PMP, or Professional Scrum Master (PSM I) certification exams", "Communicate progress and escalate issues confidently to C-suite stakeholders"]',

    -- tools
    '["Jira", "Asana", "Notion", "Microsoft Project", "Trello", "Confluence", "Google Workspace", "Miro", "Slack", "Monday.com"]',

    -- curriculum
    '[
        {
            "week": "Week 1",
            "title": "PM Fundamentals & The Project Lifecycle",
            "details": [
                "What is project management and why it matters in every industry",
                "The 5 process groups: Initiating, Planning, Executing, Monitoring & Controlling, Closing",
                "Project vs. operations vs. programs vs. portfolios",
                "Key PM roles: Project Manager, Project Sponsor, Stakeholders, Team Lead",
                "Writing a Project Charter and defining project objectives (SMART goals)",
                "Introduction to the PMBOK® Guide and PMI framework",
                "Workshop: Draft a project charter for a real-world scenario"
            ]
        },
        {
            "week": "Week 2",
            "title": "Scope, Schedule & Work Breakdown Structure",
            "details": [
                "Defining and documenting project scope (Scope Statement, SOW)",
                "Scope creep: causes, prevention, and change control",
                "Building a Work Breakdown Structure (WBS) — step by step",
                "Estimating task durations: analogous, parametric, and three-point estimating",
                "Creating Gantt charts in MS Project and Asana",
                "The Critical Path Method (CPM) and float/slack analysis",
                "Workshop: Build a full WBS and Gantt chart for a 6-week project"
            ]
        },
        {
            "week": "Week 3",
            "title": "Budget, Cost Management & Resource Planning",
            "details": [
                "Project cost estimation techniques (bottom-up, top-down, ROM)",
                "Creating and managing a project budget baseline",
                "Earned Value Management (EVM): SPI, CPI, EAC, VAC",
                "Resource planning: identifying, allocating, and levelling resources",
                "Managing vendor and contractor relationships",
                "Procurement planning and contract types (Fixed Price, T&M, Cost-Reimbursable)",
                "Workshop: Build a project budget and interpret EVM metrics"
            ]
        },
        {
            "week": "Week 4",
            "title": "Risk Management & Quality Assurance",
            "details": [
                "The risk management process: identify, analyse, plan, monitor",
                "Building a Risk Register with probability × impact matrices",
                "Risk response strategies: avoid, transfer, mitigate, accept",
                "Opportunity management (positive risks)",
                "Quality planning vs. quality assurance vs. quality control",
                "Using checklists, audits, and process improvement frameworks",
                "Workshop: Conduct a risk workshop and build a live risk register"
            ]
        },
        {
            "week": "Week 5",
            "title": "Agile & Scrum — The Modern PM Toolkit",
            "details": [
                "Agile manifesto, principles, and the case for iterative delivery",
                "Scrum framework deep-dive: roles, events, artefacts",
                "Sprint planning, Daily Standup, Sprint Review, Retrospective",
                "Writing user stories, acceptance criteria, and managing the backlog",
                "Kanban boards, WIP limits, and flow-based project management",
                "Hybrid PM: blending Waterfall and Agile for complex projects",
                "Workshop: Run a full 2-day sprint simulation using Jira"
            ]
        },
        {
            "week": "Week 6",
            "title": "Stakeholder Management & Communication",
            "details": [
                "Stakeholder identification and stakeholder register",
                "Stakeholder analysis: power/interest grid and engagement strategies",
                "Communication planning: who gets what, when, and how",
                "Writing high-impact status reports and executive summaries",
                "Running effective project meetings (kickoff, checkpoint, steering committee)",
                "Managing difficult stakeholders, conflict resolution, and negotiation",
                "Workshop: Develop a full stakeholder communication plan"
            ]
        },
        {
            "week": "Week 7",
            "title": "Project Execution, Monitoring & Controlling",
            "details": [
                "Leading cross-functional teams and managing without authority",
                "Change control process and change request management",
                "Issue log management and escalation procedures",
                "Monitoring KPIs and project health dashboards",
                "Managing underperforming team members professionally",
                "Lessons learned: continuous improvement during execution",
                "Workshop: Manage a simulated project crisis using real escalation protocols"
            ]
        },
        {
            "week": "Week 8",
            "title": "Project Closure, Portfolio Building & Job Readiness",
            "details": [
                "Project closure checklist and formal handover documentation",
                "Lessons learned register and post-project review",
                "Building your PM portfolio: structuring case studies from scratch",
                "Tailoring your CV and LinkedIn for PM roles",
                "PM interview prep: STAR method answers for common PM questions",
                "Certification roadmap: CAPM, PMP, PSM I — how to choose and prepare",
                "Final capstone: Present your PM portfolio to a panel of working PMs"
            ]
        }
    ]',

    -- who_is_it_for
    '["Professionals looking to transition into a Project Manager or Program Manager role", "Team leads, coordinators, or operations staff who manage projects informally", "Recent graduates who want a structured, job-ready skill set", "Entrepreneurs and startup founders managing product or business projects", "Freelancers who want to formalise their project delivery approach", "Anyone preparing for CAPM, PMP, or Scrum certification exams"]',

    -- what_youll_learn
    '["Plan and execute projects end-to-end using industry-standard methodologies", "Lead teams, manage stakeholders, and communicate at every level of an organisation", "Use Jira, Asana, and MS Project like a working PM", "Build a portfolio of real case studies that get you hired", "Understand Agile, Scrum, and Kanban well enough to lead sprints", "Manage budgets, control scope, and mitigate risk proactively", "Write project charters, WBS, risk registers, and status reports", "Prepare for globally recognised PM certifications"]',

    -- testimonials
    '[
        {
            "name": "Chika Okonkwo",
            "country": "Nigeria",
            "flag": "🇳🇬",
            "before": "Operations Assistant at a logistics startup",
            "after": "Junior Project Manager at a FinTech company",
            "income": "₦850,000/month",
            "quote": "I had been managing projects without a title or framework for 2 years. This course gave me the language, the tools, and the confidence to step into an official PM role. The stakeholder management and risk modules alone were worth the entire investment.",
            "image": ""
        },
        {
            "name": "Tobenna Eze",
            "country": "Nigeria",
            "flag": "🇳🇬",
            "before": "IT Support Engineer",
            "after": "Technical Project Manager (Remote)",
            "income": "$3,200/month",
            "quote": "The Agile week completely changed how I see delivery. I went into the course not knowing Scrum from Kanban. By the final sprint simulation I was running ceremonies confidently. Got my first PM contract within 6 weeks of graduating.",
            "image": ""
        },
        {
            "name": "Adaeze Nwosu",
            "country": "Ghana",
            "flag": "🇬🇭",
            "before": "Marketing Coordinator",
            "after": "Program Manager at a digital agency",
            "income": "GHS 9,500/month",
            "quote": "The portfolio review session was a game-changer. My mentor helped me reframe two marketing campaign projects into PM case studies that actually impressed my interviewers. I had 3 offers within 2 months of completing the programme.",
            "image": ""
        }
    ]',

    NOW(),
    NOW()
)
ON CONFLICT (slug) DO NOTHING;
