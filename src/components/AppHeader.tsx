import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const AppHeader = () => {
  return (
    <header className="border-b border-border bg-primary">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-accent" />
          <span className="font-display text-xl font-semibold text-primary-foreground">
            Access Control
          </span>
        </Link>
      </div>
    </header>
  );
};

export default AppHeader;
