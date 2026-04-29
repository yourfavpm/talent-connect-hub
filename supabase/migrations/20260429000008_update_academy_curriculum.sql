-- Add new columns for marketplace readiness and final project
ALTER TABLE public.academy_courses 
ADD COLUMN IF NOT EXISTS marketplace_readiness jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS final_project jsonb DEFAULT '{}';

-- Update AI Automation for Operations
UPDATE public.academy_courses
SET 
    title = 'AI Automation Operations',
    tagline = 'Build AI-Powered Workflows. Work With Global Clients.',
    description = 'A 4-week intensive program where you master Zapier, Make, Notion AI, and GPT-4 to automate operations — and get fast-tracked into the OPSly HR talent marketplace upon completion.',
    duration = '4 Weeks',
    curriculum = '[
      {
        "week": "Week 01",
        "title": "Foundations of AI Automation & Systems Thinking",
        "lessons": [
          "Introduction to AI in modern business operations",
          "Understanding business workflows and operational bottlenecks",
          "Types of automation: Lead gen, Onboarding, Admin, Content",
          "Systems thinking for operators (how businesses actually function)",
          "Mapping business processes into workflows",
          "Introduction to AI tools: ChatGPT & Notion as an OS",
          "Zapier and Make (Integromat) fundamentals",
          "Understanding triggers, actions, and logic structures",
          "Prompt engineering for operational tasks"
        ],
        "assignment": "• Identify 3 real businesses\n• Break down 1 operational process per business\n• Propose 1 automation solution per process\n• Map each solution as a workflow diagram (step-by-step logic)"
      },
      {
        "week": "Week 02",
        "title": "Core Automation Building Systems",
        "lessons": [
          "Deep dive into Zapier workflows and Make scenarios",
          "Building multi-step automation systems",
          "CRMs & Database structure (Notion, Airtable, Sheets)",
          "Email automation systems (send, reply, follow-up logic)",
          "Lead capture systems (forms, landing pages, integrations)",
          "Webhook fundamentals and system connections",
          "Error handling, testing, and debugging workflows",
          "Data flow between tools (how systems communicate)"
        ],
        "assignment": "Build 1 working automation system (e.g., Form submission → CRM entry → automated email response). Document tools used, steps, and purpose."
      },
      {
        "week": "Week 03",
        "title": "Advanced Business Systems & Workflow Architecture",
        "lessons": [
          "Designing end-to-end business automation systems",
          "Customer journey mapping (from lead to conversion)",
          "Operational architecture for small businesses",
          "Multi-tool system integration & AI enhancement",
          "Building scalable content distribution systems",
          "Sales pipeline and internal team workflow systems",
          "Optimizing automation efficiency (reducing steps, cost, errors)",
          "Case study breakdown of real business systems"
        ],
        "assignment": "Build a full automation system for a business: Lead capture, CRM tracking, Follow-up automation, and Booking/Conversion system. Include full documentation."
      },
      {
        "week": "Week 04",
        "title": "Portfolio Project, Interview Prep & Marketplace Readiness",
        "lessons": [
          "Structuring automation projects into case studies",
          "Presenting technical systems to non-technical clients",
          "Building a professional automation portfolio",
          "Freelance positioning & pricing automation services",
          "Client communication & problem-solving in client scenarios",
          "OPSly marketplace structure and expectations",
          "Interview preparation: Explaining systems and design logic"
        ],
        "assignment": "Complete Final Project and prepare OPSly talent profile with case studies."
      }
    ]'::jsonb,
    marketplace_readiness = '[
      "Create OPSly talent profile",
      "Upload portfolio project as case study",
      "Apply to first automation gigs",
      "Interview simulation readiness checklist"
    ]'::jsonb,
    final_project = '{
      "title": "Complete AI Automation System",
      "requirements": [
        "Lead generation system",
        "CRM tracking system",
        "Automated communication system",
        "Business workflow documentation",
        "Case study presentation"
      ]
    }'::jsonb
WHERE slug = 'ai-automation-for-operations';

-- Update Virtual Assistant / Virtual Operations
UPDATE public.academy_courses
SET 
    title = 'Virtual Assistant / Virtual Operations',
    slug = 'virtual-assistant-operations',
    tagline = 'Master Remote Operations. Become a High-Value Virtual Operator.',
    description = 'A 4-week intensive program that transforms administrative professionals into high-value Virtual Assistants and Operations Managers — equipped with the systems, tools, and mindset global businesses need.',
    duration = '4 Weeks',
    curriculum = '[
      {
        "week": "Week 01",
        "title": "Foundations of Virtual Operations",
        "lessons": [
          "Virtual operations vs traditional assistant roles",
          "Types of VA roles in modern businesses",
          "Business operations structure & remote team communication",
          "Professional standards & email etiquette",
          "Task ownership vs task execution mindset",
          "Intro to tools: Google Workspace, Notion, Trello/Asana",
          "Managing digital workspaces and organizational systems"
        ],
        "assignment": "Simulate managing a CEO’s digital workspace: Inbox categorization, Calendar organization, and Task prioritization structure."
      },
      {
        "week": "Week 02",
        "title": "Core VA Systems & Business Support Operations",
        "lessons": [
          "Email management systems (sorting, prioritizing, responding)",
          "Calendar and scheduling systems",
          "Task management systems (Notion, Trello workflows)",
          "Document management and file organization architecture",
          "Data entry and structuring systems",
          "CRM basics and client communication frameworks",
          "Meeting coordination and reporting systems"
        ],
        "assignment": "Build a full virtual assistant operating system: Inbox system, Calendar system, Task tracking system, and Reporting template."
      },
      {
        "week": "Week 03",
        "title": "Advanced Operations & Client Support Systems",
        "lessons": [
          "Customer support workflows and communication pipelines",
          "Creating and executing SOPs (Standard Operating Procedures)",
          "Problem escalation systems & workflow optimization",
          "Managing multiple clients simultaneously",
          "Remote team coordination basics",
          "Operational consistency and reliability systems",
          "Reporting systems for business owners"
        ],
        "assignment": "Run a full simulated weekly operations system: Inbox management, Task execution tracking, Calendar scheduling, and Weekly performance report."
      },
      {
        "week": "Week 04",
        "title": "Portfolio, Interview Prep & Marketplace Readiness",
        "lessons": [
          "Structuring VA work into professional portfolios",
          "Writing operations case studies",
          "How to present yourself to clients & pricing services",
          "Client onboarding processes",
          "Interview preparation: Handling requests and pressure",
          "OPSly marketplace overview & application strategy",
          "Building long-term client relationships"
        ],
        "assignment": "Complete Final Project and prepare OPSly talent profile."
      }
    ]'::jsonb,
    marketplace_readiness = '[
      "Create VA profile",
      "Upload operations portfolio",
      "Apply for first roles",
      "Interview readiness simulation"
    ]'::jsonb,
    final_project = '{
      "title": "Virtual Operations Manager Simulation",
      "requirements": [
        "Inbox management system",
        "Calendar scheduling system",
        "Task tracking system",
        "Weekly operations report",
        "Communication log system"
      ]
    }'::jsonb
WHERE slug = 'admin-executive-assistant-systems';

-- Update Social Media Management
UPDATE public.academy_courses
SET 
    title = 'Social Media Management',
    slug = 'social-media-management',
    tagline = 'Build Brand Presence. Drive Growth. Master Social Operations.',
    description = 'A 4-week program that transforms social media management into a structured, systemised discipline — with content strategy, growth frameworks, and analytics systems.',
    duration = '4 Weeks',
    curriculum = '[
      {
        "week": "Week 01",
        "title": "Social Media Foundations & Brand Understanding",
        "lessons": [
          "Role of a social media manager in modern businesses",
          "Understanding brand identity and positioning",
          "Content vs marketing vs growth distinction",
          "Platform ecosystems (Instagram, TikTok, LinkedIn)",
          "Audience psychology and behavior",
          "Content consumption patterns & Brand voice development",
          "Competitive content analysis frameworks"
        ],
        "assignment": "Analyze 3 brands: Their content strategy, audience engagement approach, and growth strategy breakdown."
      },
      {
        "week": "Week 02",
        "title": "Content Strategy & Content Creation Systems",
        "lessons": [
          "Content strategy frameworks and pillars mapping",
          "Building and managing content calendars",
          "Hook writing techniques and caption frameworks",
          "Storytelling for social media",
          "Content formats: Reels, Carousels, Threads",
          "Visual content planning systems",
          "Canva workflow and production speed"
        ],
        "assignment": "Build a 7-day content plan for a brand: Post ideas, captions, and content pillars mapping."
      },
      {
        "week": "Week 03",
        "title": "Growth Systems & Engagement Strategies",
        "lessons": [
          "Social media algorithms explained",
          "Organic growth strategies and viral mechanics",
          "Engagement strategies and community building",
          "Audience retention and performance tracking",
          "Analytics interpretation and optimization techniques",
          "Scaling engagement without ads",
          "Content optimization for higher reach"
        ],
        "assignment": "Create a growth strategy for a brand: Content improvement plan, engagement strategy, and growth projection."
      },
      {
        "week": "Week 04",
        "title": "Portfolio Project, Client Readiness & Marketplace",
        "lessons": [
          "Turning social media work into professional case studies",
          "Presenting content strategies to clients",
          "Pricing social media management services & onboarding",
          "Managing client expectations and communication",
          "Interview preparation: Growth strategy and decision reasoning",
          "OPSly marketplace application and positioning"
        ],
        "assignment": "Complete Final Project and prepare SMM talent profile."
      }
    ]'::jsonb,
    marketplace_readiness = '[
      "Build SMM profile",
      "Upload portfolio",
      "Apply for first gigs"
    ]'::jsonb,
    final_project = '{
      "title": "7-Day Brand Social Simulation",
      "requirements": [
        "Content calendar",
        "Daily content execution",
        "Engagement strategy",
        "Performance report"
      ]
    }'::jsonb
WHERE slug = 'social-media-operations-systems';

-- Update Freelance Client Acquisition
UPDATE public.academy_courses
SET 
    title = 'Freelance Client Acquisition',
    tagline = 'Build Your Pipeline. Win Clients. Work on Your Terms.',
    description = 'A 4-week business development program for operations professionals who want to go freelance or build an agency — teaching client acquisition, proposal writing, and retainer structuring.',
    duration = '4 Weeks',
    curriculum = '[
      {
        "week": "Week 01",
        "title": "Positioning & Offer Design",
        "lessons": [
          "Freelance positioning fundamentals",
          "Why skills don’t get clients (offers do)",
          "Service packaging strategies",
          "High-value offer creation",
          "Niche selection frameworks",
          "Value proposition design",
          "Freelance business models (retainer, project-based, hourly)"
        ],
        "assignment": "Create 2 structured freelance offers."
      },
      {
        "week": "Week 02",
        "title": "Platform Setup & Personal Branding",
        "lessons": [
          "Upwork profile optimization",
          "Fiverr gig structuring",
          "LinkedIn positioning for freelancers",
          "Portfolio structuring",
          "Personal branding fundamentals",
          "Trust-building systems in freelancing"
        ],
        "assignment": "Fully optimize 1 freelancing platform profile."
      },
      {
        "week": "Week 03",
        "title": "Client Acquisition Systems",
        "lessons": [
          "Cold DM systems (LinkedIn, Instagram)",
          "Cold email outreach systems",
          "Proposal writing frameworks",
          "Lead generation strategies for freelancers",
          "Building consistent outreach systems",
          "Conversation conversion strategies"
        ],
        "assignment": "Create and execute 20 outreach messages (simulated or real)."
      },
      {
        "week": "Week 04",
        "title": "Closing Clients, Interview Prep & Marketplace",
        "lessons": [
          "Client closing frameworks",
          "Sales psychology for freelancers",
          "Discovery call structure",
          "Objection handling systems",
          "Pricing confidence strategies",
          "OPSly marketplace navigation",
          "Job application strategy"
        ],
        "assignment": "Complete Final Project and prepare for first client acquisition."
      }
    ]'::jsonb,
    marketplace_readiness = '[
      "Apply to first jobs",
      "Position yourself for first client acquisition"
    ]'::jsonb,
    final_project = '{
      "title": "Freelance Client Pitch System",
      "requirements": [
        "Write 3 client-winning proposals",
        "Simulate a client call",
        "Build a freelance portfolio pitch"
      ]
    }'::jsonb
WHERE slug = 'client-acquisition-for-operators';
