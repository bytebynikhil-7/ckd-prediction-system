import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Download, Search, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODELS, type ModelKey } from "@/lib/ckd";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Prediction history — NephroScan" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<"all" | "7" | "30" | "90">("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prediction_history")
        .select("*")
        .order("prediction_timestamp", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    let r = rows;
    if (range !== "all") {
      const days = parseInt(range, 10);
      const cutoff = Date.now() - days * 86400000;
      r = r.filter((x) => new Date(x.prediction_timestamp).getTime() >= cutoff);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      r = r.filter((x) =>
        x.selected_model.toLowerCase().includes(s) ||
        x.prediction_result.toLowerCase().includes(s),
      );
    }
    return r;
  }, [rows, range, search]);

  const exportCSV = () => {
    const header = ["Timestamp", "Result", "Confidence", "Model", "SG", "Hemo", "RBC", "Albumin", "HTN", "DM", "Appetite", "Pus Cell"];
    const lines = [header.join(",")];
    filtered.forEach((r) => {
      lines.push([
        new Date(r.prediction_timestamp).toISOString(),
        r.prediction_result,
        r.confidence_score,
        r.selected_model,
        r.specific_gravity,
        r.hemoglobin,
        r.red_blood_cell_count,
        r.albumin,
        r.hypertension ? "yes" : "no",
        r.diabetes_mellitus ? "yes" : "no",
        r.appetite,
        r.pus_cell,
      ].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    triggerDownload(blob, `ckd-history-${Date.now()}.csv`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("CKD Prediction History", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Exported ${format(new Date(), "PPpp")}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [["Date", "Result", "Conf.", "Model", "SG", "Hemo", "Alb"]],
      body: filtered.map((r) => [
        format(new Date(r.prediction_timestamp), "yyyy-MM-dd HH:mm"),
        r.prediction_result.toUpperCase(),
        `${r.confidence_score}%`,
        MODELS[r.selected_model as ModelKey].name,
        Number(r.specific_gravity).toFixed(3),
        r.hemoglobin,
        r.albumin,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [60, 110, 200] },
    });
    doc.save(`ckd-history-${Date.now()}.pdf`);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Prediction history</h1>
        <p className="text-muted-foreground mt-1">{filtered.length} of {rows.length} records</p>
      </header>

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by model or result…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV} disabled={!filtered.length}>
          <Download className="w-4 h-4 mr-2" /> CSV
        </Button>
        <Button variant="outline" onClick={exportPDF} disabled={!filtered.length}>
          <FileText className="w-4 h-4 mr-2" /> PDF
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">SG</th>
                <th className="px-4 py-3 font-medium">Hemo</th>
                <th className="px-4 py-3 font-medium">Alb</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (<tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>)}
              {!isLoading && !filtered.length && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No predictions match your filters.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap">{format(new Date(r.prediction_timestamp), "MMM d, yyyy HH:mm")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.prediction_result === "ckd" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                    }`}>
                      {r.prediction_result === "ckd" ? "CKD" : "Normal"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.confidence_score}%</td>
                  <td className="px-4 py-3 capitalize">{r.selected_model.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">{Number(r.specific_gravity).toFixed(3)}</td>
                  <td className="px-4 py-3">{r.hemoglobin}</td>
                  <td className="px-4 py-3">{r.albumin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
