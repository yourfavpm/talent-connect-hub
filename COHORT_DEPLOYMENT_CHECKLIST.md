# ✅ COHORT ENFORCEMENT - DEPLOYMENT CHECKLIST

## 🚀 PRE-DEPLOYMENT (Before Migration)

- [ ] Backup current database
- [ ] Review `20260422_enforce_cohort_system.sql` migration
- [ ] Check for any existing enrollments without cohort_id:
  ```sql
  SELECT COUNT(*) FROM academy_enrollments WHERE cohort_id IS NULL;
  ```
  If > 0: **STOP** - Must manually assign cohorts to orphaned enrollments

## 🔄 DEPLOYMENT STEPS

### Step 1: Run Migration
- [ ] Execute: `supabase/migrations/20260422_enforce_cohort_system.sql`
- [ ] Verify no errors
- [ ] Monitor logs for "✅ COHORT-FIRST ENFORCEMENT COMPLETE" message

### Step 2: Verify Schema
```sql
-- Run these verification queries:
[ ] SELECT constraint_name FROM information_schema.table_constraints 
    WHERE table_name = 'academy_enrollments' AND constraint_type = 'UNIQUE';
    -- Should show: uk_enrollment_user_cohort

[ ] \d academy_enrollments
    -- Verify cohort_id shows "NOT NULL"

[ ] SELECT * FROM pg_policies WHERE tablename = 'academy_enrollments';
    -- Should show RLS policies
```

## 🧪 POST-DEPLOYMENT TESTING

### Test 1: New Enrollment Flow ✓
```
1. [ ] Go to: /courses/[program-slug]
2. [ ] Click: "Enroll Now"
3. [ ] Verify: Redirected to /checkout/[slug]
4. [ ] Verify: "Choose Your Cohort" step appears FIRST
5. [ ] Verify: Cannot click "Continue" without selecting cohort
6. [ ] Select: A cohort
7. [ ] Complete: Email → Password → Payment flow
8. [ ] Verify: Enrollment created in database with cohort_id
9. [ ] Verify: Webhook logs show "cohort_id" in metadata
10. [ ] Verify: User redirects to /dashboard
11. [ ] Verify: Dashboard shows enrolled cohort name
```

### Test 2: Cohort Access Control ✓
```
1. [ ] Log in as User A (enrolled in Cohort "April 2026")
2. [ ] Go to: /courses/[slug]/learn
3. [ ] Verify: Only April 2026 sessions appear
4. [ ] Query database as Admin: SELECT * FROM sessions WHERE cohort_id != 'april-2026-id'
5. [ ] Verify: User A cannot see results (RLS blocks it)
6. [ ] Log in as User B (enrolled in Cohort "May 2026")
7. [ ] Verify: User B sees May 2026 sessions only
8. [ ] Verify: April & May cohort students cannot see each other's content
```

### Test 3: Duplicate Prevention ✓
```
1. [ ] User C attempts to pay for same cohort twice
2. [ ] Webhook processes first payment → enrollment created
3. [ ] Webhook processes second payment with same (user_id, cohort_id)
4. [ ] Verify: INSERT fails or duplicate detected
5. [ ] Check logs for: "User already enrolled in this cohort"
```

### Test 4: Capacity Enforcement ✓
```
1. [ ] Create test cohort with max_slots = 2
2. [ ] Enroll User D → current_slots becomes 1
3. [ ] Enroll User E → current_slots becomes 2
4. [ ] Attempt to enroll User F
5. [ ] Verify: Payment webhook returns 400 "cohort full"
6. [ ] Verify: Enrollment NOT created for User F
```

### Test 5: Dashboard Display ✓
```
1. [ ] Log in to /dashboard
2. [ ] Verify: "My Programs" section appears
3. Each enrolled program shows:
   [ ] Program title
   [ ] Cohort name (e.g., "April 2026 Cohort")
   [ ] Start date
   [ ] End date
   [ ] Status (Upcoming/In Progress/Completed)
4. [ ] Click on a program → CourseHub loads
5. [ ] Verify: Sessions show cohort name in title
6. [ ] Verify: Assignments show cohort-specific dates
7. [ ] Verify: Only enrolled cohort's assignments/sessions visible
```

## 🔍 VERIFICATION QUERIES

Run these queries to verify enforcement is active:

```sql
-- 1. Check cohort_id is NOT NULL
SELECT COUNT(*) as orphaned_enrollments 
FROM academy_enrollments 
WHERE cohort_id IS NULL;
-- Expected result: 0

-- 2. Check UNIQUE constraint exists
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'academy_enrollments' 
AND constraint_name LIKE '%user_cohort%';
-- Expected: uk_enrollment_user_cohort | UNIQUE

-- 3. Verify RLS policies exist
SELECT policyname, qual 
FROM pg_policies 
WHERE tablename = 'academy_enrollments' 
AND policyname LIKE '%cohort%';
-- Should show cohort-based policies

-- 4. Test RLS (as student user)
SELECT COUNT(*) FROM sessions 
WHERE cohort_id NOT IN (
  SELECT cohort_id FROM academy_enrollments 
  WHERE user_id = auth.uid()
);
-- Expected: 0 or error (policy blocks it)
```

## 🚨 ROLLBACK PLAN

If critical issues found:

```bash
# Option 1: Drop just the enforcement rules
psql \
  -c "ALTER TABLE academy_enrollments DROP CONSTRAINT uk_enrollment_user_cohort;" \
  -c "ALTER TABLE academy_enrollments ALTER COLUMN cohort_id DROP NOT NULL;"

# Option 2: Full rollback (restore from backup)
# Restore database to pre-migration state
```

## 📋 ADMINISTRATION NOTES

### For Admins Creating Cohorts
- [ ] Always set: enrollment_start_date and enrollment_end_date
- [ ] Always set: max_slots (e.g., 25)
- [ ] Current_slots auto-increments - don't modify manually
- [ ] Only cohorts with status = 'open' appear in checkout

### For Support Team
- [ ] If user asks to change cohort: **Not possible** (design choice - unique per user)
- [ ] If user enrolled in wrong cohort: Create new enrollment in correct one + mark old as 'suspended'
- [ ] If cohort is full: Create new cohort or wait for cancellations

### For Developers
- [ ] Never bypass cohort_id requirement
- [ ] Always include cohort_id in Paystack metadata
- [ ] Always filter queries by cohort_id (use helper functions)
- [ ] Test with multiple cohorts to verify isolation

## ✅ SIGN-OFF

- [ ] Database backup created: __________ (date/time)
- [ ] Migration executed successfully: __________ (date/time)
- [ ] All verification tests passed: __________ (date/time)
- [ ] User acceptance testing complete: __________ (date/time)
- [ ] Documentation updated: __________ (date/time)
- [ ] Support team trained: __________ (date/time)

**Deployment Approved By:** __________________  
**Date:** __________________
