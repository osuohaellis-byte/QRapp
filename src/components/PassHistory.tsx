import type { VisitorPass } from "@/lib/visitor-store";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User } from "lucide-react";

interface Props {
  passes: VisitorPass[];
  onSelect: (pass: VisitorPass) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  used: "bg-success/15 text-success-foreground border-success/30",
  expired: "bg-destructive/15 text-destructive-foreground border-destructive/30",
};

const PassHistory = ({ passes, onSelect }: Props) => {
  if (passes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">No visitor passes generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {passes.map((pass) => (
        <button
          key={pass.id}
          onClick={() => onSelect(pass)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              <span className="font-medium text-card-foreground">{pass.visitorName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{pass.expectedDate} at {pass.expectedTime}</span>
            </div>
          </div>
          <Badge variant="outline" className={`capitalize ${statusColors[pass.status] || ""}`}>
            {pass.status}
          </Badge>
        </button>
      ))}
    </div>
  );
};

export default PassHistory;
