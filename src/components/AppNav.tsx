import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Activity, LayoutDashboard, History, User, Shield, LogOut, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export function AppNav() {
  const { isAdmin, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/predict", label: "Predict", icon: Activity },
    { to: "/history", label: "History", icon: History },
    { to: "/profile", label: "Profile", icon: User },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ] as const;

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-card shadow-card">
      <div className="px-6 py-5 border-b">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-elegant">
            <Stethoscope className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold leading-tight">NephroScan</div>
            <div className="text-xs text-muted-foreground">CKD Prediction</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-elegant"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs text-muted-foreground">Signed in as</div>
          <div className="text-sm font-medium truncate">{user?.email}</div>
        </div>
        <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>
    </aside>
  );
}

export function MobileBar() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const items = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/predict", label: "Predict", icon: Activity },
    { to: "/history", label: "History", icon: History },
    { to: "/profile", label: "Profile", icon: User },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ] as const;
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur">
      <div className="flex justify-around">
        {items.map((i) => {
          const active = location.pathname === i.to;
          return (
            <Link key={i.to} to={i.to} className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 text-xs",
              active ? "text-primary" : "text-muted-foreground",
            )}>
              <i.icon className="w-5 h-5" />
              {i.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
