-- Drop the existing policies first
DROP POLICY IF EXISTS "Public Read Fully Vetted Talents" ON "public"."talents";
DROP POLICY IF EXISTS "Public Read Work History" ON "public"."talent_work_history";
DROP POLICY IF EXISTS "Public Read Education" ON "public"."talent_education";
DROP POLICY IF EXISTS "Public Read Certifications" ON "public"."talent_certifications";

-- Policy for Public/Clients to view Fully Vetted & Approved Talents
CREATE POLICY "Public Read Fully Vetted Talents"
ON "public"."talents"
FOR SELECT
TO authenticated
USING (vetting_status IN ('fully_vetted', 'approved'));

-- Policy for viewing Work History of Vetted Talents
CREATE POLICY "Public Read Work History"
ON "public"."talent_work_history"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_work_history.talent_id
    AND talents.vetting_status IN ('fully_vetted', 'approved')
  )
);

-- Policy for viewing Education of Vetted Talents
CREATE POLICY "Public Read Education"
ON "public"."talent_education"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_education.talent_id
    AND talents.vetting_status IN ('fully_vetted', 'approved')
  )
);

-- Policy for viewing Certifications of Vetted Talents
CREATE POLICY "Public Read Certifications"
ON "public"."talent_certifications"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_certifications.talent_id
    AND talents.vetting_status IN ('fully_vetted', 'approved')
  )
);
