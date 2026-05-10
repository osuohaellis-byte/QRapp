import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getResidents, updateResidentStatus, Resident } from "@/lib/resident-store";

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);

  useEffect(() => {
    const loggedIn = localStorage.getItem("admin_logged_in") === "true";
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      loadResidents();
    }
  }, []);

  const loadResidents = async () => {
    const allResidents = await getResidents();
    setResidents(allResidents.filter(r => r.status === "pending"));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "12345678") {
      setIsLoggedIn(true);
      localStorage.setItem("admin_logged_in", "true");
      await loadResidents();
    } else {
      alert("Invalid credentials");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("admin_logged_in");
    setUsername("");
    setPassword("");
  };

  const handleApprove = async (id: string) => {
    await updateResidentStatus(id, "approved");
    loadResidents();
  };

  const handleReject = async (id: string) => {
    await updateResidentStatus(id, "rejected");
    loadResidents();
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel - Pending Residents</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
      {residents.length === 0 ? (
        <p>No pending residents.</p>
      ) : (
        <div className="space-y-4">
          {residents.map((resident) => (
            <Card key={resident.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p><strong>Name:</strong> {resident.name}</p>
                    <p><strong>Resident Number:</strong> {resident.residentNumber}</p>
                    <p><strong>Email:</strong> {resident.email}</p>
                    <p><strong>House Number:</strong> {resident.houseNumber}</p>
                    <p><strong>Submitted:</strong> {new Date(resident.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="space-x-2">
                    <Button onClick={() => handleApprove(resident.id)} variant="default">
                      Approve
                    </Button>
                    <Button onClick={() => handleReject(resident.id)} variant="destructive">
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;