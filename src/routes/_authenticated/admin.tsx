import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Activity, TrendingUp, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as ReTooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { MODELS, type ModelKey } from "@/lib/ckd";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — NephroScan" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

const CHART_COLORS = ["oklch(0.55 0.18 245)", "oklch(0.72 0.16 230)", "oklch(0.62 0.15 155)", "oklch(0.78 0.15 75)", "oklch(0.58 0.22 25)"];

function AdminPage() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: userCount }, { data: predictions }, { data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("prediction_history").select("*").order("prediction_timestamp", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return {
        userCount: userCount ?? 0,
        predictions: predictions ?? [],
        profiles: profiles ?? [],
        roles: roles ?? [],
      };
    },
  });

  const profilesById = new Map((data?.profiles ?? []).map((p) => [p.id, p]));
  const rolesByUser = new Map<string, string>();
  for (const r of data?.roles ?? []) {
    // prefer admin if multiple
    if (r.role === "admin" || !rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, r.role);
  }


  const preds = data?.predictions ?? [];
  const ckdCount = preds.filter((p) => p.prediction_result === "ckd").length;
  const modelStats = (Object.keys(MODELS) as ModelKey[]).map((k) => ({
    name: MODELS[k].name,
    uses: preds.filter((p) => p.selected_model === k).length,
  }));
  const resultStats = [
    { name: "CKD", value: ckdCount },
    { name: "Not CKD", value: preds.length - ckdCount },
  ];

  // Last 14 days activity
  const days: { name: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const count = preds.filter((p) => {
      const t = new Date(p.prediction_timestamp).getTime();
      return t >= d.getTime() && t < next.getTime();
    }).length;
    days.push({ name: `${d.getMonth()+1}/${d.getDate()}`, count });
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="text-muted-foreground mt-1">System-wide analytics and activity.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Total users" value={data?.userCount ?? 0} />
        <Stat icon={Activity} label="Total predictions" value={preds.length} />
        <Stat icon={TrendingUp} label="CKD detected" value={ckdCount} />
        <Stat icon={Brain} label="CKD rate" value={preds.length ? `${Math.round((ckdCount / preds.length) * 100)}%` : "—"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Predictions — last 14 days">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={days}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <ReTooltip />
              <Bar dataKey="count" fill="oklch(0.55 0.18 245)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Result distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={resultStats} dataKey="value" nameKey="name" outerRadius={90} label>
                {resultStats.map((_, i) => <Cell key={i} fill={i === 0 ? "oklch(0.58 0.22 25)" : "oklch(0.62 0.15 155)"} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Model usage">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={modelStats}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <ReTooltip />
              <Bar dataKey="uses" fill="oklch(0.72 0.16 230)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Recent users">
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left font-medium py-2 pr-3">Name</th>
                  <th className="text-left font-medium py-2 pr-3">Email</th>
                  <th className="text-left font-medium py-2 pr-3">Registered</th>
                  <th className="text-left font-medium py-2">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data?.profiles ?? []).slice(0, 10).map((u) => {
                  const role = rolesByUser.get(u.id) ?? "user";
                  return (
                    <tr key={u.id}>
                      <td className="py-2 pr-3 font-medium truncate max-w-[140px]">{u.full_name || "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground truncate max-w-[180px]">{u.email}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!data?.profiles?.length && <div className="py-10 text-center text-sm text-muted-foreground">No users yet</div>}
          </div>
        </Card>
      </div>

      <div className="rounded-xl border bg-card shadow-card p-5">
        <h2 className="font-semibold mb-4">Recent predictions</h2>
        <div className="overflow-x-auto -mx-5 px-5 max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-xs text-muted-foreground border-b sticky top-0 bg-card">
              <tr>
                <th className="text-left font-medium py-2 pr-3">User</th>
                <th className="text-left font-medium py-2 pr-3">Email</th>
                <th className="text-left font-medium py-2 pr-3">Model</th>
                <th className="text-left font-medium py-2 pr-3">Result</th>
                <th className="text-left font-medium py-2 pr-3">Confidence</th>
                <th className="text-left font-medium py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {preds.slice(0, 25).map((p) => {
                const u = profilesById.get(p.user_id);
                return (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 font-medium truncate max-w-[140px]">{u?.full_name || "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground truncate max-w-[180px]">{u?.email || "—"}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{MODELS[p.selected_model as ModelKey].name}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.prediction_result === "ckd" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                      }`}>
                        {p.prediction_result === "ckd" ? "CKD" : "Not CKD"}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{p.confidence_score}%</td>
                    <td className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(p.prediction_timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!preds.length && <div className="py-10 text-center text-sm text-muted-foreground">No predictions yet</div>}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="w-9 h-9 rounded-lg bg-accent text-primary flex items-center justify-center"><Icon className="w-4 h-4" /></div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-card p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
