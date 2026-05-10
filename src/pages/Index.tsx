import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPasses, type VisitorPass } from "@/lib/visitor-store";
import { getCurrentResident } from "@/lib/resident-store";
import AppHeader from "@/components/AppHeader";
import GeneratePassForm from "@/components/GeneratePassForm";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import PassHistory from "@/components/PassHistory";
import { QrCode, History } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null);
  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const currentResident = getCurrentResident();
      if (currentResident) {
        setResident(currentResident);
      }
      const residentId = currentResident?.id;
      const residentPasses = residentId ? await getPasses(residentId) : [];
      setPasses(residentPasses);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleGenerated = async (pass: VisitorPass) => {
    setSelectedPass(pass);
    if (resident?.id) {
      const residentPasses = await getPasses(resident.id);
      setPasses(residentPasses);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            {resident ? `Welcome, ${resident.name}` : "Visitor Pass Management"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Generate visitor passes for easy, secure gate access.
          </p>
          {resident && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium">House:</span> {resident.houseNumber}
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-accent" />
                <h2 className="font-display text-xl font-semibold text-card-foreground">
                  New Visitor Pass
                </h2>
              </div>
              <GeneratePassForm onGenerated={handleGenerated} resident={resident} />
            </div>

            {/* QR Result */}
            {selectedPass && <QRCodeDisplay pass={selectedPass} />}
          </div>

          {/* Right: History */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <History className="h-5 w-5 text-accent" />
                <h2 className="font-display text-xl font-semibold text-card-foreground">
                  Pass History
                </h2>
              </div>
              <PassHistory passes={passes} onSelect={setSelectedPass} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
