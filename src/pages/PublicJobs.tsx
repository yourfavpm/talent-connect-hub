import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Briefcase,
    MapPin,
    DollarSign,
    Clock,
    Search,
    Filter,
    LogIn,
    UserPlus,
} from "lucide-react";
import SEO from "@/components/SEO";


const PublicJobs = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedServiceModel, setSelectedServiceModel] = useState("all");
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [selectedJob, setSelectedJob] = useState<any>(null);

    useEffect(() => {
        fetchPublishedJobs();
    }, []);

    const fetchPublishedJobs = async () => {
        try {
            const { data, error } = await supabase
                .from("jobs")
                .select(`
          *,
          clients(company_name)
        `)
                .eq("status", "published")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setJobs(data || []);
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (job: any) => {
        if (job.job_type === 'external' && job.external_url) {
            window.open(job.external_url, '_blank', 'noopener,noreferrer');
            return;
        }
        
        if (!user) {
            setSelectedJob(job);
            setShowAuthDialog(true);
        } else {
            // Redirect to talent application page
            navigate(`/talent/jobs/${job.id}`);
        }
    };

    const filteredJobs = jobs.filter((job) => {
        const matchesSearch =
            job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.clients?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === "all" || job.category === selectedCategory;
        const matchesServiceModel = selectedServiceModel === "all" || 
                                    job.service_model === selectedServiceModel || 
                                    (job.job_type === 'external' && selectedServiceModel === 'direct_hire');

        return matchesSearch && matchesCategory && matchesServiceModel;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <SEO 
                title="African Operations Jobs | Remote Vetted Opportunities"
                description="Browse open positions for vetted African operations professionals. Find high-impact remote roles in Product Ops, Rev Ops, and Business Ops with global companies."
                keywords="African Operations Jobs, Remote Operations Careers Africa, Vetted Ops Talent Roles, High-Impact Remote Jobs, Product Operations Africa"
            />
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/images/logocolored.svg" alt="OPSlyHR" className="h-16 object-contain" />
                            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Job Board</h1>
                        </div>
                        {!user && (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => navigate("/login")}>
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Sign In
                                </Button>
                                <Button onClick={() => navigate("/signup")}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Sign Up
                                </Button>
                            </div>
                        )}
                        {user && (
                            <Button onClick={() => navigate("/talent/dashboard")}>
                                Go to Dashboard
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <div className="text-left mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Find Your Next Opportunity
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl">
                        Browse {jobs.length} open positions from top companies
                    </p>
                </div>

                {/* Filters */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search jobs, companies, locations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="engineering">Engineering</SelectItem>
                                    <SelectItem value="design">Design</SelectItem>
                                    <SelectItem value="marketing">Marketing</SelectItem>
                                    <SelectItem value="sales">Sales</SelectItem>
                                    <SelectItem value="operations">Operations</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={selectedServiceModel} onValueChange={setSelectedServiceModel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Job Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="direct_hire">Direct Hire</SelectItem>
                                    <SelectItem value="trial_to_hire">Trial to Hire</SelectItem>
                                    <SelectItem value="contract_talent">Contract</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Jobs List */}
                <div className="space-y-4">
                    {filteredJobs.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                                <p className="text-muted-foreground">
                                    Try adjusting your filters or search query
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredJobs.map((job) => (
                            <Card key={job.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                                            <CardDescription className="text-base">
                                                {job.clients?.company_name}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className={job.job_type === 'external' ? "ml-4 bg-blue-50 text-blue-600 border-blue-100" : "ml-4"}>
                                            {job.job_type === 'external' ? "External Role" : (job.service_model?.replace(/_/g, " ") || "Partner Role")}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {job.description}
                                        </p>
                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {job.location || "Remote"}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                ${job.budget_min?.toLocaleString()} - ${job.budget_max?.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {job.expected_hours || "Full-time"}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-4">
                                            <Button onClick={() => handleApply(job)} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                                                {job.job_type === 'external' ? "Apply on Site" : "Apply Now"}
                                            </Button>
                                            <Button variant="outline" onClick={() => navigate(`/jobs/${job.id}`)}>
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Auth Dialog */}
            <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sign in to Apply</DialogTitle>
                        <DialogDescription>
                            You need to be signed in as a talent to apply for this position.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Already have an account? Sign in to continue your application.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button onClick={() => navigate("/login")} className="w-full">
                                <LogIn className="h-4 w-4 mr-2" />
                                Sign In
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/signup")} className="w-full">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Account
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PublicJobs;
