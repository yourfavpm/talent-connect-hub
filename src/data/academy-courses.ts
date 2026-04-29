export interface CurriculumWeek {
  week: string;
  title: string;
  lessons: string[];
  assignment?: string;
}

export interface CourseTestimonial {
  name: string;
  country: string;
  flag: string;
  before: string;
  after: string;
  income: string;
  quote: string;
  image: string;
}

export interface AcademyCourse {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  level: "Beginner" | "Intermediate";
  outcome: string;
  tools: string[];
  nextCohort: string;
  slotsTotal: number;
  slotsFilled: number;
  priceNaira: number;
  priceUSD: number;
  curriculum: CurriculumWeek[];
  whatYoullLearn: string[];
  outcomes: string[];
  whoIsItFor: string[];
  testimonials: CourseTestimonial[];
  isFlagship?: boolean;
  hasBonus?: boolean;
  bonusDescription?: string;
  image?: string;
  marketplaceReadiness?: string[];
  finalProject?: {
    title: string;
    requirements: string[];
  };
}

export const ACADEMY_COURSES: AcademyCourse[] = [
  {
    id: "1",
    slug: "ai-automation-for-operations",
    title: "AI Automation for Operations",
    tagline: "Build AI-Powered Workflows. Work With Global Clients.",
    description:
      "A 4-week intensive program where you master Zapier, Make, Notion AI, and GPT-4 to automate operations — and get fast-tracked into the OPSly HR talent marketplace upon completion.",
    duration: "4 Weeks",
    level: "Beginner",
    outcome: "AI Operations Specialist",
    tools: ["Zapier", "Make.com", "Notion AI", "GPT-4", "Airtable", "Loom"],
    nextCohort: "May 5, 2026",
    slotsTotal: 20,
    slotsFilled: 14,
    priceNaira: 199000,
    priceUSD: 149,
    isFlagship: true,
    image: "https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80",
    hasBonus: true,
    bonusDescription:
      "The top-performing graduate of each cohort receives a MacBook Air M2 — sponsored by OPSly as our personal investment in your career. Judged on final project quality, consistency, and peer feedback.",
    whatYoullLearn: [
      "Build end-to-end automation workflows that eliminate hours of manual work",
      "Integrate GPT-4 into real operational systems — email, SOPs, support",
      "Design and document AI-powered client-ready processes",
      "Connect your tools (CRM, Slack, email, forms) into a single working system",
      "Present and hand off operational systems professionally",
      "Pass the OPSly vetting process and get placed in the talent marketplace",
    ],
    outcomes: [
      "Earn $2,500–$6,000/month as a remote AI Operations Specialist",
      "Work with global clients across 20+ countries",
      "Build automated systems that replace entire hours of manual operations",
      "Get fast-tracked into the OPSly HR talent marketplace",
      "Join a network of vetted African operations professionals",
    ],
    whoIsItFor: [
      "Ambitious operations professionals who want to 10x their output with AI tools",
      "Career switchers looking to break into tech-adjacent remote roles",
      "Executive Assistants and Admin professionals ready to level up their earning",
      "Recent graduates seeking high-income, globally competitive skills",
    ],
    curriculum: [
      {
        week: "Week 01",
        title: "Foundations of AI Automation & Systems Thinking",
        lessons: [
          "Introduction to AI in modern business operations",
          "Understanding business workflows and operational bottlenecks",
          "Types of automation: Lead gen, Onboarding, Admin, Content",
          "Systems thinking for operators (how businesses actually function)",
          "Mapping business processes into workflows",
          "Introduction to AI tools: ChatGPT & Notion as an OS",
          "Zapier and Make (Integromat) fundamentals",
          "Understanding triggers, actions, and logic structures",
          "Prompt engineering for operational tasks",
        ],
        assignment: "• Identify 3 real businesses\n• Break down 1 operational process per business\n• Propose 1 automation solution per process\n• Map each solution as a workflow diagram (step-by-step logic)",
      },
      {
        week: "Week 02",
        title: "Core Automation Building Systems",
        lessons: [
          "Deep dive into Zapier workflows and Make scenarios",
          "Building multi-step automation systems",
          "CRMs & Database structure (Notion, Airtable, Sheets)",
          "Email automation systems (send, reply, follow-up logic)",
          "Lead capture systems (forms, landing pages, integrations)",
          "Webhook fundamentals and system connections",
          "Error handling, testing, and debugging workflows",
          "Data flow between tools (how systems communicate)",
        ],
        assignment: "Build 1 working automation system (e.g., Form submission → CRM entry → automated email response). Document tools used, steps, and purpose.",
      },
      {
        week: "Week 03",
        title: "Advanced Business Systems & Workflow Architecture",
        lessons: [
          "Designing end-to-end business automation systems",
          "Customer journey mapping (from lead to conversion)",
          "Operational architecture for small businesses",
          "Multi-tool system integration & AI enhancement",
          "Building scalable content distribution systems",
          "Sales pipeline and internal team workflow systems",
          "Optimizing automation efficiency (reducing steps, cost, errors)",
          "Case study breakdown of real business systems",
        ],
        assignment: "Build a full automation system for a business: Lead capture, CRM tracking, Follow-up automation, and Booking/Conversion system. Include full documentation.",
      },
      {
        week: "Week 04",
        title: "Portfolio Project, Interview Prep & Marketplace Readiness",
        lessons: [
          "Structuring automation projects into case studies",
          "Presenting technical systems to non-technical clients",
          "Building a professional automation portfolio",
          "Freelance positioning & pricing automation services",
          "Client communication & problem-solving in client scenarios",
          "OPSly marketplace structure and expectations",
          "Interview preparation: Explaining systems and design logic",
        ],
        assignment: "Complete Final Project and prepare OPSly talent profile with case studies.",
      },
    ],
    marketplaceReadiness: [
      "Create OPSly talent profile",
      "Upload portfolio project as case study",
      "Apply to first automation gigs",
      "Interview simulation readiness checklist",
    ],
    finalProject: {
      title: "Complete AI Automation System",
      requirements: [
        "Lead generation system",
        "CRM tracking system",
        "Automated communication system",
        "Business workflow documentation",
        "Case study presentation",
      ],
    },
    testimonials: [
      {
        name: "Amara Osei",
        country: "Nigeria",
        flag: "🇳🇬",
        before: "Customer Service Agent",
        after: "AI Operations Specialist",
        income: "$2,800/mo",
        quote:
          "I had no idea what 'automation' even meant before this. Six weeks after graduating I was billing a UK-based startup $2,800 a month to run their ops stack.",
        image:
          "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Tamara Boateng",
        country: "Ghana",
        flag: "🇬🇭",
        before: "Office Administrator",
        after: "Remote Operations Manager",
        income: "$3,500/mo",
        quote:
          "The curriculum was intense but the support was real. OPSly matched me to a client before I even finished the programme.",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Chidi Emeka",
        country: "Nigeria",
        flag: "🇳🇬",
        before: "Marketing Coordinator",
        after: "Freelance Automation Specialist",
        income: "$4,200/mo",
        quote:
          "I now run automation systems for four clients across the US and Canada. OPSly gave me both the skill and the network to make that happen.",
        image:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      },
    ],
  },
  {
    id: "2",
    slug: "virtual-operations-management",
    title: "Virtual Operations Management",
    tagline: "Lead Remote Teams. Build Operating Systems That Scale.",
    description:
      "A 6-week intensive covering the systems, frameworks, and leadership skills required to manage remote operations teams and build scalable business infrastructure.",
    duration: "6 Weeks",
    level: "Intermediate",
    outcome: "Remote Operations Manager",
    tools: ["ClickUp", "Notion", "Slack", "Loom", "Calendly", "Google Workspace"],
    nextCohort: "May 12, 2026",
    slotsTotal: 15,
    slotsFilled: 9,
    priceNaira: 249000,
    priceUSD: 179,
    whatYoullLearn: [
      "Design and implement operating systems for remote-first teams",
      "Build SOPs, playbooks, and team wikis from scratch",
      "Manage distributed teams across multiple time zones",
      "Track OKRs, KPIs, and team performance remotely",
      "Run weekly operations reviews and stakeholder communication",
      "Build a portfolio of real remote operations deliverables",
    ],
    outcomes: [
      "Qualify for Head of Operations and VP Ops roles at remote companies",
      "Earn $3,000–$7,000/month managing global teams",
      "Build the systems infrastructure for early-stage startups",
      "Get placed via OPSly HR with vetted global clients",
    ],
    whoIsItFor: [
      "Operations professionals with 1–3 years of experience ready to lead",
      "Project managers transitioning into operations leadership",
      "Business owners who need to systemise and delegate effectively",
      "Remote workers who want to move from execution to management",
    ],
    curriculum: [
      {
        week: "Week 01",
        title: "The Architecture of Remote Operations",
        lessons: [
          "How high-performance remote teams are structured",
          "The ops manager mandate: outcomes not activities",
          "Tool stack setup: ClickUp, Notion, Slack configuration",
          "Week 1 project: Audit an existing ops process",
        ],
      },
      {
        week: "Week 02",
        title: "Process Design & Documentation",
        lessons: [
          "SOP writing that teams actually follow",
          "Building a team wiki and knowledge base",
          "Process mapping with tools and swimlane diagrams",
          "Project: Write 3 SOPs for your target industry",
        ],
      },
      {
        week: "Week 03",
        title: "Team Management & Communication",
        lessons: [
          "Async-first communication frameworks",
          "Running daily standups and weekly ops reviews",
          "Managing across time zones without micromanagement",
          "1:1 structure and performance feedback systems",
        ],
      },
      {
        week: "Week 04",
        title: "Goals, Metrics & Accountability",
        lessons: [
          "OKR setup and tracking for remote teams",
          "KPI dashboards and team scorecards",
          "Identifying and resolving operational bottlenecks",
          "Project: Build a complete team performance dashboard",
        ],
      },
      {
        week: "Week 05",
        title: "Stakeholder Management & Reporting",
        lessons: [
          "How to communicate ops to non-ops leadership",
          "Building executive-level status reports",
          "Managing up, across, and down in a remote org",
          "Presentation: Present your operations plan to peers",
        ],
      },
      {
        week: "Week 06",
        title: "Portfolio Build & Marketplace Onboarding",
        lessons: [
          "Capstone: Build a complete remote ops system for a client scenario",
          "Positioning for senior ops roles globally",
          "OPSly marketplace profile and interview readiness",
          "Graduation + placement fast-track",
        ],
      },
    ],
    testimonials: [
      {
        name: "Seun Adeyemi",
        country: "Nigeria",
        flag: "🇳🇬",
        before: "Project Coordinator",
        after: "Head of Operations",
        income: "$4,500/mo",
        quote:
          "This programme taught me how to lead — not just execute. I landed a Head of Ops role at a US fintech within two months of graduating.",
        image:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Kofi Mensah",
        country: "Ghana",
        flag: "🇬🇭",
        before: "Operations Assistant",
        after: "Remote Operations Manager",
        income: "$3,800/mo",
        quote:
          "The SOP and system-building modules were worth the entire programme alone. I use those frameworks every single day.",
        image:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Blessing Okafor",
        country: "Kenya",
        flag: "🇰🇪",
        before: "Team Lead",
        after: "VP of Operations",
        income: "$6,200/mo",
        quote:
          "OPSly didn't just give me skills — they gave me a professional network and a career path I didn't know existed.",
        image:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=200",
      },
    ],
  },
  {
    id: "3",
    slug: "customer-support-operations",
    title: "Customer Support Operations",
    tagline: "Build Support Systems That Scale. Lead Teams That Deliver.",
    description:
      "A 3-week program covering the tools, processes, and leadership skills to build and manage high-performance customer support operations for global companies.",
    duration: "3 Weeks",
    level: "Beginner",
    outcome: "Support Operations Lead",
    tools: ["Intercom", "Zendesk", "Notion", "Slack", "Loom", "Typeform"],
    nextCohort: "May 5, 2026",
    slotsTotal: 20,
    slotsFilled: 11,
    priceNaira: 149000,
    priceUSD: 99,
    whatYoullLearn: [
      "Design a customer support system from first principles",
      "Set up and configure Intercom and Zendesk for scale",
      "Build macro libraries, canned responses, and escalation flows",
      "Track CSAT, FRT, and resolution rate KPIs",
      "Train and manage remote support agents across time zones",
      "Create self-service help centers that reduce ticket volume",
    ],
    outcomes: [
      "Earn $2,000–$4,500/month as a remote Support Ops Lead",
      "Run customer support operations for global SaaS companies",
      "Build systems that reduce response times and improve CSAT",
      "Fast-track into the OPSly talent marketplace",
    ],
    whoIsItFor: [
      "Customer service professionals ready to move into leadership",
      "Operations assistants looking to specialise in support systems",
      "Community managers who want to formalise their support function",
      "Beginners who want a fast path into global remote work",
    ],
    curriculum: [
      {
        week: "Week 01",
        title: "Support Systems Architecture",
        lessons: [
          "How world-class support operations are designed",
          "Zendesk and Intercom setup: channels, routing, automations",
          "Writing macros and canned responses that actually help",
          "Building your support knowledge base from scratch",
        ],
      },
      {
        week: "Week 02",
        title: "Metrics, Quality & Escalation",
        lessons: [
          "The 5 KPIs every support ops lead must track",
          "Building a QA scorecard and review process",
          "Escalation flows, SLA management, and breach handling",
          "Project: Audit a real support inbox and redesign it",
        ],
      },
      {
        week: "Week 03",
        title: "Team Management & Placement",
        lessons: [
          "Hiring, onboarding, and managing remote support agents",
          "Shift coverage across multiple time zones",
          "Portfolio: present a full support operations plan",
          "OPSly marketplace onboarding and profile setup",
        ],
      },
    ],
    testimonials: [
      {
        name: "Fatima Al-Hassan",
        country: "Nigeria",
        flag: "🇳🇬",
        before: "Customer Service Rep",
        after: "Support Operations Lead",
        income: "$2,600/mo",
        quote:
          "I went from answering tickets to designing the entire system. The transformation in just 3 weeks was unreal.",
        image:
          "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "David Asante",
        country: "Ghana",
        flag: "🇬🇭",
        before: "Call Centre Agent",
        after: "Remote Support Manager",
        income: "$3,100/mo",
        quote:
          "I was skeptical about a 3-week programme but this was more practical than anything I'd done in 5 years of working in support.",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Ngozi Eze",
        country: "Nigeria",
        flag: "🇳🇬",
        before: "Social Media Manager",
        after: "CX Operations Specialist",
        income: "$2,400/mo",
        quote:
          "The Zendesk setup and macros module alone was worth it. My first client hired me specifically because I could set up their entire support infrastructure.",
        image:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      },
    ],
  },
  {
    id: "4",
    slug: "social-media-management",
    title: "Social Media Management",
    tagline: "Build Brand Presence. Drive Growth. Master Social Operations.",
    description:
      "A 4-week program that transforms social media management into a structured, systemised discipline — with content strategy, growth frameworks, and analytics systems.",
    duration: "4 Weeks",
    level: "Beginner",
    outcome: "Social Media Manager",
    tools: ["Buffer", "Later", "Notion", "Canva", "Zapier", "Meta Business Suite", "TikTok", "LinkedIn"],
    nextCohort: "May 19, 2026",
    slotsTotal: 20,
    slotsFilled: 7,
    priceNaira: 149000,
    priceUSD: 99,
    whatYoullLearn: [
      "Build a brand content strategy from foundations to execution",
      "Design and manage multi-platform content calendars",
      "Master content creation workflows using Canva and AI tools",
      "Implement growth and engagement strategies that scale",
      "Track performance analytics and build client reports",
      "Access the OPSly talent marketplace as a vetted SMM Specialist",
    ],
    outcomes: [
      "Earn $1,800–$4,000/month managing social media for global brands",
      "Run the social media function for multiple clients with high efficiency",
      "Build scalable content systems that deliver consistent results",
      "Access the OPSly talent marketplace as a Social Media Manager",
    ],
    whoIsItFor: [
      "Social media managers who want to level up their strategy and systems",
      "VA and admin professionals adding SMM to their service offering",
      "Freelancers who want to manage multiple clients professionally",
      "Beginners who want to break into social media marketing",
    ],
    curriculum: [
      {
        week: "Week 01",
        title: "Social Media Foundations & Brand Understanding",
        lessons: [
          "Role of a social media manager in modern businesses",
          "Understanding brand identity and positioning",
          "Content vs marketing vs growth distinction",
          "Platform ecosystems (Instagram, TikTok, LinkedIn)",
          "Audience psychology and behavior",
          "Content consumption patterns & Brand voice development",
          "Competitive content analysis frameworks",
        ],
        assignment: "Analyze 3 brands: Their content strategy, audience engagement approach, and growth strategy breakdown.",
      },
      {
        week: "Week 02",
        title: "Content Strategy & Content Creation Systems",
        lessons: [
          "Content strategy frameworks and pillars mapping",
          "Building and managing content calendars",
          "Hook writing techniques and caption frameworks",
          "Storytelling for social media",
          "Content formats: Reels, Carousels, Threads",
          "Visual content planning systems",
          "Canva workflow and production speed",
        ],
        assignment: "Build a 7-day content plan for a brand: Post ideas, captions, and content pillars mapping.",
      },
      {
        week: "Week 03",
        title: "Growth Systems & Engagement Strategies",
        lessons: [
          "Social media algorithms explained",
          "Organic growth strategies and viral mechanics",
          "Engagement strategies and community building",
          "Audience retention and performance tracking",
          "Analytics interpretation and optimization techniques",
          "Scaling engagement without ads",
          "Content optimization for higher reach",
        ],
        assignment: "Create a growth strategy for a brand: Content improvement plan, engagement strategy, and growth projection.",
      },
      {
        week: "Week 04",
        title: "Portfolio Project, Client Readiness & Marketplace",
        lessons: [
          "Turning social media work into professional case studies",
          "Presenting content strategies to clients",
          "Pricing social media management services & onboarding",
          "Managing client expectations and communication",
          "Interview preparation: Growth strategy and decision reasoning",
          "OPSly marketplace application and positioning",
        ],
        assignment: "Complete Final Project and prepare SMM talent profile.",
      },
    ],
    marketplaceReadiness: [
      "Build SMM profile",
      "Upload portfolio",
      "Apply for first gigs",
    ],
    finalProject: {
      title: "7-Day Brand Social Simulation",
      requirements: [
        "Content calendar",
        "Daily content execution",
        "Engagement strategy",
        "Performance report",
      ],
    },
    testimonials: [
      {
        name: "Adaeze Nwosu",
        country: "Nigeria",
        flag: "🇳🇬",
        before: "Social Media Poster",
        after: "Social Operations Manager",
        income: "$2,200/mo",
        quote:
          "I stopped being just a 'content person' and became a systems thinker. Clients now pay me to run their entire social operation, not just post.",
        image:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Emmanuel Darko",
        country: "Ghana",
        flag: "🇬🇭",
        before: "Freelance Designer",
        after: "Social & Content Ops Lead",
        income: "$2,800/mo",
        quote:
          "The content pipeline and Zapier modules changed everything. I now manage 3 clients on retainer with a system that practically runs itself.",
        image:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Ife Adeleke",
        country: "Kenya",
        flag: "🇰🇪",
        before: "Marketing Intern",
        after: "SMO Specialist",
        income: "$1,900/mo",
        quote:
          "It's a 3-week programme that gives you a 3-year headstart. The frameworks are genuinely world-class.",
        image:
          "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200",
      },
    ],
  },
  {
    id: "5",
    slug: "virtual-assistant-operations",
    title: "Virtual Assistant / Virtual Operations",
    tagline: "Master Remote Operations. Become a High-Value Virtual Operator.",
    description:
      "A 4-week intensive program that transforms administrative professionals into high-value Virtual Assistants and Operations Managers — equipped with the systems, tools, and mindset global businesses need.",
    duration: "4 Weeks",
    level: "Beginner",
    outcome: "Virtual Operations Manager / VA",
    tools: ["Notion", "Calendly", "Gmail", "Google Workspace", "Loom", "Slack", "Trello", "Asana"],
    nextCohort: "May 12, 2026",
    slotsTotal: 20,
    slotsFilled: 12,
    priceNaira: 199000,
    priceUSD: 149,
    whatYoullLearn: [
      "Build a complete virtual assistant operating system from scratch",
      "Manage complex scheduling, inbox, and tasks across time zones",
      "Create professional business correspondence and SOPs",
      "Design and maintain digital workspaces in Notion and Trello",
      "Operate with a task ownership mindset, not just execution",
      "Build a professional operations portfolio for global clients",
    ],
    outcomes: [
      "Earn $2,000–$4,500/month as a remote Virtual Operations Manager",
      "Support founders and executives at global companies",
      "Build the systems infrastructure for remote-first teams",
      "Access the OPSly talent marketplace as a vetted Virtual Operator",
    ],
    whoIsItFor: [
      "Admin professionals ready to earn more and work globally",
      "Personal assistants who want to go remote and level up",
      "Career changers who are naturally organised and proactive",
      "Recent graduates seeking high-income remote roles",
    ],
    curriculum: [
      {
        week: "Week 01",
        title: "Foundations of Virtual Operations",
        lessons: [
          "Virtual operations vs traditional assistant roles",
          "Types of VA roles in modern businesses",
          "Business operations structure & remote team communication",
          "Professional standards & email etiquette",
          "Task ownership vs task execution mindset",
          "Intro to tools: Google Workspace, Notion, Trello/Asana",
          "Managing digital workspaces and organizational systems",
        ],
        assignment: "Simulate managing a CEO’s digital workspace: Inbox categorization, Calendar organization, and Task prioritization structure.",
      },
      {
        week: "Week 02",
        title: "Core VA Systems & Business Support Operations",
        lessons: [
          "Email management systems (sorting, prioritizing, responding)",
          "Calendar and scheduling systems",
          "Task management systems (Notion, Trello workflows)",
          "Document management and file organization architecture",
          "Data entry and structuring systems",
          "CRM basics and client communication frameworks",
          "Meeting coordination and reporting systems",
        ],
        assignment: "Build a full virtual assistant operating system: Inbox system, Calendar system, Task tracking system, and Reporting template.",
      },
      {
        week: "Week 03",
        title: "Advanced Operations & Client Support Systems",
        lessons: [
          "Customer support workflows and communication pipelines",
          "Creating and executing SOPs (Standard Operating Procedures)",
          "Problem escalation systems & workflow optimization",
          "Managing multiple clients simultaneously",
          "Remote team coordination basics",
          "Operational consistency and reliability systems",
          "Reporting systems for business owners",
        ],
        assignment: "Run a full simulated weekly operations system: Inbox management, Task execution tracking, Calendar scheduling, and Weekly performance report.",
      },
      {
        week: "Week 04",
        title: "Portfolio, Interview Prep & Marketplace Readiness",
        lessons: [
          "Structuring VA work into professional portfolios",
          "Writing operations case studies",
          "How to present yourself to clients & pricing services",
          "Client onboarding processes",
          "Interview preparation: Handling requests and pressure",
          "OPSly marketplace overview & application strategy",
          "Building long-term client relationships",
        ],
        assignment: "Complete Final Project and prepare OPSly talent profile.",
      },
    ],
    marketplaceReadiness: [
      "Create VA profile",
      "Upload operations portfolio",
      "Apply for first roles",
      "Interview readiness simulation",
    ],
    finalProject: {
      title: "Virtual Operations Manager Simulation",
      requirements: [
        "Inbox management system",
        "Calendar scheduling system",
        "Task tracking system",
        "Weekly operations report",
        "Communication log system",
      ],
    },
    testimonials: [
      {
        name: "Chioma Obi",
        country: "Nigeria",
        flag: "🇳🇬",
        before: "Office Administrator",
        after: "Remote Executive Assistant",
        income: "$3,200/mo",
        quote:
          "I used to think I wasn't 'technical enough' for remote work. OPSly proved me completely wrong. The Notion HQ module alone opened 3 client doors.",
        image:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Kwabena Asare",
        country: "Ghana",
        flag: "🇬🇭",
        before: "Personal Assistant",
        after: "Chief of Staff",
        income: "$5,000/mo",
        quote:
          "The strategic support module reframed my entire career. I'm not an assistant anymore — I'm a Chief of Staff to a US-based founder.",
        image:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Amina Said",
        country: "Kenya",
        flag: "🇰🇪",
        before: "Receptionist",
        after: "Remote EA (Tech Startup)",
        income: "$2,800/mo",
        quote:
          "I didn't think this was possible for me. Four weeks later, I was supporting a startup CEO in New York. OPSly is the real deal.",
        image:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=200",
      },
    ],
  },
  {
    id: "6",
    slug: "client-acquisition-for-operators",
    title: "Client Acquisition for Operators",
    tagline: "Build Your Pipeline. Win Clients. Work on Your Terms.",
    description:
      "A 4-week business development program for operations professionals who want to go freelance or build an agency — teaching client acquisition, proposal writing, and retainer structuring.",
    duration: "4 Weeks",
    level: "Intermediate",
    outcome: "Freelance Operator / Agency Founder",
    tools: ["LinkedIn", "Apollo.io", "Notion", "Calendly", "Stripe", "Loom"],
    nextCohort: "May 26, 2026",
    slotsTotal: 15,
    slotsFilled: 5,
    priceNaira: 199000,
    priceUSD: 149,
    whatYoullLearn: [
      "Build a client acquisition system from cold outreach to signed contract",
      "Write proposals and service offers that convert",
      "Price your services correctly for global markets",
      "Structure retainers, discovery calls, and client onboarding",
      "Build a LinkedIn presence that attracts inbound enquiries",
      "Manage multiple clients without burning out",
    ],
    outcomes: [
      "Earn $3,000–$10,000/month running your own operations practice",
      "Build a client roster of 3–5 retainer clients globally",
      "Operate a lean, profitable one-person operations business",
      "Combine OPSly placements with your own client pipeline",
    ],
    whoIsItFor: [
      "Operations professionals who want to go freelance or consulting",
      "OPSly graduates looking to build their own client base",
      "Remote workers tired of single-employer dependency",
      "Operators with 2+ years of experience ready to bet on themselves",
    ],
    curriculum: [
      {
        week: "Week 01",
        title: "Positioning & Offer Design",
        lessons: [
          "Freelance positioning fundamentals",
          "Why skills don’t get clients (offers do)",
          "Service packaging strategies",
          "High-value offer creation",
          "Niche selection frameworks",
          "Value proposition design",
          "Freelance business models (retainer, project-based, hourly)",
        ],
        assignment: "Create 2 structured freelance offers.",
      },
      {
        week: "Week 02",
        title: "Platform Setup & Personal Branding",
        lessons: [
          "Upwork profile optimization",
          "Fiverr gig structuring",
          "LinkedIn positioning for freelancers",
          "Portfolio structuring",
          "Personal branding fundamentals",
          "Trust-building systems in freelancing",
        ],
        assignment: "Fully optimize 1 freelancing platform profile.",
      },
      {
        week: "Week 03",
        title: "Client Acquisition Systems",
        lessons: [
          "Cold DM systems (LinkedIn, Instagram)",
          "Cold email outreach systems",
          "Proposal writing frameworks",
          "Lead generation strategies for freelancers",
          "Building consistent outreach systems",
          "Conversation conversion strategies",
        ],
        assignment: "Create and execute 20 outreach messages (simulated or real).",
      },
      {
        week: "Week 04",
        title: "Closing Clients, Interview Prep & Marketplace",
        lessons: [
          "Client closing frameworks",
          "Sales psychology for freelancers",
          "Discovery call structure",
          "Objection handling systems",
          "Pricing confidence strategies",
          "OPSly marketplace navigation",
          "Job application strategy",
        ],
        assignment: "Complete Final Project and prepare for first client acquisition.",
      },
    ],
    marketplaceReadiness: [
      "Apply to first jobs",
      "Position yourself for first client acquisition",
    ],
    finalProject: {
      title: "Freelance Client Pitch System",
      requirements: [
        "Write 3 client-winning proposals",
        "Simulate a client call",
        "Build a freelance portfolio pitch",
      ],
    },
    testimonials: [
      {
        name: "Tunde Afolabi",
        country: "Nigeria",
        flag: "🇳🇬",
        before: "In-house Ops Manager",
        after: "Freelance Operations Consultant",
        income: "$6,500/mo",
        quote:
          "I was terrified to go freelance. This programme gave me the exact system to find, close, and keep clients. I replaced my salary in 8 weeks.",
        image:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Grace Mwangi",
        country: "Kenya",
        flag: "🇰🇪",
        before: "Remote Ops Specialist",
        after: "Operations Agency Founder",
        income: "$9,200/mo",
        quote:
          "I went from one OPSly client to running my own agency with 6 clients. The proposal and retainer frameworks in this course are genuinely powerful.",
        image:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=200",
      },
      {
        name: "Samuel Owusu",
        country: "Ghana",
        flag: "🇬🇭",
        before: "Virtual Assistant",
        after: "Client Acquisition Specialist",
        income: "$4,800/mo",
        quote:
          "The outreach system in Week 2 got me 4 discovery calls in my first week. This programme is the missing piece for operations professionals.",
        image:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      },
    ],
  },
];

export const getCourseBySlug = (slug: string): AcademyCourse | undefined =>
  ACADEMY_COURSES.find((c) => c.slug === slug);
