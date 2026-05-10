import { QRCodeSVG } from "qrcode.react";
import type { VisitorPass } from "@/lib/visitor-store";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, Home, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface Props {
  pass: VisitorPass;
}

const QRCodeDisplay = ({ pass }: Props) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({
    id: pass.id,
    visitor: pass.visitorName,
    resident: pass.residentName,
    unit: pass.residentUnit,
    date: pass.expectedDate,
    time: pass.expectedTime,
  });

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `visitor-pass-${pass.visitorName.replace(/\s/g, "-")}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="animate-fade-in rounded-lg border border-border bg-background p-6 text-center shadow-sm">
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
        Visitor Pass Generated
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        Share this QR code with your visitor
      </p>

      <div ref={qrRef} className="mx-auto mb-5 inline-block rounded-xl border-4 border-primary/10 bg-background p-4">
        <QRCodeSVG
          value={qrData}
          size={200}
          bgColor="transparent"
          fgColor="hsl(160, 40%, 22%)"
          level="H"
        />
      </div>

      <div className="mb-4 space-y-3 text-left text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <User className="h-4 w-4 text-accent" />
          <span className="font-medium">{pass.visitorName}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Home className="h-4 w-4 text-accent" />
          <span>Visiting {pass.residentName} — {pass.residentUnit}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-accent" />
          <span>{pass.expectedDate}</span>
          <Clock className="h-4 w-4 ml-2 text-accent" />
          <span>{pass.expectedTime}</span>
        </div>
        <div className="rounded-md bg-primary/5 p-2 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Security Code</p>
          <p className="font-mono font-bold text-lg tracking-widest text-foreground">{pass.securityCode}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge
          variant={pass.status === "pending" ? "outline" : "secondary"}
          className="capitalize"
        >
          {pass.status}
        </Badge>
        <Button variant="outline" size="sm" className="gap-1" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" />
          Download QR
        </Button>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
