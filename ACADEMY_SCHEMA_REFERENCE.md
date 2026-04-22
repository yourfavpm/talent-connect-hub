# Academy Enrollments & Cohorts - Schema Reference

## 1. ACADEMY_ENROLLMENTS TABLE SCHEMA

### Column Definitions
```sql
CREATE TABLE IF NOT EXISTS public.academy_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,                                    -- Course slug
    course_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_phone TEXT,
    student_country TEXT,
    cohort_id UUID REFERENCES public.cohorts(id),              -- Link to cohort
    enrollment_status enum_enrollment_status DEFAULT 'active',  -- See enum below
    price_usd DECIMAL(10, 2) NOT NULL,
    price_naira DECIMAL(15, 2),
    currency TEXT DEFAULT 'USD',
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_granted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enrollment Status Enum Values
```sql
CREATE TYPE enum_enrollment_status AS ENUM (
    'pending_payment',    -- Waiting for payment confirmation
    'active',             -- Enrollment is active
    'completed',          -- Course completed
    'cancelled',          -- Enrollment cancelled
    'suspended'           -- Enrollment suspended
);
```

### Indexes
```sql
CREATE INDEX idx_academy_enrollments_user_id ON academy_enrollments(user_id);
CREATE INDEX idx_academy_enrollments_course_id ON academy_enrollments(course_id);
CREATE INDEX idx_academy_enrollments_status ON academy_enrollments(enrollment_status);
```

---

## 2. COHORTS TABLE SCHEMA

### Column Definitions
```sql
CREATE TABLE IF NOT EXISTS public.cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL,              -- Reference to academy_courses(slug) or uuid
    course_uuid UUID REFERENCES public.academy_courses(id),
    name TEXT NOT NULL,                   -- e.g., 'May 2026 Cohort'
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    enrollment_start_date TIMESTAMPTZ,    -- When enrollment opens
    enrollment_end_date TIMESTAMPTZ,      -- When enrollment closes
    price_usd DECIMAL(10, 2),
    price_naira DECIMAL(15, 2),
    status TEXT DEFAULT 'open',           -- open, ongoing, completed, cancelled
    zoom_link TEXT,                       -- Default/Recurrent meeting link
    max_slots INT DEFAULT 25,             -- Maximum students allowed
    current_slots INT DEFAULT 0,          -- Current enrollment count
    duration_weeks INT DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Status Values
- `open` - Enrollment is open
- `ongoing` - Cohort class is in progress
- `completed` - Cohort has finished
- `cancelled` - Cohort was cancelled

### Indexes
```sql
CREATE INDEX idx_cohorts_course_id ON public.cohorts(course_id);
CREATE INDEX idx_cohorts_status ON public.cohorts(status);
```

### Relationships
- `academy_enrollments.cohort_id` → `cohorts.id` (many-to-one)
- `sessions.cohort_id` → `cohorts.id` (one-to-many)
- `announcements.cohort_id` → `cohorts.id` (one-to-many)
- `assignments.cohort_id` → `cohorts.id` (one-to-many)

---

## 3. RELATED TABLES

### SESSIONS (Live Classes)
```sql
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    session_date TIMESTAMPTZ NOT NULL,
    start_time TEXT,                      -- Time of day (e.g., "2:00 PM")
    duration_minutes INT DEFAULT 60,
    meeting_url TEXT,
    recording_url TEXT,
    status TEXT DEFAULT 'upcoming',       -- upcoming, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### ANNOUNCEMENTS
```sql
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### ASSIGNMENTS
```sql
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deadline_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### SUBMISSIONS
```sql
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    link TEXT NOT NULL,                   -- Google Drive, Loom, etc.
    status TEXT DEFAULT 'submitted',      -- submitted, reviewed
    feedback TEXT,
    grade TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(assignment_id, student_id)    -- One submission per student per assignment
);
```

### ACADEMY_CERTIFICATES
```sql
CREATE TABLE IF NOT EXISTS public.academy_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT,
    cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE,      -- Auto-generated: OPS-XXXXXXXX-YYYY
    issue_date TIMESTAMPTZ DEFAULT now(),
    file_url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### COURSE_TRANSACTIONS
```sql
CREATE TABLE IF NOT EXISTS public.course_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paystack_reference TEXT UNIQUE NOT NULL,
    amount_naira DECIMAL(15, 2) NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status enum_transaction_status DEFAULT 'pending',
    payment_method TEXT DEFAULT 'paystack',
    authorization_url TEXT,
    access_code TEXT,
    receipt_url TEXT,
    customer_code TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. ROW LEVEL SECURITY (RLS) POLICIES

### Academy Enrollments Policies

#### Policy 1: Users can view their own enrollments
```sql
CREATE POLICY "Users can view their own enrollments" ON academy_enrollments
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
```

#### Policy 2: Users can insert their own enrollments
```sql
CREATE POLICY "Users can insert their own enrollments" ON academy_enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### Policy 3: Admins can view all enrollments
```sql
CREATE POLICY "Admins can view all enrollments" ON academy_enrollments
    FOR SELECT USING (public.is_admin(auth.uid()));
```

### Cohorts Policies

#### Policy 1: Public can view cohorts
```sql
CREATE POLICY "Public can view cohorts" ON public.cohorts 
    FOR SELECT USING (true);
```

#### Policy 2: Admins can manage cohorts
```sql
CREATE POLICY "Admins can manage cohorts" ON public.cohorts 
    FOR ALL USING (public.is_admin(auth.uid()));
```

### Sessions Policies

#### Policy 1: Enrolled students can view cohort sessions
```sql
CREATE POLICY "Enrolled students can view cohort sessions" ON public.sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.academy_enrollments
            WHERE academy_enrollments.cohort_id = sessions.cohort_id
              AND academy_enrollments.user_id = auth.uid()
              AND academy_enrollments.enrollment_status = 'active'
        ) OR public.is_admin(auth.uid())
    );
```

#### Policy 2: Admins can manage sessions
```sql
CREATE POLICY "Admins can manage sessions" ON public.sessions 
    FOR ALL USING (public.is_admin(auth.uid()));
```

### Announcements Policies

#### Policy 1: Enrolled students can view announcements
```sql
CREATE POLICY "Enrolled students can view announcements" ON public.announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.academy_enrollments
            WHERE academy_enrollments.cohort_id = announcements.cohort_id
              AND academy_enrollments.user_id = auth.uid()
              AND academy_enrollments.enrollment_status = 'active'
        ) OR public.is_admin(auth.uid())
    );
```

#### Policy 2: Admins can manage announcements
```sql
CREATE POLICY "Admins can manage announcements" ON public.announcements 
    FOR ALL USING (public.is_admin(auth.uid()));
```

### Assignments Policies

#### Policy 1: Enrolled students can view assignments
```sql
CREATE POLICY "Enrolled students can view assignments" ON public.assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.academy_enrollments
            WHERE academy_enrollments.cohort_id = assignments.cohort_id
              AND academy_enrollments.user_id = auth.uid()
              AND academy_enrollments.enrollment_status = 'active'
        ) OR public.is_admin(auth.uid())
    );
```

#### Policy 2: Admins can manage assignments
```sql
CREATE POLICY "Admins can manage assignments" ON public.assignments 
    FOR ALL USING (public.is_admin(auth.uid()));
```

### Submissions Policies

#### Policy 1: Students can view own submissions
```sql
CREATE POLICY "Students can view own submissions" ON public.submissions
    FOR SELECT USING (auth.uid() = student_id OR public.is_admin(auth.uid()));
```

#### Policy 2: Students can insert own submissions
```sql
CREATE POLICY "Students can insert own submissions" ON public.submissions
    FOR INSERT WITH CHECK (auth.uid() = student_id);
```

#### Policy 3: Students can update own submissions
```sql
CREATE POLICY "Students can update own submissions" ON public.submissions
    FOR UPDATE USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
```

### Certificates Policies

#### Policy 1: Students can view own certificates
```sql
CREATE POLICY "Students can view own certificates" ON public.academy_certificates
    FOR SELECT USING (auth.uid() = student_id OR public.is_admin(auth.uid()));
```

#### Policy 2: Admins can manage certificates
```sql
CREATE POLICY "Admins can manage certificates" ON public.academy_certificates 
    FOR ALL USING (public.is_admin(auth.uid()));
```

---

## 5. REACT COMPONENT QUERIES

### StudentDashboard - Fetch User Enrollments
**File:** [src/pages/academy/StudentDashboard.tsx](src/pages/academy/StudentDashboard.tsx#L94)

```typescript
// Fetch enrollments (without FK joins that may not exist)
const { data: enrollmentsData, error: enrollError } = await supabase
  .from("academy_enrollments")
  .select("*")
  .eq("user_id", user.id)
  .eq("enrollment_status", "active");

if (enrollError) {
  console.error("Error fetching enrollments:", enrollError);
} else {
  const typedEnrollments = (enrollmentsData || []) as any[];
  setEnrollments(typedEnrollments);

  if (typedEnrollments.length > 0) {
    // Fetch course metadata separately by slug
    const courseSlugs = typedEnrollments.map(e => e.course_id).filter(Boolean);
    if (courseSlugs.length > 0) {
      const { data: coursesData } = await supabase
        .from("academy_courses")
        .select("id, slug, title, image_url")
        .in("slug", courseSlugs);
      
      // Map courses data...
    }
    
    // Fetch next upcoming live session
    const cohortIds = typedEnrollments.map(e => e.cohort_id).filter(Boolean);
    if (cohortIds.length > 0) {
      const now = new Date().toISOString();
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("*")
        .in("cohort_id", cohortIds)
        .gte("session_date", now.split('T')[0])
        .eq("status", "scheduled")
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(1)
        .single();
    }
  }
}
```

### CourseHub - Fetch Enrollment with Cohort Info
**File:** [src/pages/academy/CourseHub.tsx](src/pages/academy/CourseHub.tsx#L109)

```typescript
// Fetch Enrollment & Cohort with nested data
const { data: enrollData, error: enrollError } = await (supabase
  .from("academy_enrollments")
  .select("*, cohorts!cohort_id(*), academy_courses!course_id!inner(slug)")
  .eq("user_id", user.id)
  .eq("academy_courses.slug", slug)
  .single() as Promise<{ data: Enrollment & { cohorts: Cohort } | null; error: any }>);

if (enrollError || !enrollData) {
  toast({
    title: "Access Denied",
    description: "You are not enrolled in this program.",
    variant: "destructive"
  });
  navigate("/dashboard");
  return;
}

const typedEnrollData = enrollData;
const cohortId = typedEnrollData.cohort_id;

// Fetch Sessions, Announcements, Assignments & Submissions in Parallel
const [sessionsRes, announcementsRes, assignmentsRes, submissionsRes] = await Promise.all([
  supabase.from("sessions")
    .select("*")
    .eq("cohort_id", cohortId)
    .order("session_date", { ascending: true }),
  supabase.from("announcements")
    .select("*")
    .eq("cohort_id", cohortId)
    .order("created_at", { ascending: false }),
  supabase.from("assignments")
    .select("*")
    .eq("cohort_id", cohortId)
    .order("deadline_at", { ascending: true }),
  supabase.from("submissions")
    .select("*")
    .eq("user_id", user.id)
]);

setSessions(sessionsRes.data || []);
setAnnouncements(announcementsRes.data || []);
setAssignments(assignmentsRes.data || []);
setSubmissions(submissionsRes.data || []);
```

### CourseDetail - Check If User Is Enrolled
**File:** [src/pages/academy/CourseDetail.tsx](src/pages/academy/CourseDetail.tsx#L102)

```typescript
const { data: enrollment } = await supabase
  .from("academy_enrollments")
  .select("*")
  .eq("user_id", user.id)
  .eq("course_id", courseSlug)
  .eq("enrollment_status", "active")
  .single();
```

### Checkout - Create Enrollment Record
**File:** [src/pages/academy/Checkout.tsx](src/pages/academy/Checkout.tsx#L259)

```typescript
const { error: enrollErr } = await supabase.from("academy_enrollments").insert({
  user_id: user.id,
  course_id: courseId,
  course_name: courseName,
  student_email: user.email || "",
  student_name: user.user_metadata?.full_name || "",
  student_phone: phone,
  student_country: country,
  cohort_id: selectedCohortId || null,
  price_usd: coursePrice.usd,
  price_naira: coursePrice.naira,
  currency: "USD",
  enrollment_status: "active",
});
```

---

## 6. ADMIN PANEL QUERIES

### AcademyManagement - Fetch Dashboard Stats
**File:** [src/pages/admin/Academy/AcademyManagement.tsx](src/pages/admin/Academy/AcademyManagement.tsx#L65)

```typescript
// Fetch Cohorts
const { data: cohortsData, error: cohortsError } = await supabase
  .from("cohorts")
  .select("*")
  .order("start_date", { ascending: false });

// Fetch enrollment stats
const { count: studentCount } = await supabase
  .from("academy_enrollments")
  .select("*", { count: 'exact', head: true })
  .eq("enrollment_status", "active");

// Fetch revenue
const { data: revenueData } = await supabase
  .from("academy_enrollments")
  .select("price_naira")
  .eq("enrollment_status", "active");

const totalRev = revenueData?.reduce((acc, curr) => acc + (curr.price_naira || 0), 0) || 0;

// Calculate stats
setStats({
  totalStudents: studentCount || 0,
  activeCohorts: cohortsData?.filter(c => c.status === 'open').length || 0,
  totalRevenue: totalRev,
  pendingGraduations: 12 // Mocked
});
```

### CourseCohorts - List Cohorts for Course
**File:** [src/pages/admin/Academy/CourseCohorts.tsx](src/pages/admin/Academy/CourseCohorts.tsx#L53)

```typescript
// Fetch course info
const { data: courseData, error: courseError } = await supabase
  .from("academy_courses")
  .select("id, title")
  .eq("slug", slug)
  .single();

if (courseError) throw courseError;
setCourseTitle(courseData.title);

// Fetch cohorts for the course
const { data: cohortsData, error: cohortsError } = await supabase
  .from("cohorts")
  .select("*")
  .eq("course_id", courseData.id)
  .order("start_date", { ascending: false });

if (cohortsError) throw cohortsError;
setCohorts(cohortsData as Cohort[]);
```

### CohortDetail - Complete Cohort Management
**File:** [src/pages/admin/Academy/CohortDetail.tsx](src/pages/admin/Academy/CohortDetail.tsx#L144)

```typescript
const fetchCohortData = async () => {
  if (!id) return;
  
  // 1. Fetch Cohort
  const { data: cohortData, error: cohortError } = await supabase
    .from("cohorts")
    .select("*")
    .eq("id", id)
    .single();

  if (cohortError) throw cohortError;
  setCohort(cohortData);

  // 2. Fetch All Data in Parallel
  const [studentsRes, sessionsRes, announcementsRes, assignmentsRes, submissionsRes] = await Promise.all([
    supabase.from("academy_enrollments")
      .select("*")
      .eq("cohort_id", id),
    supabase.from("sessions")
      .select("*")
      .eq("cohort_id", id)
      .order("session_date", { ascending: true }),
    supabase.from("announcements")
      .select("*")
      .eq("cohort_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("assignments")
      .select("*")
      .eq("cohort_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("submissions")
      .select("*, assignments(title), profiles:student_id(full_name, email)")
      .order("created_at", { ascending: false })
  ]);

  setStudents(studentsRes.data || []);
  setSessions(sessionsRes.data || []);
  setAnnouncements(announcementsRes.data || []);
  setAssignments(assignmentsRes.data || []);
  setSubmissions(submissionsRes.data || []);
};
```

#### Create Session in CohortDetail
```typescript
const handleCreateSession = async () => {
  if (!newSession.title || !newSession.date) return;
  
  const { data, error } = await (supabase.from("sessions") as any).insert([{
    cohort_id: id,
    title: newSession.title,
    session_date: newSession.date,
    start_time: newSession.start_time,
    meeting_url: newSession.url,
    status: 'scheduled'
  }]).select().single();

  if (error) throw error;
  setSessions(prev => [...prev, data]);
};
```

#### Mark Student as Top Graduate
```typescript
const { error } = await (supabase.from('academy_enrollments') as any)
  .update({ is_top_grad: newVal })
  .eq('id', student.id);
```

---

## 7. PAYSTACK INTEGRATION QUERIES

**File:** [src/lib/paystack.ts](src/lib/paystack.ts#L104)

### Create Enrollment with Pending Payment Status
```typescript
const { data: enrollment, error: enrollmentError } = await (supabase
  .from("academy_enrollments")
  .insert([
    {
      user_id: user.id,
      course_id: params.courseId,
      cohort_id: params.cohortId,
      course_name: params.courseName,
      student_email: params.studentEmail,
      student_name: params.studentName,
      student_phone: params.studentPhone,
      student_country: params.studentCountry,
      price_usd: params.priceUSD,
      price_naira: params.priceNaira,
      currency: "USD",
      enrollment_status: "pending_payment",
    }
  ])
  .select()
  .single());

// Create transaction record
const { data: transaction, error: transactionError } = await (supabase
  .from("course_transactions")
  .insert([
    {
      enrollment_id: enrollment?.id,
      user_id: user.id,
      paystack_reference: reference,
      amount_naira: params.priceNaira,
      amount_usd: params.priceUSD,
      currency: "NGN",
      status: "pending",
    }
  ])
  .select()
  .single());
```

### Update Enrollment Status on Payment Success
```typescript
const { data: updated } = await supabase
  .from("academy_enrollments")
  .update({
    enrollment_status: "active",
    access_granted_at: new Date().toISOString(),
  })
  .eq("id", enrollmentId);
```

---

## 8. KEY RELATIONSHIPS & QUERY PATTERNS

### Enrollment Flow
1. User creates enrollment with `enrollment_status: 'pending_payment'`
2. Transaction record created with `status: 'pending'`
3. Paystack webhook confirms payment
4. Enrollment status updated to `'active'`
5. User gains access to cohort materials

### Cohort Access Control
```sql
-- Users can only see content for cohorts they're enrolled in with active status
SELECT e.cohort_id
FROM academy_enrollments e
WHERE e.user_id = auth.uid()
  AND e.enrollment_status = 'active'
```

### Admin Access Pattern
```sql
-- All admins can access everything
SELECT * FROM <table>
WHERE public.is_admin(auth.uid()) = true
```

### Student Dashboard Query
```sql
SELECT 
  ae.*,
  c.id as cohort_id,
  c.name as cohort_name,
  c.start_date,
  ac.slug,
  ac.title,
  ac.image_url
FROM academy_enrollments ae
LEFT JOIN cohorts c ON ae.cohort_id = c.id
LEFT JOIN academy_courses ac ON ae.course_id = ac.slug
WHERE ae.user_id = auth.uid()
  AND ae.enrollment_status = 'active'
ORDER BY ae.created_at DESC
```

---

## 9. IMPORTANT NOTES

- **RLS is enabled** on all academy tables - queries must respect user access policies
- **Cohort ID is optional** for enrollments - legacy enrollments may not have cohort_id
- **Status checks** - Always filter by `enrollment_status = 'active'` for current enrollments
- **Foreign Keys** - cascade delete policies mean removing a cohort removes all related sessions, assignments, etc.
- **Admin Function** - Uses `public.is_admin(auth.uid())` to check admin role in user_roles table
- **Timestamps** - All dates stored as TIMESTAMPTZ for proper timezone handling
- **Pricing** - Both USD and Naira stored; Paystack uses Naira internally

---

## 10. MIGRATION FILES REFERENCE

- **20260412_academy_enrollments.sql** - Initial enrollment schema with RLS
- **20260413_academy_live_cohorts.sql** - Cohorts, sessions, announcements, assignments
- **20260413_academy_master_v2.sql** - Consolidated academy schema
- **20260422_update_cohorts_schema.sql** - Enhanced cohorts with slots and enrollment dates
