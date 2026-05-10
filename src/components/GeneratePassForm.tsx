import { useState, useEffect } from "react";
import { createPass, type VisitorPass } from "@/lib/visitor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface Props {
  onGenerated: (pass: VisitorPass) => void;
  resident?: any;
}

const GeneratePassForm = ({ onGenerated, resident }: Props) => {
  const [form, setForm] = useState({
    visitorName: "",
    visitorPhone: "",
    purpose: "",
    expectedDate: "",
    expectedTime: "",
    residentName: "",
    residentUnit: "",
  });

  useEffect(() => {
    if (resident) {
      setForm((prev) => ({
        ...prev,
        residentName: resident.name || "",
        residentUnit: resident.houseNumber || "",
      }));
    }
  }, [resident]);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pass = await createPass({
      ...form,
      residentId: resident?.id,
    });
    onGenerated(pass);
    setForm({
      visitorName: "",
      visitorPhone: "",
      purpose: "",
      expectedDate: "",
      expectedTime: "",
      residentName: resident?.name || "",
      residentUnit: resident?.houseNumber || "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="visitorName">Visitor's Full Name</Label>
          <Input
            id="visitorName"
            placeholder="John Doe"
            required
            value={form.visitorName}
            onChange={(e) => update("visitorName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="visitorPhone">Visitor's Phone</Label>
          <Input
            id="visitorPhone"
            placeholder="+234 800 000 0000"
            required
            value={form.visitorPhone}
            onChange={(e) => update("visitorPhone", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose of Visit</Label>
        <Input
          id="purpose"
          placeholder="e.g. Family visit, Delivery, Maintenance"
          required
          value={form.purpose}
          onChange={(e) => update("purpose", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expectedDate">Expected Date</Label>
          <Input
            id="expectedDate"
            type="date"
            required
            value={form.expectedDate}
            onChange={(e) => update("expectedDate", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expectedTime">Expected Time</Label>
          <Input
            id="expectedTime"
            type="time"
            required
            value={form.expectedTime}
            onChange={(e) => update("expectedTime", e.target.value)}
          />
        </div>
      </div>

      {resident ? (
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Your Name:</span> {resident.name}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-medium">Your House:</span> {resident.houseNumber}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="residentName">Your Name (Resident)</Label>
            <Input
              id="residentName"
              placeholder="Jane Smith"
              required
              value={form.residentName}
              onChange={(e) => update("residentName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="residentUnit">Your Unit / House No.</Label>
            <Input
              id="residentUnit"
              placeholder="e.g. Block A, Unit 12"
              required
              value={form.residentUnit}
              onChange={(e) => update("residentUnit", e.target.value)}
            />
          </div>
        </div>
      )}

      <Button type="submit" className="w-full gap-2">
        <UserPlus className="h-4 w-4" />
        Generate Visitor Pass
      </Button>
    </form>
  );
};

export default GeneratePassForm;
