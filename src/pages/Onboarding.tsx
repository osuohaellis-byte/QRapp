import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createResident, getResidentByDeviceId, getCurrentResident } from "@/lib/resident-store";

const Onboarding = () => {
  const navigate = useNavigate();
  const [residentData, setResidentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    residentNumber: "",
    email: "",
    houseNumber: "",
    name: "",
  });

  useEffect(() => {
    const checkResident = async () => {
      const resident = await getResidentByDeviceId();
      setResidentData(resident);
      setLoading(false);
      
      // Auto-redirect approved residents to login
      if (resident && resident.status === "approved") {
        navigate("/resident-login");
      }
    };
    checkResident();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resident = await createResident(formData);
    setResidentData(resident);
    setFormData({
      residentNumber: "",
      email: "",
      houseNumber: "",
      name: "",
    });
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  // Show pending approval state
  if (residentData && residentData.status === "pending") {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Application Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your application is currently under review. We'll notify you once it has been approved or rejected.
              </AlertDescription>
            </Alert>
            <p className="mt-4 text-sm text-gray-600">
              Your submission was received on {new Date(residentData.createdAt).toLocaleDateString()}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show rejected state
  if (residentData && residentData.status === "rejected") {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Application Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unfortunately, your application was rejected. Please contact support for more information.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show signup + login section
  return (
    <div className="container mx-auto py-8">
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Sign up section */}
        <Card>
          <CardHeader>
            <CardTitle>New Resident Onboarding</CardTitle>
            <CardDescription>
              Provide your information to complete the onboarding process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="residentNumber">Resident Number</Label>
                <Input
                  id="residentNumber"
                  name="residentNumber"
                  type="text"
                  value={formData.residentNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="houseNumber">House Street & Number</Label>
                <Input
                  id="houseNumber"
                  name="houseNumber"
                  type="text"
                  value={formData.houseNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login section for approved residents */}
        <Card>
          <CardHeader>
            <CardTitle>Approved Resident Login</CardTitle>
            <CardDescription>
              Already approved? Access your resident page here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/resident-login")}>
              Login to Your Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;