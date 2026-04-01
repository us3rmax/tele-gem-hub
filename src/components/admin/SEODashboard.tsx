import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { RefreshCw, MousePointerClick, Eye, Target, BarChart2, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface PeriodTotals { clicks: number; impressions: number; ctr: number; position: number }
interface CacheData {
  "7d": PeriodTotals; "28d": PeriodTotals; "90d": PeriodTotals;
  supabase: { total_groups: number; new_this_week: number };
  updated_at: string;
}
interface HealthRow {
  task: string; last_run: string | null; last_success: string | null;
  last_error: string | null; status: string;
}
interface IndexingProgress { sent: string[]; errors: number; last_run: string }

type Period = "7d" | "28d" | "90d";

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
const num = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));

function hoursAgo(iso: string | null) { return iso ? (Date.now() - new Date(iso).getTime()) / 3_600_000 : Infinity; }
function fmtRel(iso: string | null) {
  if (!iso) return "Nunca";
  const h = hoursAgo(iso);
  if (h < 1) return `${Math.round(h * 60)}min atrás`;
  if (h < 24) return `${Math.round(h)}h atrás`;
  return `${Math.round(h / 24)}d atrás`;
}

function computeStatus(row: HealthRow): "ok" | "error" | "late" | "pending" {
  if (row.status === "error") return "error";
  return hoursAgo(row.last_success) > 25 ? (row.last_success ? "late" : "pending") : "ok";
}

const STATUS_CFG = {
  ok:      { label: "OK",       icon: CheckCircle,   cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  error:   { label: "ERRO",     icon: XCircle,       cls: "text-red-400 bg-red-400/10 border-red-400/20" },
  late:    { label: "ATRASADO", icon: AlertTriangle, cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  pending: { label: "PENDENTE", icon: Clock,         cls: "text-zinc-400 bg-zinc-800 border-zinc-700" },
};

const TASK_LABELS: Record<string, string> = {
  "daily-tasks": "Indexação + Cache SEO",
  "health-check": "Health Check",
};

function HealthCard({ row }: { row: HealthRow }) {
  const s = computeStatus(row);
  const { label, icon: Icon, cls } = STATUS_CFG[s];
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white truncate">{TASK_LABELS[row.task] ?? row.task}</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cls} shrink-0`}>
          <Icon className="h-3 w-3" />{label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-zinc-800 rounded p-2">
          <div className="text-zinc-500 mb-0.5">Última execução</div>
          <div className="text-zinc-200">{fmtRel(row.last_run)}</div>
        </div>
        <div className="bg-zinc-800 rounded p-2">
          <div className="text-zinc-500 mb-0.5">Último sucesso</div>
          <div className={s === "ok" ? "text-emerald-400" : "text-zinc-200"}>{fmtRel(row.last_success)}</div>
        </div>
      </div>
      {s === "error" && row.last_error && (
        <div className="bg-red-950/30 border border-red-800/30 rounded p-2 text-red-300 text-xs font-mono truncate">{row.last_error}</div>
      )}
    </div>
  );
}

export default function SEODashboard() {
  const [data, setData]         = useState<CacheData | null>(null);
  const [health, setHealth]     = useState<HealthRow[]>([]);
  const [indexing, setIndexing] = useState<IndexingProgress | null>(null);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState<Period>("7d");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cacheRes, healthRes, idxRes] = await Promise.all([
        supabase.from("seo_cache").select("data, updated_at").eq("key", "dashboard").single(),
        supabase.from("seo_health").select("*").order("task"),
        supabase.from("seo_config").select("value").eq("key", "indexing_progress").single(),
      ]);
      if (cacheRes.data) {
        setData(cacheRes.data.data as unknown as CacheData);
        setUpdatedAt(cacheRes.data.updated_at?.slice(0, 10) ?? "");
      }
      if (healthRes.data) setHealth(healthRes.data as HealthRow[]);
      if (idxRes.data?.value) setIndexing(idxRes.data.value as unknown as IndexingProgress);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-zinc-400">
      <RefreshCw className="animate-spin h-6 w-6 mr-2" /> Carregando...
    </div>
  );

  if (!data) return (
    <div className="py-12 text-center text-zinc-500">
      <BarChart2 className="mx-auto h-10 w-10 opacity-30 mb-2" />
      <p className="text-sm">Sem dados. Aguarde a próxima execução automática (11h BRT).</p>
    </div>
  );

  const p  = data[period];
  const sb = data.supabase;
  const chartData = [
    { period: "7d",  Cliques: data["7d"].clicks,  Impressões: data["7d"].impressions },
    { period: "28d", Cliques: data["28d"].clicks, Impressões: data["28d"].impressions },
    { period: "90d", Cliques: data["90d"].clicks, Impressões: data["90d"].impressions },
  ];
  const idxTotal   = sb.total_groups + 19; // groups + priority URLs
  const idxSent    = indexing?.sent.length ?? 0;
  const idxPct     = idxTotal > 0 ? Math.round((idxSent / idxTotal) * 100) : 0;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">SEO Dashboard</h2>
          {updatedAt && <p className="text-xs text-zinc-500">Atualizado em {updatedAt}</p>}
        </div>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {(["7d", "28d", "90d"] as Period[]).map(v => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${period === v ? "bg-pink-600 text-white" : "text-zinc-400 hover:text-white"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Automation Status */}
      {health.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-300">Status das Automações</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {health.map(row => <HealthCard key={row.task} row={row} />)}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Cliques",      value: num(p.clicks),         icon: MousePointerClick },
          { label: "Impressões",   value: num(p.impressions),    icon: Eye },
          { label: "CTR",          value: pct(p.ctr),            icon: Target },
          { label: "Posição Méd.", value: p.position.toFixed(1), icon: BarChart2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs uppercase tracking-wide">{label}</span>
              <Icon className="h-4 w-4 text-zinc-600" />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Cliques e Impressões por Período</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="period" tick={{ fill: "#71717a", fontSize: 11 }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
            <Bar dataKey="Impressões" fill="#e91e63" radius={[3,3,0,0]} />
            <Bar dataKey="Cliques"    fill="#22d3ee" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Supabase Stats + Indexing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white">Grupos no Supabase</h3>
          <div className="text-3xl font-bold text-white">{sb.total_groups.toLocaleString("pt-BR")}</div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">+{sb.new_this_week}</span>
            <span className="text-zinc-500">novos nos últimos 7 dias</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Google Indexing API</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{idxPct}%</span>
            <span className="text-zinc-500 text-sm mb-1">indexado</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-pink-600 rounded-full transition-all" style={{ width: `${idxPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-zinc-500">Enviadas</div>
              <div className="text-white font-bold">{idxSent.toLocaleString("pt-BR")}</div>
            </div>
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-zinc-500">Erros</div>
              <div className={`font-bold ${(indexing?.errors ?? 0) > 0 ? "text-red-400" : "text-zinc-400"}`}>{indexing?.errors ?? 0}</div>
            </div>
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-zinc-500">Última run</div>
              <div className="text-zinc-300 text-[10px]">{fmtRel(indexing?.last_run ?? null)}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
