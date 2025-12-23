import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Eye,
  Check,
  Clock,
  AlertCircle,
  Pen,
} from "lucide-react";

interface Contract {
  id: string;
  talentName: string;
  role: string;
  startDate: string;
  endDate: string;
  rate: string;
  status: "pending_signature" | "active" | "completed" | "expired";
  documentUrl?: string;
}

// Mock contracts
const mockContracts: Contract[] = [
  {
    id: "1",
    talentName: "Sarah Chen",
    role: "Product Manager",
    startDate: "2024-01-15",
    endDate: "2024-07-15",
    rate: "$85/hour",
    status: "pending_signature",
  },
  {
    id: "2",
    talentName: "Michael Okonkwo",
    role: "Operations Manager",
    startDate: "2023-11-01",
    endDate: "2024-05-01",
    rate: "$65/hour",
    status: "active",
  },
];

const Contracts = () => {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSign = (contractId: string) => {
    setContracts(
      contracts.map((c) =>
        c.id === contractId ? { ...c, status: "active" as const } : c
      )
    );
    setViewDialogOpen(false);
    toast({
      title: "Contract signed",
      description: "The contract has been signed and is now active.",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending_signature":
        return {
          label: "Pending Signature",
          className: "bg-warning/10 text-warning border-warning/20",
          icon: Pen,
        };
      case "active":
        return {
          label: "Active",
          className: "bg-success/10 text-success border-success/20",
          icon: Check,
        };
      case "completed":
        return {
          label: "Completed",
          className: "bg-muted text-muted-foreground",
          icon: Check,
        };
      case "expired":
        return {
          label: "Expired",
          className: "bg-destructive/10 text-destructive border-destructive/20",
          icon: AlertCircle,
        };
      default:
        return { label: status, className: "", icon: Clock };
    }
  };

  const pendingContracts = contracts.filter(
    (c) => c.status === "pending_signature"
  );
  const activeContracts = contracts.filter((c) => c.status === "active");
  const completedContracts = contracts.filter(
    (c) => c.status === "completed" || c.status === "expired"
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contracts</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your talent contracts
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingContracts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingContracts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            Active
            <Badge variant="secondary" className="ml-1">
              {activeContracts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            Completed
            <Badge variant="secondary" className="ml-1">
              {completedContracts.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingContracts.length === 0 ? (
            <EmptyState
              icon={Pen}
              title="No pending contracts"
              description="Contracts awaiting your signature will appear here"
            />
          ) : (
            <ContractList
              contracts={pendingContracts}
              getStatusConfig={getStatusConfig}
              onView={(c) => {
                setSelectedContract(c);
                setViewDialogOpen(true);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {activeContracts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No active contracts"
              description="Your active contracts will appear here"
            />
          ) : (
            <ContractList
              contracts={activeContracts}
              getStatusConfig={getStatusConfig}
              onView={(c) => {
                setSelectedContract(c);
                setViewDialogOpen(true);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedContracts.length === 0 ? (
            <EmptyState
              icon={Check}
              title="No completed contracts"
              description="Completed contracts will appear here"
            />
          ) : (
            <ContractList
              contracts={completedContracts}
              getStatusConfig={getStatusConfig}
              onView={(c) => {
                setSelectedContract(c);
                setViewDialogOpen(true);
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* View Contract Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Talent</p>
                  <p className="font-semibold">{selectedContract.talentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-semibold">{selectedContract.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-semibold">
                    {new Date(selectedContract.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-semibold">
                    {new Date(selectedContract.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rate</p>
                  <p className="font-semibold">{selectedContract.rate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className={getStatusConfig(selectedContract.status).className}
                  >
                    {getStatusConfig(selectedContract.status).label}
                  </Badge>
                </div>
              </div>

              {/* Contract Document Preview */}
              <div className="bg-muted/50 rounded-lg p-8 text-center border-2 border-dashed border-border">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Contract document preview
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {selectedContract.status === "pending_signature" && (
                  <Button onClick={() => handleSign(selectedContract.id)}>
                    <Pen className="h-4 w-4 mr-2" />
                    Sign Contract
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <div className="text-center py-16 bg-card rounded-xl border border-border">
    <Icon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
    <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const ContractList = ({
  contracts,
  getStatusConfig,
  onView,
}: {
  contracts: Contract[];
  getStatusConfig: (status: string) => any;
  onView: (contract: Contract) => void;
}) => (
  <div className="space-y-4">
    {contracts.map((contract, index) => {
      const statusConfig = getStatusConfig(contract.status);
      return (
        <div
          key={contract.id}
          className="bg-card rounded-xl border border-border p-6 hover:shadow-taskive-sm transition-shadow animate-slide-up"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {contract.talentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {contract.talentName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {contract.role} • {contract.rate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <Badge className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(contract.startDate).toLocaleDateString()} -{" "}
                  {new Date(contract.endDate).toLocaleDateString()}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onView(contract)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default Contracts;
