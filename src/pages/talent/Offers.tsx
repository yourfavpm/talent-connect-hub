
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, FileText, DollarSign, Clock, Calendar } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

const TalentOffers = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [talentId, setTalentId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchTalentId();
        }
    }, [user]);

    useEffect(() => {
        if (talentId) {
            fetchOffers();
        }
    }, [talentId]);

    const fetchTalentId = async () => {
        const { data, error } = await supabase
            .from('talents')
            .select('id')
            .eq('user_id', user?.id)
            .single();
        if (data) setTalentId(data.id);
    };

    const fetchOffers = async () => {
        try {
            const { data, error } = await supabase
                .from('offers')
                .select(`
                    *,
                    client:clients(company_name, logo_url),
                    job:jobs(title)
                `)
                .eq('talent_id', talentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOffers(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (offerId: string, action: 'accept' | 'reject') => {
        try {
            // 1. Update Offer Status
            const status = action === 'accept' ? 'sent_to_admin' : 'rejected';
            // Accepted by Talent -> 'sent_to_admin' for contract generation. 
            // If rejected, then 'rejected'.

            const { error } = await supabase
                .from('offers')
                .update({ status })
                .eq('id', offerId);

            if (error) throw error;

            // 2. Notify Admin? (Optional but good)
            // We can rely on Admin checking 'sent_to_admin' offers.

            toast({
                title: action === 'accept' ? "Offer Accepted!" : "Offer Declined",
                description: action === 'accept'
                    ? "The team will now prepare your contract."
                    : "The offer has been declined.",
                variant: action === 'accept' ? "default" : "destructive"
            });

            fetchOffers();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Loading offers...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold">My Offers</h1>
                <p className="text-muted-foreground">Review and accept job offers</p>
            </div>

            <div className="grid gap-6">
                {offers.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold">No Offers Yet</h3>
                            <p className="text-muted-foreground">When you receive an offer, it will appear here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    offers.map((offer) => (
                        <Card key={offer.id} className="overflow-hidden border-l-4 border-l-primary">
                            <CardHeader className="bg-muted/50 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            {offer.role_title}
                                            <Badge variant={
                                                offer.status === 'pending' || offer.status === 'sent_to_client' ? 'secondary' :
                                                    offer.status === 'sent_to_admin' || offer.status === 'contract_generated' ? 'default' :
                                                        'outline'
                                            }>
                                                {offer.status.replace(/_/g, " ")}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <BriefcaseIcon className="h-3 w-3" /> {offer.client?.company_name}
                                        </CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">${offer.hourly_rate}/hr</div>
                                        <div className="text-sm text-muted-foreground">{offer.weekly_hours} hrs/week</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Start Date</p>
                                            <p className="font-medium">{new Date(offer.start_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Rate</p>
                                            <p className="font-medium">${offer.hourly_rate} / hour</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Weekly Commitment</p>
                                            <p className="font-medium">{offer.weekly_hours} Hours</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            {(offer.status === 'pending' || offer.status === 'sent_to_client' || offer.status === 'sent_to_talent') && (
                                <CardFooter className="bg-muted/20 flex justify-end gap-3 py-4">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                                Decline Offer
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Decline Offer?</DialogTitle>
                                                <DialogDescription>
                                                    Are you sure you want to decline this offer from {offer.client?.company_name}? This action cannot be undone.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button variant="ghost" onClick={() => { }}>Cancel</Button>
                                                <Button variant="destructive" onClick={() => handleAction(offer.id, 'reject')}>Confirm Decline</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                                                Accept Offer
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Accept Offer</DialogTitle>
                                                <DialogDescription>
                                                    Great news! By accepting this offer, our team will generate a formal contract for you to sign.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button variant="ghost" onClick={() => { }}>Cancel</Button>
                                                <Button onClick={() => handleAction(offer.id, 'accept')}>Confirm Acceptance</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardFooter>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

function BriefcaseIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    )
}

export default TalentOffers;
