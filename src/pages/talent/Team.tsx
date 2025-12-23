import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const TalentTeam = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Team</h1>
        <p className="text-muted-foreground mt-1">View your assigned clients and team members</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No team assignments yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Once you're assigned to a client, your team details will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TalentTeam;
