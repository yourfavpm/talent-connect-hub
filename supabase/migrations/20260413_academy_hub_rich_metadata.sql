-- ============================================================
-- ACADEMY HUB - SCHEMA EXPANSION (Rich Course Metadata)
-- ============================================================

-- Add rich metadata columns to academy_courses
ALTER TABLE public.academy_courses 
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS learning_outcomes jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS curriculum jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tools jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS what_youll_learn jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS who_is_it_for jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS bonus_description text,
ADD COLUMN IF NOT EXISTS slots_total integer DEFAULT 25,
ADD COLUMN IF NOT EXISTS slots_filled integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_cohort_date text;

-- Update RLS (already exists but ensures all columns are accessible)
-- Policy for public read already exists from previous migration

-- SEED DATA UPDATE (Example for AI Operations)
UPDATE public.academy_courses
SET 
    tagline = 'Master the AI-First Operations Workflow',
    learning_outcomes = '["Automate complex business processes using AI agents", "Design custom GPTs for organizational efficiency", "Architect multi-model operational pipelines"]',
    curriculum = '[
        {"week": 1, "topic": "AI Foundations & Prompt Architecture", "details": ["The Prompt Engineering Framework", "Tool-use & Function Calling", "Temperature & Top-P Tuning"]},
        {"week": 2, "topic": "Process Automation with Zapier/Make AI", "details": ["Trigger mapping", "Multi-step AI chains", "Error handling in AI workflows"]}
    ]',
    tools = '["ChatGPT", "Zapier", "Make.com", "Claude", "Notion AI"]',
    what_youll_learn = '["Advanced Prompt Engineering", "AI Workflow Mapping", "Custom GPT Development", "Agentic Process Automation"]',
    who_is_it_for = '["Operational Leaders", "Executive Assistants", "Efficiency Consultants", "Product Managers"]',
    bonus_description = 'Top students in the flagship cohort will receive a MacBook Air M3 to support their new high-performance career.',
    next_cohort_date = 'May 12, 2026'
WHERE slug = 'ai-operations';
