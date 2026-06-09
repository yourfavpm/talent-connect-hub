import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  job: any;
  loading?: boolean;
}

export const ClientOfferModal = ({ isOpen, onClose, onSubmit, job, loading }: ClientOfferModalProps) => {
  const serviceModel = job?.service_model || "direct_hire";
  
  // Universal fields
  const [startDate, setStartDate] = useState("");
  const [specialTerms, setSpecialTerms] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(job?.weekly_hours?.toString() || "40");

  // Service-specific fields
  // Direct Hire
  const [baseSalary, setBaseSalary] = useState(job?.budget_max?.toString() || "");
  const [bonusDetails, setBonusDetails] = useState("");

  // Trial to Hire & Offshore
  const [rate, setRate] = useState(job?.budget_max?.toString() || "");
  const [rateFrequency, setRateFrequency] = useState("hourly"); // hourly, weekly, bi_weekly, monthly
  
  // Trial to Hire only
  const [trialDuration, setTrialDuration] = useState("");
  const [expectedConversionSalary, setExpectedConversionSalary] = useState("");

  // One-time Project
  const [projectPrice, setProjectPrice] = useState(job?.budget_max?.toString() || "");
  const [milestones, setMilestones] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Assemble the payload
    const payload: any = {
      start_date: startDate,
      weekly_hours: parseInt(weeklyHours) || 40,
      special_terms: specialTerms,
      meta: {
        payment_frequency: rateFrequency,
      }
    };

    if (serviceModel === "direct_hire") {
      payload.hourly_rate = 0; // Not applicable for direct hire
      payload.meta.base_salary = baseSalary;
      payload.meta.bonus_details = bonusDetails;
    } else if (serviceModel === "trial_to_hire") {
      payload.hourly_rate = parseFloat(rate) || 0;
      payload.meta.trial_duration = trialDuration;
      payload.meta.expected_conversion_salary = expectedConversionSalary;
    } else if (serviceModel === "one_time_project") {
      payload.hourly_rate = 0;
      payload.meta.project_price = projectPrice;
      payload.meta.milestones = milestones;
      payload.meta.target_completion_date = targetCompletionDate;
    } else {
      // offshore / contract_talent
      payload.hourly_rate = parseFloat(rate) || 0;
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Offer Details</DialogTitle>
          <DialogDescription>
            Provide the specifics for this engagement. OpslyHR Admin will use this to generate the official contract.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          <div className="space-y-2">
            <Label>Proposed Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>

          {serviceModel === "direct_hire" && (
            <>
              <div className="space-y-2">
                <Label>Base Salary</Label>
                <Input type="number" placeholder="e.g. 80000" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Bonus / Equity Details (Optional)</Label>
                <Textarea placeholder="e.g. 10% performance bonus" value={bonusDetails} onChange={(e) => setBonusDetails(e.target.value)} />
              </div>
            </>
          )}

          {(serviceModel === "trial_to_hire" || serviceModel === "offshore_hiring" || serviceModel === "contract_talent") && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Rate</Label>
                  <Input type="number" placeholder="e.g. 50" value={rate} onChange={(e) => setRate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Payment Frequency</Label>
                  <Select value={rateFrequency} onValueChange={setRateFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi_weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Weekly Hours</Label>
                <Input type="number" placeholder="e.g. 40" value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} required />
              </div>
              
              {serviceModel === "trial_to_hire" && (
                <>
                  <div className="space-y-2">
                    <Label>Trial Duration</Label>
                    <Input placeholder="e.g. 3 months" value={trialDuration} onChange={(e) => setTrialDuration(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Conversion Salary</Label>
                    <Input type="number" placeholder="e.g. 90000" value={expectedConversionSalary} onChange={(e) => setExpectedConversionSalary(e.target.value)} required />
                  </div>
                </>
              )}
            </>
          )}

          {serviceModel === "one_time_project" && (
            <>
              <div className="space-y-2">
                <Label>Fixed Project Price</Label>
                <Input type="number" placeholder="e.g. 5000" value={projectPrice} onChange={(e) => setProjectPrice(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Key Milestones / Delivery Expectations</Label>
                <Textarea placeholder="Describe milestones..." value={milestones} onChange={(e) => setMilestones(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Target Completion Date</Label>
                <Input type="date" value={targetCompletionDate} onChange={(e) => setTargetCompletionDate(e.target.value)} required />
              </div>
            </>
          )}

          {/* Universal Special Terms */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <Label>Special Terms & Additional Notes</Label>
            <Textarea 
              placeholder="Any other important details or conditions for this offer..." 
              value={specialTerms} 
              onChange={(e) => setSpecialTerms(e.target.value)} 
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Send Offer Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
