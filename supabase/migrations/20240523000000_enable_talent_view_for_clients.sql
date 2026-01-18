-- Enable RLS on talents if not already (it likely is)
ALTER TABLE "public"."talents" ENABLE ROW LEVEL SECURITY;

-- Policy for Public/Clients to view Fully Vetted Talents
CREATE POLICY "Public Read Fully Vetted Talents"
ON "public"."talents"
FOR SELECT
TO authenticated
USING (vetting_status = 'fully_vetted');

-- Policy for viewing Work History of Vetted Talents
CREATE POLICY "Public Read Work History"
ON "public"."talent_work_history"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_work_history.talent_id
    AND talents.vetting_status = 'fully_vetted'
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
    AND talents.vetting_status = 'fully_vetted'
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
    AND talents.vetting_status = 'fully_vetted'
  )
);

-- Policy for Vetting Notes (Maybe Restricted? User asked for it)
-- I will allow viewing if talent is vetted.
CREATE POLICY "Public Read Vetting Notes"
ON "public"."talent_vetting"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_vetting.talent_id
    AND talents.vetting_status = 'fully_vetted'
  )
);
