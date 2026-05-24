import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
    Users, 
    Calendar, 
    Bell, 
    FileText, 
    ArrowLeft, 
    Plus, 
    Video, 
    Clock, 
    CheckCircle2, 
    Trash2,
    Settings,
    ChevronRight,
    Loader2,
    MoreVertical,
    ExternalLink,
    Star,
    Award,
    Lock,
    AlertTriangle,
    Mail,
    X,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getInternalPath } from "@/utils/subdomain";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import BatchEmailModal from "@/pages/admin/TalentDirectory/components/BatchEmailModal";

interface Cohort {
    id: string;
    name: string;
    course_id: string;
    start_date: string;
    status: string;
    price_usd: number;
    price_naira: number;
}

interface Student {
    id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    enrollment_status: string;
    is_top_grad: boolean;
    progress_percent: number;
    streak_count?: number;
    total_study_hours?: number;
    created_at: string;
}

interface Session {
    id: string;
    title: string;
    session_date: string;
    start_time: string;
    meeting_url: string;
    status: string;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    image_url?: string;
    created_at: string;
}

interface Assignment {
    id: string;
    title: string;
    description: string;
    deadline_at: string;
    created_at: string;
}

interface Submission {
    id: string;
    assignment_id: string;
    student_id: string;
    link: string;
    status: string;
    feedback: string;
    grade: string;
    rubric_grades?: any[];
    created_at: string;
    assignments: { title: string; rubrics?: any[] };
    profiles: { full_name: string; email: string };
}

const CohortDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [cohort, setCohort] = useState<Cohort | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [activeTab, setActiveTab] = useState("students");

    // Form States
    const [newSession, setNewSession] = useState({ title: '', date: '', start_time: '', url: '' });
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', image_url: '' });
    const [newAssignment, setNewAssignment] = useState({ 
        title: '', 
        description: '', 
        deadline: '',
        rubrics: [] as { id: string; title: string; description: string; max_points: number }[]
    });
    
    // Grading Form State (Build Fix: 2026-05-02)
    const [gradingSub, setGradingSub] = useState<{ 
        id: string; 
        grade: string; 
        feedback: string; 
        rubric_grades: any[]; 
        assignment_rubrics: any[] 
    } | null>(null);
    const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
    
    const handleUpdateAssignment = async () => {
        if (!editingAssignment) return;
        setIsSaving(true);
        try {
            const maxPoints = editingAssignment.rubrics?.reduce((sum: number, r: any) => sum + (r.max_points || 0), 0) || 100;
            const { error } = await supabase.from("assignments").update({
                title: editingAssignment.title,
                description: editingAssignment.description,
                deadline_at: editingAssignment.deadline_at,
                rubrics: editingAssignment.rubrics,
                max_points: maxPoints
            }).eq("id", editingAssignment.id);

            if (error) throw error;
            
            setAssignments(prev => prev.map(a => a.id === editingAssignment.id ? { 
                ...a, 
                title: editingAssignment.title, 
                description: editingAssignment.description, 
                deadline_at: editingAssignment.deadline_at,
                rubrics: editingAssignment.rubrics
            } : a));
            
            setEditingAssignment(null);
            toast({ title: "Updated", description: "Assignment has been successfully updated." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to update assignment." });
        } finally {
            setIsSaving(false);
        }
    };
    
    // Settings Form State
    const [settings, setSettings] = useState({
        name: "",
        status: "",
        enrollment_start_date: "",
        enrollment_end_date: "",
        start_date: "",
        end_date: "",
        max_slots: 25,
        duration_weeks: 4,
        zoom_link: "",
        mentors: [] as { name: string; title: string; link: string }[]
    });

    const [isSaving, setIsSaving] = useState(false);
    
    // Certification State
    const [showCertModal, setShowCertModal] = useState(false);
    const [certStudents, setCertStudents] = useState<{id: string; name: string; email: string; submissionRate: number; avgGrade: number; eligible: string; selected: boolean}[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [certSuccess, setCertSuccess] = useState<number | null>(null);

    const fetchCohortData = useCallback(async () => {
        if (!id) return;
        try {
            // 1. Fetch Cohort
            const { data: cohortData, error: cohortError } = await supabase
                .from("cohorts")
                .select("*")
                .eq("id", id)
                .single();

            if (cohortError) throw cohortError;
            setCohort(cohortData as Cohort);
            setSettings({
                name: cohortData.name,
                status: cohortData.status,
                enrollment_start_date: cohortData.enrollment_start_date?.split('.')[0] || "",
                enrollment_end_date: cohortData.enrollment_end_date?.split('.')[0] || "",
                start_date: cohortData.start_date?.split('.')[0] || "",
                end_date: cohortData.end_date?.split('.')[0] || "",
                max_slots: cohortData.max_slots || 25,
                duration_weeks: cohortData.duration_weeks || 4,
                zoom_link: cohortData.zoom_link || "",
                mentors: cohortData.mentors || []
            });

            // 2. Fetch All Data
            const [enrollmentsRes, sessionsRes, announcementsRes, assignmentsRes, submissionsRes] = await Promise.all([
                supabase.from("academy_enrollments").select("*").eq("cohort_id", id),
                supabase.from("sessions").select("*").eq("cohort_id", id).order("session_date", { ascending: true }),
                supabase.from("announcements").select("*").eq("cohort_id", id).order("created_at", { ascending: false }),
                supabase.from("assignments").select("*").eq("cohort_id", id).order("created_at", { ascending: false }),
                supabase.from("submissions").select("*, assignments!inner(title, cohort_id)").eq("assignments.cohort_id", id).order("created_at", { ascending: false })
            ]);

            // 3. Process Students & Profiles
            const enrollments = enrollmentsRes.data || [];
            let transformedStudents = [];
            let profileMap = {};

            if (enrollments.length > 0) {
                const userIds = enrollments.map(e => e.user_id).filter(Boolean);
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("user_id, first_name, last_name, email, streak_count, total_study_hours")
                    .in("user_id", userIds);

                profileMap = Object.fromEntries((profilesData || []).map(p => [p.user_id, p]));

                transformedStudents = enrollments.map((s: any) => {
                    const profile = (profileMap as any)[s.user_id];
                    return {
                        ...s,
                        student_name: s.student_name || (profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null) || s.student_email?.split('@')[0] || "Student",
                        student_email: s.student_email || profile?.email,
                        profiles: profile
                    };
                });
            }

            // 4. Process Submissions & Profiles
            const rawSubmissions = submissionsRes.data || [];
            const transformedSubmissions = rawSubmissions.map((s: any) => {
                const profile = (profileMap as any)[s.student_id];
                return {
                    ...s,
                    profiles: profile ? {
                        full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
                        email: profile.email
                    } : null
                };
            });

            setStudents(transformedStudents as Student[]);
            setSessions((sessionsRes.data as Session[]) || []);
            setAnnouncements((announcementsRes.data as Announcement[]) || []);
            setAssignments((assignmentsRes.data as Assignment[]) || []);
            setSubmissions(transformedSubmissions as unknown as Submission[]);

        } catch (err) {
            console.error("Error fetching cohort detail:", err);
            toast({
                title: "Fetch Error",
                description: "Failed to load cohort details.",
                variant: "destructive"
            });
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }, [id, navigate, toast]);

    useEffect(() => {
        fetchCohortData();
    }, [fetchCohortData]);

    const toggleSelectAll = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(t => t.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectedStudentsData = useMemo(() => {
        return students.filter(t => selectedIds.includes(t.id)).map(t => ({
            id: t.id,
            email: t.student_email,
            first_name: t.student_name.split(' ')[0],
            last_name: t.student_name.split(' ').slice(1).join(' ')
        }));
    }, [students, selectedIds]);

    const handleCreateSession = async () => {
        if (!newSession.title || !newSession.date) return;
        setIsSaving(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.from("sessions") as any).insert([{
                cohort_id: id,
                title: newSession.title,
                session_date: newSession.date,
                date: new Date(newSession.date).toISOString(), // Legacy support
                start_time: newSession.start_time,
                meeting_url: newSession.url,
                join_link: newSession.url, // Legacy support
                status: 'scheduled'
            }]).select().single();

            if (error) throw error;
            setSessions(prev => [...prev, data as Session]);
            setNewSession({ title: '', date: '', start_time: '', url: '' });
            toast({ title: "Session Created", description: "Your class has been scheduled." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to create session.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateAnnouncement = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content) return;
        setIsSaving(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.from("announcements") as any).insert([{
                cohort_id: id,
                author_id: (await supabase.auth.getUser()).data.user?.id,
                title: newAnnouncement.title,
                content: newAnnouncement.content,
                image_url: newAnnouncement.image_url
            }]).select().single();

            if (error) {
                console.error("Announcement Error:", error);
                throw error;
            }
            setAnnouncements(prev => [data as Announcement, ...prev]);
            setNewAnnouncement({ title: '', content: '', image_url: '' });
            toast({ title: "Posted", description: "Announcement sent to students." });

            // Trigger Server-Side Broadcast to all students in the cohort
            if (students.length > 0) {
                try {
                    await supabase.functions.invoke('broadcast-announcement', {
                        body: {
                            cohortId: id,
                            title: newAnnouncement.title,
                            content: newAnnouncement.content,
                            imageUrl: newAnnouncement.image_url
                        }
                    });
                } catch (emailErr) {
                    console.error("Failed to broadcast announcement emails:", emailErr);
                }
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to post update.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateAssignment = async () => {
        if (!newAssignment.title || !newAssignment.deadline) return;
        setIsSaving(true);
        try {
            const maxPoints = newAssignment.rubrics.reduce((sum, r) => sum + r.max_points, 0) || 100;

            const { data, error } = await supabase.from("assignments").insert([{
                cohort_id: id,
                title: newAssignment.title,
                description: newAssignment.description,
                deadline_at: new Date(newAssignment.deadline).toISOString(),
                rubrics: newAssignment.rubrics,
                max_points: maxPoints
            }]).select().single();

            if (error) throw error;
            setAssignments(prev => [data as Assignment, ...prev]);
            setNewAssignment({ title: '', description: '', deadline: '', rubrics: [] });
            toast({ title: "Assignment Created", description: "Students have been notified." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateSettings = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("cohorts")
                .update({
                    name: settings.name,
                    status: settings.status,
                    enrollment_start_date: new Date(settings.enrollment_start_date).toISOString(),
                    enrollment_end_date: new Date(settings.enrollment_end_date).toISOString(),
                    start_date: new Date(settings.start_date).toISOString(),
                    end_date: new Date(settings.end_date).toISOString(),
                    max_slots: Number(settings.max_slots),
                    duration_weeks: Number(settings.duration_weeks),
                    zoom_link: settings.zoom_link,
                    mentors: settings.mentors
                })
                .eq("id", id);

            if (error) throw error;
            toast({ title: "Settings Updated", description: "Cohort details have been saved." });
            fetchCohortData();
        } catch (err) {
            toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReviewSubmission = async (subId: string, grade: string = '', feedback: string = '', rubricGrades: any[] = []) => {
        try {
            const { error } = await supabase.from("submissions").update({ 
                status: 'reviewed',
                grade,
                feedback,
                rubric_grades: rubricGrades
            }).eq("id", subId);
            
            if (error) throw error;
            setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: 'reviewed', grade, feedback, rubric_grades: rubricGrades } : s));
            setGradingSub(null);
            toast({ title: "Graded", description: "Submission has been reviewed and graded." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to update status." });
        }
    };

    const handleSendSessionReminder = async (session: Session) => {
        if (students.length === 0) {
            toast({ title: "No Students", description: "There are no active students to notify." });
            return;
        }

        const studentEmails = students.filter(s => s.enrollment_status === 'active').map(s => s.student_email);
        if (studentEmails.length === 0) return;

        toast({ title: "Sending...", description: "Broadcasting class reminder." });
        
        try {
            for (const email of studentEmails) {
                await supabase.functions.invoke('send-email', {
                    body: {
                        to: email,
                        subject: `Class Reminder: ${session.title}`,
                        htmlTemplate: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                                <div style="background: #0f2147; padding: 40px; text-align: center;">
                                    <img src="https://opslyhr.com/images/logocolored.svg" alt="OPSlyHR" style="width: 140px;" />
                                </div>
                                <div style="padding: 40px; background: #fff;">
                                    <h1 style="color: #0f2147; font-size: 24px; margin-bottom: 20px;">Class Reminder</h1>
                                    <p style="color: #444; font-size: 16px; line-height: 1.6;">Hello Student,</p>
                                    <p style="color: #444; font-size: 16px; line-height: 1.6;">Your class <strong>${session.title}</strong> is starting soon!</p>
                                    <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 32px 0;">
                                        <p style="margin: 0; font-size: 14px; color: #666; font-weight: bold; text-transform: uppercase;">Time</p>
                                        <p style="margin: 4px 0 16px 0; font-size: 18px; color: #333; font-weight: bold;">${new Date(session.session_date).toLocaleDateString()} at ${session.start_time}</p>
                                        
                                        <p style="margin: 0; font-size: 14px; color: #666; font-weight: bold; text-transform: uppercase;">Meeting Link</p>
                                        <a href="${session.meeting_url}" style="color: #2563eb; text-decoration: none; word-break: break-all; font-weight: bold;">${session.meeting_url}</a>
                                    </div>
                                    <div style="margin: 40px 0; text-align: center;">
                                        <a href="${session.meeting_url}" style="background: #0f2147; color: #fff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Join Live Session</a>
                                    </div>
                                </div>
                                <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                                    <p style="color: #999; font-size: 12px;">&copy; 2026 OPSlyHR Academy. All rights reserved.</p>
                                </div>
                            </div>
                        `
                    }
                });
            }
            toast({ title: "Sent", description: "Class reminder broadcasted successfully." });
        } catch (err) {
            console.error("Reminder failed:", err);
            toast({ title: "Error", description: "Failed to send reminders.", variant: "destructive" });
        }
    };

    const handleDeleteCohort = async () => {
        if (!cohort) return;
        
        if (!window.confirm(`Are you sure you want to delete "${cohort.name}"? This will permanently remove all student enrollments, assignments, sessions, and data associated with this cohort. This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from("cohorts")
                .delete()
                .eq("id", cohort.id);
            
            if (error) throw error;
            
            toast({ title: "Deleted", description: "Cohort has been permanently removed." });
            navigate(getInternalPath("/admin/academy"));
        } catch (err) {
            console.error("Delete failed:", err);
            toast({ title: "Error", description: "Failed to delete cohort.", variant: "destructive" });
        }
    };

    // === CERTIFICATION SYSTEM ===
    const handleOpenCertification = () => {
        // Calculate eligibility for each student
        const studentEligibility = students.map(student => {
            // Count assignments for this cohort
            const totalAssignments = assignments.length;
            // Count submissions from this student
            const studentSubmissions = submissions.filter(s => s.student_id === student.student_id);
            const submissionRate = totalAssignments > 0 ? Math.round((studentSubmissions.length / totalAssignments) * 100) : 0;
            
            // Calculate average grade
            const gradedSubs = studentSubmissions.filter(s => s.grade && !isNaN(parseFloat(s.grade)));
            const avgGrade = gradedSubs.length > 0 
                ? Math.round(gradedSubs.reduce((sum, s) => sum + parseFloat(s.grade), 0) / gradedSubs.length) 
                : 0;

            let eligible = 'not_eligible';
            if (submissionRate >= 70 && avgGrade >= 50) eligible = 'eligible';
            else if (submissionRate >= 50 || avgGrade >= 40) eligible = 'borderline';

            return {
                id: student.student_id,
                name: student.student_name,
                email: student.student_email,
                submissionRate,
                avgGrade,
                eligible,
                selected: eligible === 'eligible'
            };
        });

        setCertStudents(studentEligibility);
        setShowCertModal(true);
        setCertSuccess(null);
    };

    const handleSelectAllEligible = () => {
        setCertStudents(prev => prev.map(s => ({ ...s, selected: s.eligible === 'eligible' })));
    };

    const handleDeselectAll = () => {
        setCertStudents(prev => prev.map(s => ({ ...s, selected: false })));
    };

    const handleToggleStudent = (studentId: string) => {
        setCertStudents(prev => prev.map(s => s.id === studentId ? { ...s, selected: !s.selected } : s));
    };

    const handleGenerateCertificates = async () => {
        const selectedStudents = certStudents.filter(s => s.selected);
        if (selectedStudents.length === 0) {
            toast({ title: "No Students Selected", description: "Select at least one student to certify.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        try {
            // Get course info for the cohort
            const { data: courseData } = await supabase
                .from('academy_courses')
                .select('id, title, description')
                .eq('id', cohort!.course_id)
                .single();

            const courseTitle = courseData?.title || 'Opsly Academy Program';
            const courseDescription = courseData?.description || '';
            const mentors = settings.mentors || [];

            let successCount = 0;

            for (const student of selectedStudents) {
                // Generate unique certificate ID (higher entropy)
                const hex1 = Math.random().toString(16).substring(2, 8).toUpperCase();
                const hex2 = Math.random().toString(16).substring(2, 8).toUpperCase();
                const certId = `OPSLY-${hex1}-${hex2}`;
                const verificationUrl = `https://academy.opslyhr.com/verify/${certId}`;

                const { error } = await supabase.from('certificates').insert({
                    certificate_id: certId,
                    student_id: student.id,
                    cohort_id: id,
                    course_id: courseData?.id || null,
                    course_title: courseTitle,
                    course_description: courseDescription,
                    student_name: student.name,
                    mentors: mentors,
                    completion_date: new Date().toISOString().split('T')[0],
                    verification_url: verificationUrl,
                    status: 'active'
                });

                if (!error) {
                    successCount++;
                    
                    // Send branded congratulatory email
                    try {
                        await supabase.functions.invoke('send-email', {
                            body: {
                                to: student.email,
                                subject: `🎓 Congratulations! Your ${courseTitle} Certificate is Ready`,
                                htmlTemplate: `
                                    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                                        <div style="background: #0f2147; padding: 48px 40px; text-align: center;">
                                            <img src="https://opslyhr.com/images/logocolored.svg" alt="OPSlyHR" style="width: 140px; margin-bottom: 24px;" />
                                            <h1 style="color: #fff; font-size: 28px; margin: 0; letter-spacing: -0.5px;">🎓 Congratulations!</h1>
                                        </div>
                                        <div style="padding: 48px 40px; background: #fff;">
                                            <p style="color: #333; font-size: 17px; line-height: 1.7; margin-bottom: 16px;">Dear <strong>${student.name}</strong>,</p>
                                            <p style="color: #444; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">We're thrilled to let you know that you have <strong>successfully completed</strong> the <strong>${courseTitle}</strong> program at Opsly Academy. Your dedication and hard work have paid off!</p>
                                            <div style="background: #f0fdf4; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px; border: 1px solid #bbf7d0;">
                                                <p style="color: #15803d; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Your Certificate ID</p>
                                                <p style="color: #166534; font-size: 22px; font-weight: bold; font-family: monospace; margin: 0;">${certId}</p>
                                            </div>
                                            <div style="text-align: center; margin-bottom: 40px;">
                                                <a href="https://academy.opslyhr.com/verify/${certId}" style="background: #0f2147; color: #fff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">View & Download Certificate</a>
                                            </div>
                                            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
                                            <p style="color: #444; font-size: 16px; line-height: 1.7; margin-bottom: 16px;">Your skills are now in demand. We encourage you to <strong>join the OPSly Talent Marketplace</strong> — where top-tier companies hire Opsly-certified professionals like you.</p>
                                            <div style="text-align: center; margin-bottom: 32px;">
                                                <a href="https://academy.opslyhr.com/talent-marketplace" style="background: #2563eb; color: #fff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">Join Talent Marketplace →</a>
                                            </div>
                                            <p style="color: #64748b; font-size: 15px; line-height: 1.7;">We wish you continued success in your career. Keep building, keep growing. 🚀</p>
                                            <p style="color: #64748b; font-size: 15px; line-height: 1.7;">— The Opsly Academy Team</p>
                                        </div>
                                        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #eee;">
                                            <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} OPSlyHR Academy. All rights reserved.</p>
                                            <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;"><a href="${verificationUrl}" style="color: #2563eb;">Verify this certificate</a></p>
                                        </div>
                                    </div>
                                `
                            }
                        });
                    } catch (emailErr) {
                        console.error('Failed to send certificate email to', student.email, emailErr);
                    }
                } else {
                    console.error('Failed to create certificate for', student.name, error);
                }
            }

            // Mark cohort as closed
            await supabase.from('cohorts').update({ is_closed: true, status: 'closed' }).eq('id', id);

            setCertSuccess(successCount);
            toast({ title: "Certificates Generated!", description: `${successCount} certificate(s) issued successfully.` });
        } catch (err) {
            console.error('Certificate generation error:', err);
            toast({ title: "Error", description: "Failed to generate certificates.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!cohort) return null;

    return (
        <div className="p-8 lg:p-12 bg-slate-50/50 min-h-screen font-inter">
            <div className="w-full max-w-none">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Previous
                </button>

                {/* Header Card */}
                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm mb-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[24px] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
                                <Users className="w-10 h-10" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{cohort.name}</h1>
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                        cohort.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                        {cohort.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        <Calendar className="w-4 h-4" /> {new Date(cohort.start_date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        <Users className="w-4 h-4" /> {students.length} Enrolled
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest">
                                        ₦{cohort.price_naira.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                className="h-12 px-6 rounded-xl font-bold gap-2"
                                onClick={() => setActiveTab("settings")}
                            >
                                <Settings className="w-4 h-4" /> Cohort Settings
                            </Button>
                            <Button 
                                onClick={handleOpenCertification}
                                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-2 shadow-lg shadow-emerald-200"
                            >
                                <Award className="w-4 h-4" /> Close & Certify
                            </Button>
                            <Button className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold gap-2">
                                Export List
                            </Button>
                            <Button 
                                onClick={handleDeleteCohort}
                                variant="outline" 
                                className="h-12 px-6 rounded-xl font-bold text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200 transition-all gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white p-1 rounded-2xl border border-slate-100 h-14 mb-10 shadow-sm inline-flex">
                        <TabsTrigger value="students" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Students ({students.length})
                        </TabsTrigger>
                        <TabsTrigger value="sessions" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Sessions ({sessions.length})
                        </TabsTrigger>
                        <TabsTrigger value="announcements" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Announcements
                        </TabsTrigger>
                        <TabsTrigger value="assignments" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Assignments
                        </TabsTrigger>
                        <TabsTrigger value="grading" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Submissions ({submissions.filter(s => s.status === 'submitted').length})
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="students" className="outline-none">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-5 w-[40px]">
                                            <Checkbox 
                                                checked={students.length > 0 && selectedIds.length === students.length}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Student Name</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Progress</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Streak/Hours</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Status</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Top Grad</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.map((student) => (
                                        <tr key={student.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(student.id) ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-8 py-6">
                                                <Checkbox 
                                                    checked={selectedIds.includes(student.id)}
                                                    onCheckedChange={() => toggleSelect(student.id)}
                                                />
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-slate-900">{student.student_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{student.student_email}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number"
                                                        defaultValue={student.progress_percent || 0}
                                                        onBlur={async (e) => {
                                                            const val = parseInt(e.target.value);
                                                            await supabase.from('academy_enrollments').update({ progress_percent: val }).eq('id', student.id);
                                                        }}
                                                        className="w-12 h-8 bg-slate-50 border-none rounded-lg text-xs font-bold text-center"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400">%</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="number"
                                                        placeholder="S"
                                                        defaultValue={student.streak_count || 0}
                                                        onBlur={async (e) => {
                                                            const val = parseInt(e.target.value);
                                                            await supabase.from('profiles').update({ streak_count: val }).eq('id', student.student_id);
                                                        }}
                                                        className="w-10 h-8 bg-slate-50 border-none rounded-lg text-xs font-bold text-center"
                                                        title="Streak Count"
                                                    />
                                                    <input 
                                                        type="number"
                                                        placeholder="H"
                                                        defaultValue={student.total_study_hours || 0}
                                                        onBlur={async (e) => {
                                                            const val = parseFloat(e.target.value);
                                                            await supabase.from('profiles').update({ total_study_hours: val }).eq('id', student.student_id);
                                                        }}
                                                        className="w-10 h-8 bg-slate-50 border-none rounded-lg text-xs font-bold text-center"
                                                        title="Study Hours"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded uppercase tracking-wider">{student.enrollment_status}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button 
                                                    onClick={async () => {
                                                        const newVal = !student.is_top_grad;
                                                        const { error } = await (supabase.from('academy_enrollments') as any).update({ is_top_grad: newVal }).eq('id', student.id);
                                                        if (!error) {
                                                            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_top_grad: newVal } : s));
                                                            toast({ title: newVal ? '⭐ Top Grad Assigned' : 'Top Grad Removed', description: `${student.student_name} ${newVal ? 'is now' : 'is no longer'} a Top Grad.` });
                                                        }
                                                    }}
                                                    className={`p-2 rounded-xl transition-all ${student.is_top_grad ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-slate-50 text-slate-300 hover:text-amber-400 hover:bg-amber-50'}`}
                                                    title={student.is_top_grad ? 'Remove Top Grad' : 'Mark as Top Grad'}
                                                >
                                                    <Star className={`w-4 h-4 ${student.is_top_grad ? 'fill-amber-400' : ''}`} />
                                                </button>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    <TabsContent value="sessions" className="outline-none">
                        <div className="space-y-10">
                            <div className="bg-white p-8 rounded-[32px] border border-blue-50 shadow-xl shadow-blue-500/5">
                                <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Schedule New Session</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Topic</label>
                                        <input 
                                            value={newSession.title} 
                                            onChange={e => setNewSession({...newSession, title: e.target.value})}
                                            placeholder="System Architecture..." 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-blue-600 transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                                        <input 
                                            type="date"
                                            value={newSession.date} 
                                            onChange={e => setNewSession({...newSession, date: e.target.value})}
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-blue-600 transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Meeting URL</label>
                                        <input 
                                            value={newSession.url} 
                                            onChange={e => setNewSession({...newSession, url: e.target.value})}
                                            placeholder="Zoom link..." 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-blue-600 transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <Button onClick={handleCreateSession} disabled={isSaving} className="h-12 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100">{isSaving ? 'Scheduling...' : 'Add Class'}</Button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                {sessions.map((session, idx) => (
                                    <div key={session.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" className="w-10 h-10 p-0 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-600"><Settings className="w-4 h-4" /></Button>
                                            <Button variant="ghost" className="w-10 h-10 p-0 rounded-xl bg-slate-50 hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                                <Video className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session {idx+1}</span>
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-2 truncate pr-16">{session.title}</h4>
                                        <div className="flex items-center gap-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(session.session_date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {session.start_time}</span>
                                        </div>
                                        <div className="mt-8 flex items-center justify-between">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                                                session.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {session.status}
                                            </span>
                                            <div onClick={() => window.open(session.meeting_url, '_blank')} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">
                                                Virtual Link <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-slate-50">
                                            <Button 
                                                onClick={() => handleSendSessionReminder(session)}
                                                variant="outline" 
                                                className="w-full h-10 rounded-xl border-slate-200 text-xs font-bold gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all"
                                            >
                                                <Bell className="w-3.5 h-3.5" /> Broadcast Reminder
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {sessions.length === 0 && (
                                    <div className="md:col-span-2 py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                                        <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">No sessions scheduled yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="announcements" className="outline-none pb-20">
                        <div className="max-w-3xl space-y-8">
                            <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5">
                                <h4 className="text-[10px] font-bold text-slate-900 mb-4 uppercase tracking-widest">Broadcast Announcement</h4>
                                <input 
                                    value={newAnnouncement.title}
                                    onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                    placeholder="Title..."
                                    className="w-full h-12 px-6 bg-slate-50 rounded-xl border-transparent mb-4 text-sm font-bold"
                                />
                                <input 
                                    value={newAnnouncement.image_url}
                                    onChange={e => setNewAnnouncement({...newAnnouncement, image_url: e.target.value})}
                                    placeholder="Optional Image URL..."
                                    className="w-full h-12 px-6 bg-slate-50 rounded-xl border-transparent mb-4 text-sm font-medium"
                                />
                                <textarea 
                                    value={newAnnouncement.content}
                                    onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                                    placeholder="Keep your cohort informed. Start typing..." 
                                    className="w-full min-h-[140px] p-6 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium text-sm mb-6"
                                />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Notify students via email
                                    </div>
                                    <Button onClick={handleCreateAnnouncement} disabled={isSaving} className="h-12 px-8 bg-blue-600 text-white rounded-xl font-bold">{isSaving ? 'Posting...' : 'Post Update'}</Button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {announcements.map((ann) => (
                                    <div key={ann.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                                        <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" className="w-8 h-8 p-0 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="flex items-start gap-5">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                                                <Bell className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-grow">
                                                <h5 className="font-bold text-slate-900 mb-1">{ann.title}</h5>
                                                <p className="text-slate-500 text-sm leading-relaxed mb-4">{ann.content}</p>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Posted {new Date(ann.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="assignments" className="outline-none pb-20">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-1">
                                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm sticky top-8">
                                    <h4 className="text-sm font-bold text-slate-900 mb-8 uppercase tracking-widest">Create Assignment</h4>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Title</label>
                                            <input 
                                                value={newAssignment.title}
                                                onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                                                className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Deadline</label>
                                            <input 
                                                type="datetime-local"
                                                value={newAssignment.deadline}
                                                onChange={e => setNewAssignment({...newAssignment, deadline: e.target.value})}
                                                className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Description</label>
                                            <textarea 
                                                value={newAssignment.description}
                                                onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                                                className="w-full min-h-[100px] p-5 bg-slate-50 rounded-xl border-transparent text-sm font-medium"
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Grading Rubric</label>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => {
                                                        const id = Math.random().toString(36).substr(2, 9);
                                                        setNewAssignment({
                                                            ...newAssignment,
                                                            rubrics: [...newAssignment.rubrics, { id, title: '', description: '', max_points: 0 }]
                                                        });
                                                    }}
                                                    className="h-7 px-2 text-blue-600 font-bold text-[10px] gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Criterion
                                                </Button>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {newAssignment.rubrics.map((rubric, idx) => (
                                                    <div key={rubric.id} className="bg-slate-50 p-4 rounded-xl space-y-3 relative group">
                                                        <button 
                                                            onClick={() => {
                                                                const filtered = newAssignment.rubrics.filter((_, i) => i !== idx);
                                                                setNewAssignment({ ...newAssignment, rubrics: filtered });
                                                            }}
                                                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                        <input 
                                                            value={rubric.title}
                                                            onChange={e => {
                                                                const updated = [...newAssignment.rubrics];
                                                                updated[idx].title = e.target.value;
                                                                setNewAssignment({ ...newAssignment, rubrics: updated });
                                                            }}
                                                            placeholder="Criterion Title (e.g. Code Quality)"
                                                            className="w-full h-8 bg-white px-3 rounded-lg border-transparent text-xs font-bold"
                                                        />
                                                        <div className="flex gap-2">
                                                            <input 
                                                                type="number"
                                                                value={rubric.max_points || ''}
                                                                onChange={e => {
                                                                    const updated = [...newAssignment.rubrics];
                                                                    updated[idx].max_points = Number(e.target.value);
                                                                    setNewAssignment({ ...newAssignment, rubrics: updated });
                                                                }}
                                                                placeholder="Max Points"
                                                                className="w-24 h-8 bg-white px-3 rounded-lg border-transparent text-xs font-medium"
                                                            />
                                                            <input 
                                                                value={rubric.description}
                                                                onChange={e => {
                                                                    const updated = [...newAssignment.rubrics];
                                                                    updated[idx].description = e.target.value;
                                                                    setNewAssignment({ ...newAssignment, rubrics: updated });
                                                                }}
                                                                placeholder="Optional description..."
                                                                className="flex-grow h-8 bg-white px-3 rounded-lg border-transparent text-xs font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                {newAssignment.rubrics.length === 0 && (
                                                    <p className="text-[10px] text-slate-400 italic px-1">No rubrics defined yet. Total score will default to 100.</p>
                                                )}
                                            </div>
                                        </div>

                                        <Button onClick={handleCreateAssignment} disabled={isSaving} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200">{isSaving ? 'Creating...' : 'Create Task'}</Button>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-6">
                                {assignments.map(asgn => (
                                    <div key={asgn.id} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm group relative">
                                        <div className="absolute top-10 right-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" className="w-10 h-10 p-0 rounded-xl bg-slate-50 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-bold uppercase text-[9px] px-2 py-0.5">Active</Badge>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Due {new Date(asgn.deadline_at).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-2xl font-bold text-slate-900 mb-3">{asgn.title}</h4>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-8">{asgn.description}</p>
                                        <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Plus className="w-4 h-4" /> 0 Submissions
                                            </div>
                                            <Button 
                                                onClick={() => setEditingAssignment(asgn)}
                                                variant="ghost" 
                                                className="font-bold text-blue-600 text-xs"
                                            >
                                                Edit Details
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="outline-none pb-20">
                        <div className="max-w-4xl bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-10">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Cohort Configuration</h3>
                                <p className="text-slate-500 text-sm">Update core settings, scheduling, and enrollment windows.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Cohort Name</label>
                                    <input 
                                        value={settings.name}
                                        onChange={e => setSettings({...settings, name: e.target.value})}
                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Status</label>
                                    <select 
                                        value={settings.status}
                                        onChange={e => setSettings({...settings, status: e.target.value})}
                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent font-bold text-sm outline-none"
                                    >
                                        <option value="open">Open (Enrolling)</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Max Capacity</label>
                                    <input 
                                        type="number"
                                        value={settings.max_slots}
                                        onChange={e => setSettings({...settings, max_slots: Number(e.target.value)})}
                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Duration (Weeks)</label>
                                    <input 
                                        type="number"
                                        value={settings.duration_weeks}
                                        onChange={e => setSettings({...settings, duration_weeks: Number(e.target.value)})}
                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Enrollment Start</label>
                                    <input 
                                        type="datetime-local"
                                        value={settings.enrollment_start_date}
                                        onChange={e => setSettings({...settings, enrollment_start_date: e.target.value})}
                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Enrollment End</label>
                                    <input 
                                        type="datetime-local"
                                        value={settings.enrollment_end_date}
                                        onChange={e => setSettings({...settings, enrollment_end_date: e.target.value})}
                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Program Start</label>
                                    <input 
                                        type="datetime-local"
                                        value={settings.start_date}
                                        onChange={e => setSettings({...settings, start_date: e.target.value})}
                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Program End</label>
                                    <input 
                                        type="datetime-local"
                                        value={settings.end_date}
                                        onChange={e => setSettings({...settings, end_date: e.target.value})}
                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent font-bold text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Default Meeting Link</label>
                                <input 
                                    value={settings.zoom_link}
                                    onChange={e => setSettings({...settings, zoom_link: e.target.value})}
                                    placeholder="Zoom / Meet Link"
                                    className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent font-bold text-sm"
                                />
                            </div>

                            <Button 
                                onClick={handleUpdateSettings} 
                                disabled={isSaving}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl transition-all"
                            >
                                {isSaving ? "Saving..." : "Update Cohort Settings"}
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="grading" className="outline-none pb-20">
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student / Assignment</th>
                                        <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content</th>
                                        <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-10 py-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {submissions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-8">
                                                <div className="font-bold text-slate-900 mb-1">{sub.profiles?.full_name || 'Student'}</div>
                                                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{sub.assignments?.title}</div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <a href={sub.link} target="_blank" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors">
                                                    <ExternalLink className="w-4 h-4" /> View Work
                                                </a>
                                            </td>
                                            <td className="px-10 py-8">
                                                {sub.status === 'reviewed' ? (
                                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Reviewed</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                {sub.status !== 'reviewed' ? (
                                                    <Button 
                                                        onClick={() => setGradingSub({ 
                                                            id: sub.id, 
                                                            grade: sub.grade || '', 
                                                            feedback: sub.feedback || '',
                                                            rubric_grades: sub.rubric_grades || [],
                                                            assignment_rubrics: sub.assignments?.rubrics || []
                                                        })} 
                                                        variant="outline" 
                                                        className="h-10 px-4 rounded-xl font-bold text-xs border-slate-200"
                                                    >
                                                        Review Work
                                                    </Button>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grade</span>
                                                        <span className="text-sm font-bold text-slate-900">{sub.grade || 'N/A'}</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {submissions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-10 py-20 text-center">
                                                <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                                <p className="text-slate-400 font-bold">No submissions yet.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Grading & Feedback Modal */}
                        {gradingSub && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6 overflow-y-auto">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white w-full max-w-2xl rounded-[32px] p-10 shadow-2xl my-auto"
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Review Submission</h3>
                                            <p className="text-slate-500 text-sm">Assign scores and provide feedback based on the rubric.</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Grade</div>
                                            <div className="text-3xl font-bold text-blue-600">{gradingSub.grade || '0'}%</div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                                        {gradingSub.assignment_rubrics && gradingSub.assignment_rubrics.length > 0 ? (
                                            gradingSub.assignment_rubrics.map((rubric) => {
                                                const currentGrade = gradingSub.rubric_grades?.find(rg => rg.rubric_id === rubric.id);
                                                return (
                                                    <div key={rubric.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-grow">
                                                                <h4 className="font-bold text-slate-800 text-sm">{rubric.title}</h4>
                                                                <p className="text-xs text-slate-500">{rubric.description}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    type="number"
                                                                    max={rubric.max_points}
                                                                    min={0}
                                                                    value={currentGrade?.score || ''}
                                                                    onChange={e => {
                                                                        const score = Number(e.target.value);
                                                                        const updatedRubricGrades = [...(gradingSub.rubric_grades || [])];
                                                                        const existingIdx = updatedRubricGrades.findIndex(rg => rg.rubric_id === rubric.id);
                                                                        
                                                                        if (existingIdx >= 0) {
                                                                            updatedRubricGrades[existingIdx].score = score;
                                                                        } else {
                                                                            updatedRubricGrades.push({ rubric_id: rubric.id, score, comment: '' });
                                                                        }

                                                                        // Auto-calculate total grade
                                                                        const totalEarned = updatedRubricGrades.reduce((sum, rg) => sum + (rg.score || 0), 0);
                                                                        const totalPossible = gradingSub.assignment_rubrics.reduce((sum, r) => sum + (r.max_points || 0), 0);
                                                                        const finalGrade = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : totalEarned;

                                                                        setGradingSub({
                                                                            ...gradingSub,
                                                                            rubric_grades: updatedRubricGrades,
                                                                            grade: finalGrade.toString()
                                                                        });
                                                                    }}
                                                                    className="w-20 h-10 px-3 bg-white rounded-lg border-transparent text-sm font-bold text-center"
                                                                />
                                                                <span className="text-xs font-bold text-slate-400">/ {rubric.max_points}</span>
                                                            </div>
                                                        </div>
                                                        <textarea 
                                                            placeholder="Criterion specific feedback..."
                                                            value={currentGrade?.comment || ''}
                                                            onChange={e => {
                                                                const updatedRubricGrades = [...(gradingSub.rubric_grades || [])];
                                                                const existingIdx = updatedRubricGrades.findIndex(rg => rg.rubric_id === rubric.id);
                                                                if (existingIdx >= 0) {
                                                                    updatedRubricGrades[existingIdx].comment = e.target.value;
                                                                } else {
                                                                    updatedRubricGrades.push({ rubric_id: rubric.id, score: 0, comment: e.target.value });
                                                                }
                                                                setGradingSub({ ...gradingSub, rubric_grades: updatedRubricGrades });
                                                            }}
                                                            className="w-full h-20 p-4 bg-white rounded-xl border-transparent text-xs font-medium resize-none"
                                                        />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Final Grade (0-100)</label>
                                                    <input 
                                                        value={gradingSub.grade}
                                                        onChange={e => setGradingSub({...gradingSub, grade: e.target.value})}
                                                        placeholder="Enter grade..."
                                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-blue-600 transition-all text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2 pt-4 border-t border-slate-50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Overall Feedback</label>
                                            <textarea 
                                                value={gradingSub.feedback}
                                                onChange={e => setGradingSub({...gradingSub, feedback: e.target.value})}
                                                placeholder="Provide summary feedback..."
                                                className="w-full min-h-[100px] p-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-blue-600 transition-all text-sm font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-10">
                                        <Button 
                                            variant="outline" 
                                            className="flex-grow h-14 rounded-2xl font-bold border-slate-200"
                                            onClick={() => setGradingSub(null)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            className="flex-grow-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold"
                                            onClick={() => handleReviewSubmission(gradingSub.id, gradingSub.grade, gradingSub.feedback, gradingSub.rubric_grades)}
                                        >
                                            Complete Review
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Edit Assignment Modal */}
                        {editingAssignment && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6 overflow-y-auto">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white w-full max-w-2xl rounded-[32px] p-10 shadow-2xl my-auto"
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Edit Assignment</h3>
                                            <p className="text-slate-500 text-sm">Update task details and grading rubrics.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Title</label>
                                            <input 
                                                value={editingAssignment.title}
                                                onChange={e => setEditingAssignment({...editingAssignment, title: e.target.value})}
                                                className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Deadline</label>
                                            <input 
                                                type="datetime-local"
                                                value={editingAssignment.deadline_at ? new Date(editingAssignment.deadline_at).toISOString().slice(0, 16) : ''}
                                                onChange={e => setEditingAssignment({...editingAssignment, deadline_at: e.target.value})}
                                                className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Description</label>
                                            <textarea 
                                                value={editingAssignment.description}
                                                onChange={e => setEditingAssignment({...editingAssignment, description: e.target.value})}
                                                className="w-full min-h-[100px] p-5 bg-slate-50 rounded-xl border-transparent text-sm font-medium"
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Grading Rubric</label>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => {
                                                        const id = Math.random().toString(36).substr(2, 9);
                                                        setEditingAssignment({
                                                            ...editingAssignment,
                                                            rubrics: [...(editingAssignment.rubrics || []), { id, title: '', description: '', max_points: 0 }]
                                                        });
                                                    }}
                                                    className="h-7 px-2 text-blue-600 font-bold text-[10px] gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Criterion
                                                </Button>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {(editingAssignment.rubrics || []).map((rubric: any, idx: number) => (
                                                    <div key={rubric.id} className="bg-slate-50 p-4 rounded-xl space-y-3 relative group">
                                                        <button 
                                                            onClick={() => {
                                                                const filtered = editingAssignment.rubrics.filter((_: any, i: number) => i !== idx);
                                                                setEditingAssignment({ ...editingAssignment, rubrics: filtered });
                                                            }}
                                                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                        <input 
                                                            value={rubric.title}
                                                            onChange={e => {
                                                                const updated = [...editingAssignment.rubrics];
                                                                updated[idx].title = e.target.value;
                                                                setEditingAssignment({ ...editingAssignment, rubrics: updated });
                                                            }}
                                                            placeholder="Criterion Title"
                                                            className="w-full h-8 bg-white px-3 rounded-lg border-transparent text-xs font-bold"
                                                        />
                                                        <div className="flex gap-2">
                                                            <input 
                                                                type="number"
                                                                value={rubric.max_points || ''}
                                                                onChange={e => {
                                                                    const updated = [...editingAssignment.rubrics];
                                                                    updated[idx].max_points = Number(e.target.value);
                                                                    setEditingAssignment({ ...editingAssignment, rubrics: updated });
                                                                }}
                                                                placeholder="Max Pts"
                                                                className="w-24 h-8 bg-white px-3 rounded-lg border-transparent text-xs font-medium"
                                                            />
                                                            <input 
                                                                value={rubric.description}
                                                                onChange={e => {
                                                                    const updated = [...editingAssignment.rubrics];
                                                                    updated[idx].description = e.target.value;
                                                                    setEditingAssignment({ ...editingAssignment, rubrics: updated });
                                                                }}
                                                                placeholder="Description"
                                                                className="flex-grow h-8 bg-white px-3 rounded-lg border-transparent text-xs font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-10">
                                        <Button 
                                            variant="outline" 
                                            className="flex-grow h-14 rounded-2xl font-bold border-slate-200"
                                            onClick={() => setEditingAssignment(null)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            className="flex-grow-[2] h-14 bg-slate-900 text-white rounded-2xl font-bold"
                                            onClick={handleUpdateAssignment}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* === CERTIFICATION REVIEW MODAL === */}
            {showCertModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl"
                    >
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                        <Award className="w-7 h-7 text-emerald-600" />
                                        Certification Review
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium mt-1">
                                        Review student eligibility and award certificates for <strong>{cohort?.name}</strong>
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setShowCertModal(false)} 
                                    className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Bulk Actions */}
                            <div className="flex items-center gap-3 mt-6">
                                <Button variant="outline" size="sm" onClick={handleSelectAllEligible} className="rounded-xl font-bold text-xs h-9 gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Select All Eligible
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDeselectAll} className="rounded-xl font-bold text-xs h-9">
                                    Deselect All
                                </Button>
                                <div className="ml-auto text-xs font-bold text-slate-400">
                                    {certStudents.filter(s => s.selected).length} of {certStudents.length} selected
                                </div>
                            </div>
                        </div>

                        {/* Student Table */}
                        <div className="p-8">
                            {certSuccess !== null ? (
                                <div className="py-16 text-center">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Award className="w-10 h-10 text-emerald-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Certificates Issued! 🎉</h3>
                                    <p className="text-slate-500 font-medium mb-8">
                                        {certSuccess} certificate(s) have been generated and emailed to students.
                                    </p>
                                    <Button onClick={() => { setShowCertModal(false); fetchCohortData(); }} className="h-12 px-8 bg-slate-900 text-white rounded-xl font-bold">
                                        Close
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-10"></th>
                                                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Student</th>
                                                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center">Submissions</th>
                                                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center">Avg Grade</th>
                                                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {certStudents.map(student => (
                                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 pr-2">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={student.selected}
                                                            onChange={() => handleToggleStudent(student.id)}
                                                            className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="font-bold text-slate-900 text-sm">{student.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{student.email}</div>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <span className="text-sm font-bold text-slate-700">{student.submissionRate}%</span>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <span className="text-sm font-bold text-slate-700">{student.avgGrade}</span>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        {student.eligible === 'eligible' && (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                                                                <CheckCircle2 className="w-3 h-3" /> Eligible
                                                            </span>
                                                        )}
                                                        {student.eligible === 'borderline' && (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold">
                                                                <AlertTriangle className="w-3 h-3" /> Borderline
                                                            </span>
                                                        )}
                                                        {student.eligible === 'not_eligible' && (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">
                                                                ✕ Not Eligible
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-100">
                                        <Button variant="outline" onClick={() => setShowCertModal(false)} className="h-12 px-8 rounded-xl font-bold border-slate-200">
                                            Cancel
                                        </Button>
                                        <Button 
                                            onClick={handleGenerateCertificates}
                                            disabled={isGenerating || certStudents.filter(s => s.selected).length === 0}
                                            className="h-12 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-2 shadow-lg shadow-emerald-200"
                                        >
                                            {isGenerating ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                                            ) : (
                                                <><Award className="w-4 h-4" /> Generate {certStudents.filter(s => s.selected).length} Certificate(s)</>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* === FLOATING SELECTION BAR === */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] w-full max-w-xl px-4"
                    >
                        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500 text-white h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm">
                                    {selectedIds.length}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Students Selected</p>
                                    <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Multi-select action active</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button 
                                    size="sm" 
                                    onClick={() => setIsEmailModalOpen(true)}
                                    className="bg-white text-slate-900 hover:bg-slate-100 font-bold h-9 gap-2"
                                >
                                    <Mail className="h-3.5 w-3.5" /> Broadcast Email
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setSelectedIds([])}
                                    className="text-slate-400 hover:text-white hover:bg-white/10 h-9 w-9"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BatchEmailModal 
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                selectedTalents={selectedStudentsData}
            />
        </div>
    );
};

export default CohortDetail;
