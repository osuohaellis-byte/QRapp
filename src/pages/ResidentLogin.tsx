import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { authenticateResident, setResidentPassword, getResidents, isFirstLoginAfterApproval } from "@/lib/resident-store";

const ResidentLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [emailOrName, setEmailOrName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const resident = await authenticateResident(emailOrName, password);
    if (resident) {
      // Check if this is first login after approval
      if (isFirstLoginAfterApproval(resident.id)) {
        navigate("/resident-portal");
      } else {
        navigate("/index");
      }
    } else {
      setError("Invalid email/name or password");
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Find approved resident with email or name
    const residents = await getResidents();
    const resident = residents.find(
      r => r.status === "approved" && (r.email === emailOrName || r.name === emailOrName)
    );

    if (!resident) {
      setError("No approved resident found with this email or name");
      return;
    }

    if (resident.password) {
      setError("Password already set for this account");
      return;
    }

    await setResidentPassword(resident.id, password);
    setMode("login");
    setPassword("");
    setConfirmPassword("");
    alert("Password set successfully! You can now login.");
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>
            {mode === "login" ? "Resident Login" : "Set Your Password"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Enter your credentials to access your account"
              : "Create a password to secure your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={mode === "login" ? handleLogin : handleSetPassword}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="emailOrName">Email or Name</Label>
              <Input
                id="emailOrName"
                type="text"
                value={emailOrName}
                onChange={(e) => setEmailOrName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">
                {mode === "login" ? "Password" : "Create Password"}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {mode === "setup" && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full">
              {mode === "login" ? "Login" : "Set Password"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t">
            {mode === "login" ? (
              <Button
                variant="link"
                className="w-full"
                onClick={() => {
                  setMode("setup");
                  setError("");
                  setPassword("");
                }}
              >
                First time? Click here to set your password
              </Button>
            ) : (
              <Button
                variant="link"
                className="w-full"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setPassword("");
                }}
              >
                Already have a password? Login here
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentLogin;
