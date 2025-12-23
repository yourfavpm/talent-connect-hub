import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import { Building2, User, Globe, CheckCircle2 } from "lucide-react";

const ClientOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    company_name: "",
    industry: "",
    company_size: "",
    country: "",
    website: "",
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    primary_contact_role: "",
    terms_agreed: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login?portal=client");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        primary_contact_email: user.email || "",
      }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!formData.terms_agreed) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if client record already exists
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingClient) {
        // Update existing record
        const { error } = await supabase
          .from("clients")
          .update({
            company_name: formData.company_name,
            industry: formData.industry,
            company_size: formData.company_size,
            country: formData.country,
            website: formData.website,
            primary_contact_name: formData.primary_contact_name,
            primary_contact_email: formData.primary_contact_email,
            primary_contact_phone: formData.primary_contact_phone,
            primary_contact_role: formData.primary_contact_role,
            terms_agreed: formData.terms_agreed,
            status: "pending",
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase.from("clients").insert({
          user_id: user.id,
          client_id: `CLI-${Date.now()}`,
          company_name: formData.company_name,
          industry: formData.industry,
          company_size: formData.company_size,
          country: formData.country,
          website: formData.website,
          primary_contact_name: formData.primary_contact_name,
          primary_contact_email: formData.primary_contact_email,
          primary_contact_phone: formData.primary_contact_phone,
          primary_contact_role: formData.primary_contact_role,
          terms_agreed: formData.terms_agreed,
          status: "pending",
        });

        if (error) throw error;
      }

      // Assign client role if not already assigned
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: user.id, role: "client" },
          { onConflict: "user_id,role" }
        );

      if (roleError) console.error("Role assignment error:", roleError);

      toast({
        title: "Onboarding Complete!",
        description: "Your account is pending approval. We'll notify you once approved.",
      });

      navigate("/client/dashboard");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Company Info", icon: Building2 },
    { number: 2, title: "Contact Details", icon: User },
    { number: 3, title: "Confirmation", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step >= s.number
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                <s.icon className="w-5 h-5" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-2 ${
                    step > s.number ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Company Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Tell us about your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange("industry", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_size">Company Size</Label>
                  <Select
                    value={formData.company_size}
                    onValueChange={(value) => handleInputChange("company_size", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleInputChange("country", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="NG">Nigeria</SelectItem>
                      <SelectItem value="KE">Kenya</SelectItem>
                      <SelectItem value="ZA">South Africa</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.company_name}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contact Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Primary Contact Details
              </CardTitle>
              <CardDescription>
                Who will be the main point of contact?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary_contact_name">Full Name *</Label>
                <Input
                  id="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={(e) => handleInputChange("primary_contact_name", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_contact_email">Email *</Label>
                <Input
                  id="primary_contact_email"
                  type="email"
                  value={formData.primary_contact_email}
                  onChange={(e) => handleInputChange("primary_contact_email", e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_contact_phone">Phone Number</Label>
                  <Input
                    id="primary_contact_phone"
                    value={formData.primary_contact_phone}
                    onChange={(e) => handleInputChange("primary_contact_phone", e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_contact_role">Your Role</Label>
                  <Select
                    value={formData.primary_contact_role}
                    onValueChange={(value) => handleInputChange("primary_contact_role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ceo">CEO / Founder</SelectItem>
                      <SelectItem value="cto">CTO</SelectItem>
                      <SelectItem value="hr">HR Manager</SelectItem>
                      <SelectItem value="operations">Operations Manager</SelectItem>
                      <SelectItem value="project_manager">Project Manager</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!formData.primary_contact_name || !formData.primary_contact_email}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Review & Submit
              </CardTitle>
              <CardDescription>
                Please review your information before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Company Name</p>
                  <p className="font-medium">{formData.company_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Industry</p>
                  <p className="font-medium">{formData.industry || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Company Size</p>
                  <p className="font-medium">{formData.company_size || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Country</p>
                  <p className="font-medium">{formData.country || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact Name</p>
                  <p className="font-medium">{formData.primary_contact_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact Email</p>
                  <p className="font-medium">{formData.primary_contact_email}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.terms_agreed}
                    onCheckedChange={(checked) => handleInputChange("terms_agreed", checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    I agree to the Terms of Service and Privacy Policy. I understand that my account will be reviewed before approval.
                  </Label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading || !formData.terms_agreed}>
                  {loading ? "Submitting..." : "Complete Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClientOnboarding;
