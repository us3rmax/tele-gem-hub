import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  MousePointerClick, Eye, Target, BarChart2, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Activity, Cpu,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Totals  { clicks: number; impressions: number; ctr: number; position: number }
interface Row     { key: string; clicks: number; impressions: number; ctr: number; position: number }
interface DayRow  { date: string; clicks: number; impressions: number }

interface PeriodData extends Totals {
  daily:    DayRow[];
  queries?: Row[];
  pages?:   Row[];
}

interface CacheData {
  "7d":  PeriodData;
  "28d": PeriodData & { queries: Row[]; pages: Row[] };
  "90d": PeriodData;
  supabase: { total_groups: number; new_this_week: number };
  updated_at: string;
}

interface HealthRow {
  task: string; last_run: string | null; last_success: string | null;
  last_error: string | null; status: string;
}

interface Indexing { sent: string[]; errors: number; last_run: string }

type Period = "7d" | "28d" | "90d";
type Tab    = "analytics" | "automacoes";

// ── Helpers ───────────────────────────────────────────────────────────────────

const num = (n: number | null | undefined) => { const v = n ?? 0; return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)); };
const pct = (n: number | null | undefined) => `${((n ?? 0) * 100).toFixed(2)}%`;

function hoursAgo(iso: string | null) {
  return iso ? (Date.now() - new Date(iso).getTime()) / 3_600_000 : Infinity;
}

function fmtRel(iso: string | null) {
  if (!iso) return "Nunca";
  const h = hoursAgo(iso);
  if (h < 1)  return `${Math.round(h * 60)}min atrás`;
  if (h < 24) return `${Math.round(h)}h atrás`;
  return `${Math.round(h / 24)}d atrás`;
}

// Parses "30 16 * * *" → next run datetime string in BRT
function nextRunFromCron(schedule: string | undefined): string {
  if (!schedule) return "—";
  const parts = schedule.trim().split(/\s+/);
  const minute = parseInt(parts[0] ?? "0");
  const hour   = parseInt(parts[1] ?? "0");
  if (isNaN(minute) || isNaN(hour)) return "—";
  const now  = new Date();
  const next = new Date();
  next.setUTCHours(hour, minute, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const diffMin = Math.round((next.getTime() - now.getTime()) / 60_000);
  const brtH    = (hour - 3 + 24) % 24;
  const brtM    = minute.toString().padStart(2, "0");
  if (diffMin < 60)  return `em ~${diffMin}min (${brtH}:${brtM} BRT)`;
  if (diffMin < 1440) return `em ~${Math.round(diffMin / 60)}h (${brtH}:${brtM} BRT)`;
  return `amanhã às ${brtH}:${brtM} BRT`;
}

function computeStatus(row: HealthRow): "ok" | "error" | "late" | "pending" {
  if (row.status === "error") return "error";
  return hoursAgo(row.last_success) > 25 ? (row.last_success ? "late" : "pending") : "ok";
}

const STATUS = {
  ok:      { label: "OK",       Icon: CheckCircle,   cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  error:   { label: "ERRO",     Icon: XCircle,       cls: "text-red-400 bg-red-400/10 border-red-400/20" },
  late:    { label: "ATRASADO", Icon: AlertTriangle, cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  pending: { label: "PENDENTE", Icon: Clock,         cls: "text-zinc-400 bg-zinc-800 border-zinc-700" },
};

const TASK_LABELS: Record<string, string> = {
  "daily-tasks":  "Indexação + Cache SEO",
  "health-check": "Health Check",
};

// jobname → task key mapping
const JOBNAME_TO_TASK: Record<string, string> = {
  "daily-tasks-11h":  "daily-tasks",
  "health-check-12h": "health-check",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, sub }: {
  label: string; value: string; icon: React.ElementType; sub?: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-xs uppercase tracking-wide">{label}</span>
        <Icon className="h-4 w-4 text-zinc-600" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

function TopTable({ rows, labelFn, title }: {
  rows: Row[]; title: string; labelFn: (k: string) => string
}) {
  if (!rows?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 text-sm font-semibold text-white">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Nome</th>
              <th className="text-right px-3 py-2">Cli.</th>
              <th className="text-right px-3 py-2">Imp.</th>
              <th className="text-right px-3 py-2">Pos.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className={i % 2 === 0 ? "bg-zinc-900/50" : "bg-zinc-950/30"}>
                <td className="px-3 py-1.5 text-zinc-600">{i + 1}</td>
                <td className="px-3 py-1.5 text-zinc-200 max-w-[180px] truncate">{labelFn(r.key)}</td>
                <td className="px-3 py-1.5 text-right text-zinc-300">{r.clicks}</td>
                <td className="px-3 py-1.5 text-right text-zinc-400">{num(r.impressions)}</td>
                <td className="px-3 py-1.5 text-right text-zinc-500">{(r.position ?? 0).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HealthCard({ row, schedule }: { row: HealthRow; schedule: string | undefined }) {
  const s   = computeStatus(row);
  const cfg = STATUS[s];
  const label = TASK_LABELS[row.task] ?? row.task;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.cls} shrink-0`}>
          <cfg.Icon className="h-3 w-3" />{cfg.label}
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
      <div className="text-xs text-zinc-500 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Próxima execução: <span className="text-zinc-300">{nextRunFromCron(schedule)}</span>
      </div>
      {s === "error" && row.last_error && (
        <div className="bg-red-950/30 border border-red-800/30 rounded p-2 text-red-300 text-xs font-mono truncate">
          {row.last_error}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SEODashboard() {
  const [data,      setData]      = useState<CacheData | null>(null);
  const [health,    setHealth]    = useState<HealthRow[]>([]);
  const [indexing,  setIndexing]  = useState<Indexing | null>(null);
  const [schedules, setSchedules] = useState<Record<string, string>>({});
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<Tab>("analytics");
  const [period,    setPeriod]    = useState<Period>("28d");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cacheRes, healthRes, idxRes, cronRes] = await Promise.all([
          supabase.from("seo_cache").select("data, updated_at").eq("key", "dashboard").single(),
          supabase.from("seo_health").select("*").order("task"),
          supabase.from("seo_config").select("value").eq("key", "indexing_progress").single(),
          supabase.rpc("get_cron_schedules"),
        ]);
        if (cacheRes.data) {
          setData(cacheRes.data.data as unknown as CacheData);
          setUpdatedAt(cacheRes.data.updated_at?.slice(0, 10) ?? "");
        }
        if (healthRes.data)     setHealth(healthRes.data as HealthRow[]);
        if (idxRes.data?.value) setIndexing(idxRes.data.value as unknown as Indexing);
        if (cronRes?.data) {
          const map: Record<string, string> = {};
          for (const row of cronRes.data as { jobname: string; schedule: string }[]) {
            const task = JOBNAME_TO_TASK[row.jobname];
            if (task) map[task] = row.schedule;
          }
          setSchedules(map);
        }
      } catch (e) {
        console.error("SEODashboard load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-zinc-400">
      <RefreshCw className="animate-spin h-6 w-6 mr-2" /> Carregando...
    </div>
  );

  // ── Tab selector ────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "analytics",  label: "Analytics",  Icon: Activity },
    { id: "automacoes", label: "Automações", Icon: Cpu },
  ];

  return (
    <div className="space-y-4 pb-8">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">SEO Dashboard</h2>
          {updatedAt && <p className="text-xs text-zinc-500">Atualizado em {updatedAt}</p>}
        </div>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${tab === id ? "bg-pink-600 text-white" : "text-zinc-400 hover:text-white"}`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ABA 1: Analytics ─────────────────────────────────────────────── */}
      {tab === "analytics" && (
        <>
          {!data ? (
            <div className="py-16 text-center text-zinc-500">
              <BarChart2 className="mx-auto h-10 w-10 opacity-30 mb-2" />
              <p className="text-sm">Sem dados. Próxima atualização automática às 11h BRT.</p>
            </div>
          ) : (() => {
            const p = data[period];
            const daily = p.daily ?? [];
            const queries = data["28d"].queries ?? [];
            const pages   = data["28d"].pages   ?? [];

            return (
              <div className="space-y-4">

                {/* Period toggle */}
                <div className="flex items-center gap-1 w-fit bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                  {(["7d", "28d", "90d"] as Period[]).map(v => (
                    <button key={v} onClick={() => setPeriod(v)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors
                        ${period === v ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}>
                      {v}
                    </button>
                  ))}
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Visitas (Cliques)" value={num(p.clicks)}         icon={MousePointerClick} sub="via Google Search" />
                  <StatCard label="Impressões"        value={num(p.impressions)}    icon={Eye}               sub="na busca do Google" />
                  <StatCard label="CTR"               value={pct(p.ctr)}            icon={Target}            sub="cliques / impressões" />
                  <StatCard label="Posição Média"     value={(p.position ?? 0).toFixed(1)} icon={BarChart2}         sub="ranking médio" />
                </div>

                {/* Line chart */}
                {daily.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                      Cliques e Impressões — {period}
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }}
                          tickFormatter={d => d.slice(5)} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, fontSize: 12 }}
                          labelStyle={{ color: "#a1a1aa" }} />
                        <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
                        <Line type="monotone" dataKey="impressions" stroke="#e91e63" dot={false} strokeWidth={2} name="Impressões" />
                        <Line type="monotone" dataKey="clicks"      stroke="#22d3ee" dot={false} strokeWidth={2} name="Cliques" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <TopTable
                    title="Top 10 Keywords (28d)"
                    rows={queries}
                    labelFn={k => k}
                  />
                  <TopTable
                    title="Top 10 Páginas (28d)"
                    rows={pages}
                    labelFn={k => k.replace(/https?:\/\/(www\.)?canais18\.com/, "") || "/"}
                  />
                </div>

                {/* Period comparison */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">Comparativo de Períodos</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {(["7d", "28d", "90d"] as Period[]).map(v => {
                      const d = data[v];
                      const isActive = v === period;
                      return (
                        <div key={v} onClick={() => setPeriod(v)} className={`rounded-lg p-3 cursor-pointer border transition-colors ${isActive ? "border-pink-600 bg-pink-600/5" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"}`}>
                          <div className="text-xs text-zinc-500 mb-1">{v}</div>
                          <div className="text-lg font-bold text-white">{num(d.clicks)}</div>
                          <div className="text-xs text-zinc-400">{num(d.impressions)} imp</div>
                          <div className="text-xs text-zinc-500 mt-1">pos {(d.position ?? 0).toFixed(1)} · CTR {pct(d.ctr)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })()}
        </>
      )}

      {/* ── ABA 2: Automações ────────────────────────────────────────────── */}
      {tab === "automacoes" && (
        <div className="space-y-4">

          {/* Health cards */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Status das Tasks</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {health.length > 0
                ? health.map(row => <HealthCard key={row.task} row={row} schedule={schedules[row.task]} />)
                : <p className="text-zinc-500 text-sm">Sem dados de saúde.</p>
              }
            </div>
          </div>

          {/* Indexing progress */}
          {(() => {
            const sent  = indexing?.sent.length ?? 0;
            const total = (data?.supabase.total_groups ?? 0) + PRIORITY_URLS_COUNT;
            const pctV  = total > 0 ? Math.round((sent / total) * 100) : 0;
            const remaining = Math.max(0, total - sent);
            const daysLeft  = Math.ceil(remaining / 200);
            return (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">Progresso da Indexação Google</h3>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-white">{pctV}%</span>
                  <span className="text-zinc-400 text-sm mb-1">{sent.toLocaleString("pt-BR")} / {total.toLocaleString("pt-BR")} URLs</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full transition-all"
                    style={{ width: `${pctV}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-zinc-800 rounded p-2">
                    <div className="text-zinc-500">Enviadas</div>
                    <div className="text-white font-bold text-base">{sent.toLocaleString("pt-BR")}</div>
                  </div>
                  <div className="bg-zinc-800 rounded p-2">
                    <div className="text-zinc-500">Restantes</div>
                    <div className="text-zinc-200 font-bold text-base">{remaining.toLocaleString("pt-BR")}</div>
                  </div>
                  <div className="bg-zinc-800 rounded p-2">
                    <div className="text-zinc-500">Tempo est.</div>
                    <div className="text-zinc-200 font-bold text-base">{daysLeft}d</div>
                  </div>
                </div>
                <div className="text-xs text-zinc-500">
                  Erros acumulados: <span className={`font-medium ${(indexing?.errors ?? 0) > 0 ? "text-red-400" : "text-zinc-400"}`}>{indexing?.errors ?? 0}</span>
                  {indexing?.last_run && <span className="ml-3">Última run: {fmtRel(indexing.last_run)}</span>}
                </div>
              </div>
            );
          })()}

          {/* Supabase groups */}
          {data && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Grupos no Banco</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800 rounded p-3">
                  <div className="text-zinc-500 text-xs">Total</div>
                  <div className="text-2xl font-bold text-white">{(data.supabase.total_groups ?? 0).toLocaleString("pt-BR")}</div>
                </div>
                <div className="bg-zinc-800 rounded p-3">
                  <div className="text-zinc-500 text-xs flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400" /> Esta semana
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">+{data.supabase.new_this_week}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

const PRIORITY_URLS_COUNT = 19;
