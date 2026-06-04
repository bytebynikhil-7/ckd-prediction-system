import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User, Mail, Calendar, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — NephroScan" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => { if (profile?.full_name) setFullName(profile.full_name); }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account information.</p>
      </header>

      <div className="rounded-xl border bg-card shadow-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-elegant">
            {(profile?.full_name || profile?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{profile?.full_name || "—"}</div>
            <div className="text-sm text-muted-foreground truncate flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {profile?.email}</div>
            {isAdmin && (
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm pt-2">
          <Info icon={User} label="User ID" value={user?.id?.slice(0, 8) + "…"} />
          <Info icon={Calendar} label="Member since" value={profile ? format(new Date(profile.created_at), "PP") : "—"} />
        </div>

        <div className="pt-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending || !fullName.trim()}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <div className="text-xs text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}
