import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, LogOut, Home } from "lucide-react";
import { getCurrentResident, logoutResident, markFirstLoginComplete } from "@/lib/resident-store";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const ResidentPortal = () => {
  const navigate = useNavigate();
  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const currentResident = getCurrentResident();
    if (!currentResident) {
      navigate("/resident-login");
    } else {
      setResident(currentResident);
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    logoutResident();
    navigate("/");
    setOpen(false);
  };

  const handleGoToDashboard = () => {
    markFirstLoginComplete(resident.id);
    navigate("/index");
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (!resident) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with hamburger menu */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Resident Portal</h1>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="space-y-4 mt-8">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base"
                  onClick={() => {
                    navigate("/index");
                    setOpen(false);
                  }}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Welcome, {resident.name}</h2>

          <Card>
            <CardHeader>
              <CardTitle>Your Resident Information</CardTitle>
              <CardDescription>
                Your approved resident profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <p className="text-lg">{resident.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-lg">{resident.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    House Number
                  </label>
                  <p className="text-lg">{resident.houseNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <p className="text-lg">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Approved
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Approved Date
                  </label>
                  <p className="text-lg">
                    {new Date(resident.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleGoToDashboard}
            className="w-full mt-6"
            size="lg"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ResidentPortal;
