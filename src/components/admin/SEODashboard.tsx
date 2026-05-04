import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  supabase: { total_groups: number; new_this_week?: number; new_last_7d?: number };
  updated_at: string;
}

interface HealthRow {
  task: string; last_run: string | null; last_success: string | null;
  last_error: string | null; status: string;
}

interface Indexing { sentToday: number; lastDate: string }

interface BotLog {
  id: string;
  url: string;
  ip: string | null;
  user_agent: string | null;
  bot_type: string;
  created_at: string;
}

interface GscHealth {
  indexed_28d:       number;
  sitemap_submitted: number;
  sitemap_indexed:   number;
  sitemap_errors:    number;
  error_types:       { type: string; count: number }[];
  date:              string;
  alerts:            string[];
}

interface HCFailure {
  name:     string;
  message:  string;
  critical: boolean;
  details?: string[];
}

interface HealthCheckResult {
  timestamp:  string;
  status:     "ok" | "warning" | "critical";
  total_ok:   number;
  total_warn: number;
  total_fail: number;
  failures:   HCFailure[];
  warnings:   { name: string; message: string }[];
}

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
  const [data,         setData]         = useState<CacheData | null>(null);
  const [health,       setHealth]       = useState<HealthRow[]>([]);
  const [indexing,     setIndexing]     = useState<Indexing | null>(null);
  const [gscHealth,    setGscHealth]    = useState<GscHealth | null>(null);
  const [schedules,    setSchedules]    = useState<Record<string, string>>({});
  const [sitemapCount, setSitemapCount] = useState<number>(33);
  const [botLogs,      setBotLogs]      = useState<BotLog[]>([]);
  const [hcResult,     setHcResult]     = useState<HealthCheckResult | null>(null);
  const [loading,      setLoading]      = useState(true);
  const { subTab: _seoSubTab } = useParams<{ subTab?: string }>();
  const tab = (_seoSubTab === "automacoes" ? "automacoes" : "analytics") as Tab;
  const navigateSeo = useNavigate();
  const [period,       setPeriod]       = useState<Period>("28d");
  const [updatedAt,    setUpdatedAt]    = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cacheRes, healthRes, idxRes, cronRes, gscRes, sitemapRes, botRes, hcRes] = await Promise.all([
          supabase.from("seo_cache").select("data, updated_at").eq("key", "dashboard").single(),
          supabase.from("seo_health").select("*").order("task"),
          supabase.from("indexing_progress").select("sent_count, date").order("date", { ascending: false }).limit(10),
          supabase.rpc("get_cron_schedules"),
          supabase.from("seo_cache").select("data").eq("key", "gsc_health").single(),
          supabase.from("seo_config").select("value").eq("key", "sitemap_url_count").single(),
          supabase.from("bot_logs").select("*").order("created_at", { ascending: false }).limit(10),
          supabase.from("seo_cache").select("data").eq("key", "health_check_result").single(),
        ]);
        if (cacheRes.data) {
          setData(cacheRes.data.data as unknown as CacheData);
          setUpdatedAt(cacheRes.data.updated_at?.slice(0, 10) ?? "");
        }
        if (healthRes.data)     setHealth(healthRes.data as HealthRow[]);
        if (idxRes.data) {
          const rows     = idxRes.data as { sent_count: number; date: string }[];
          const todayStr = new Date().toISOString().split("T")[0];
          // soma apenas o run de hoje (daily-tasks envia 33 URLs por execução)
          const sentToday = rows
            .filter(r => r.date === todayStr)
            .reduce((acc, r) => acc + (r.sent_count ?? 0), 0);
          // data do run mais recente (rows já vem DESC)
          const lastDate = rows.length > 0 ? rows[0].date : "";
          setIndexing({ sentToday, lastDate });
        }
        if (cronRes?.data) {
          const map: Record<string, string> = {};
          for (const row of cronRes.data as { jobname: string; schedule: string }[]) {
            const task = JOBNAME_TO_TASK[row.jobname];
            if (task) map[task] = row.schedule;
          }
          setSchedules(map);
        }
        if (gscRes?.data?.data) setGscHealth(gscRes.data.data as unknown as GscHealth);
        if (sitemapRes?.data?.value) {
          const v = sitemapRes.data.value as { count?: number };
          if (typeof v.count === "number") setSitemapCount(v.count);
        }
        if (botRes?.data) setBotLogs(botRes.data as BotLog[]);
        if (hcRes?.data?.data) setHcResult(hcRes.data.data as unknown as HealthCheckResult);
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
            <button key={id} onClick={() => navigateSeo(`/admin/seo/${id}`)}
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

          {/* ── Health Check do Sistema ────────────────────────────────── */}
          {(() => {
            const HC_SCHEDULE = "0 18 * * *"; // 18h UTC = 15h BRT
            const hcNextRun   = nextRunFromCron(HC_SCHEDULE);

            if (!hcResult) {
              return (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Health Check do Sistema</h3>
                    <span className="text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
                      Aguardando 1ª execução
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    Primeira execução: {hcNextRun}
                  </p>
                </div>
              );
            }

            const s = hcResult.status;
            const cfg = {
              ok:       { label: "TUDO OK",  cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", bar: "bg-emerald-500",  Icon: CheckCircle   },
              warning:  { label: "ATENÇÃO",  cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",   bar: "bg-yellow-500",  Icon: AlertTriangle },
              critical: { label: "CRÍTICO",  cls: "text-red-400 bg-red-400/10 border-red-400/20",            bar: "bg-red-500",     Icon: XCircle       },
            }[s];

            const total = hcResult.total_ok + hcResult.total_warn + hcResult.total_fail;

            return (
              <div className={`bg-zinc-900 border rounded-lg p-4 space-y-3 ${
                s === "critical" ? "border-red-800/40" :
                s === "warning"  ? "border-yellow-800/40" :
                                   "border-zinc-800"
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">Health Check do Sistema</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 ${cfg.cls}`}>
                    <cfg.Icon className="h-3 w-3" />{cfg.label}
                  </span>
                </div>

                {/* Barra de checks */}
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                    <span>{hcResult.total_ok} OK · {hcResult.total_warn} avisos · {hcResult.total_fail} falhas</span>
                    <span>{total} verificações</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex gap-px">
                    <div className="h-full bg-emerald-500 transition-all"
                         style={{ width: `${total > 0 ? (hcResult.total_ok / total) * 100 : 0}%` }} />
                    {hcResult.total_warn > 0 && (
                      <div className="h-full bg-yellow-500 transition-all"
                           style={{ width: `${(hcResult.total_warn / total) * 100}%` }} />
                    )}
                    {hcResult.total_fail > 0 && (
                      <div className="h-full bg-red-500 transition-all"
                           style={{ width: `${(hcResult.total_fail / total) * 100}%` }} />
                    )}
                  </div>
                </div>

                {/* Falhas — só exibe se houver */}
                {hcResult.failures.length > 0 && (
                  <div className="space-y-1.5">
                    {hcResult.failures.map((f, i) => (
                      <div key={i} className="bg-red-950/30 border border-red-900/30 rounded p-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                          <span className="text-red-300 font-medium">{f.name}</span>
                          {f.critical && (
                            <span className="text-[10px] bg-red-900/50 text-red-400 px-1 rounded">CRÍTICO</span>
                          )}
                        </div>
                        <p className="text-red-400/80 mt-0.5 ml-4.5 font-mono text-[11px]">{f.message}</p>
                        {f.details?.slice(0, 3).map((d, j) => (
                          <p key={j} className="text-red-500/60 ml-4.5 font-mono text-[10px] truncate">{d}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Avisos — só exibe se houver e não houver falhas */}
                {hcResult.failures.length === 0 && hcResult.warnings.length > 0 && (
                  <div className="space-y-1">
                    {hcResult.warnings.slice(0, 3).map((w, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-yellow-400/80">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                        <span><span className="font-medium">{w.name}:</span> {w.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Última: {fmtRel(hcResult.timestamp)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Próxima: {hcNextRun}
                  </span>
                </div>
              </div>
            );
          })()}

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

          {/* Indexing progress — baseado apenas na estratégia atual (33 URLs do sitemap) */}
          {(() => {
            const sentToday  = indexing?.sentToday ?? 0;
            const total      = sitemapCount; // 33, de seo_config.sitemap_url_count
            const pctV       = Math.min(100, total > 0 ? Math.round((sentToday / total) * 100) : 0);
            const lastDate   = indexing?.lastDate ?? "";
            // horário da última execução vem do seo_health (mais preciso que indexing_progress.date)
            const dailyHealth = health.find(h => h.task === "daily-tasks");
            const lastRunIso  = dailyHealth?.last_success ?? null;
            const ranToday    = lastDate === new Date().toISOString().split("T")[0];
            return (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Indexação Google — Hoje</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                    ranToday
                      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                      : "text-zinc-500 bg-zinc-800 border-zinc-700"
                  }`}>
                    {ranToday ? "Executado hoje" : lastDate ? `Último: ${lastDate}` : "Nunca"}
                  </span>
                </div>

                {/* Barra de progresso do dia */}
                <div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold text-white">{sentToday}</span>
                    <span className="text-zinc-400 text-sm mb-1">/ {total} URLs enviadas hoje</span>
                  </div>
                  <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${sentToday >= total ? "bg-emerald-500" : "bg-gradient-to-r from-pink-600 to-pink-400"}`}
                      style={{ width: `${pctV}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                    <span>0</span>
                    <span>{total} URLs no sitemap</span>
                  </div>
                </div>

                {/* Mini grid */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-zinc-800 rounded p-2">
                    <div className="text-zinc-500">Sitemap atual</div>
                    <div className="text-white font-bold text-base">{total}</div>
                  </div>
                  <div className="bg-zinc-800 rounded p-2">
                    <div className="text-zinc-500">Enviadas hoje</div>
                    <div className={`font-bold text-base ${sentToday >= total ? "text-emerald-400" : "text-zinc-200"}`}>
                      {sentToday}
                    </div>
                  </div>
                  <div className="bg-zinc-800 rounded p-2">
                    <div className="text-zinc-500">Última execução</div>
                    <div className="text-zinc-200 font-bold text-base leading-tight">
                      {lastRunIso ? fmtRel(lastRunIso) : lastDate || "—"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Cobertura de Indice GSC */}
          {gscHealth && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Cobertura de Indice</h3>
                <span className="text-xs text-zinc-500">{gscHealth.date}</span>
              </div>
              {gscHealth.alerts && gscHealth.alerts.length > 0 && (
                <div className="bg-red-950 border border-red-800 rounded p-2 space-y-1">
                  {gscHealth.alerts.map((a, i) => (
                    <div key={i} className="text-xs text-red-400 font-medium">{a}</div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-zinc-800 rounded p-3">
                  <div className="text-zinc-500 text-xs" title="Páginas que apareceram nos resultados de busca nos últimos 28d — proxy de indexação">Com impressão (28d)</div>
                  <div className="text-xl font-bold text-white">{(gscHealth.indexed_28d ?? 0).toLocaleString("pt-BR")}</div>
                </div>
                <div className="bg-zinc-800 rounded p-3">
                  <div className="text-zinc-500 text-xs">No Sitemap</div>
                  <div className="text-xl font-bold text-white">{(gscHealth.sitemap_submitted ?? 0).toLocaleString("pt-BR")}</div>
                </div>
                <div className="bg-zinc-800 rounded p-3">
                  <div className="text-zinc-500 text-xs">Indexadas Sitemap</div>
                  <div className="text-xl font-bold text-emerald-400">{(gscHealth.sitemap_indexed ?? 0).toLocaleString("pt-BR")}</div>
                </div>
                <div className="bg-zinc-800 rounded p-3">
                  <div className="text-zinc-500 text-xs">Erros Sitemap</div>
                  <div className={`text-xl font-bold ${(gscHealth.sitemap_errors ?? 0) > 0 ? "text-red-400" : "text-zinc-400"}`}>
                    {gscHealth.sitemap_errors ?? 0}
                  </div>
                </div>
              </div>
              {gscHealth.error_types && gscHealth.error_types.length > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Top erros de cobertura</div>
                  <div className="space-y-1">
                    {gscHealth.error_types.slice(0, 5).map((e) => (
                      <div key={e.type} className="flex justify-between text-xs">
                        <span className="text-zinc-400">{e.type}</span>
                        <span className="text-red-400 font-medium">{e.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visitas do Googlebot */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Visitas do Googlebot</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${botLogs.length > 0 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-zinc-500 bg-zinc-800 border-zinc-700"}`}>
                {botLogs.length > 0 ? `${botLogs.length} registros` : "Sem visitas"}
              </span>
            </div>
            {botLogs.length === 0 ? (
              <p className="text-zinc-500 text-xs">Nenhuma visita registrada ainda. O Worker loga automaticamente quando o Googlebot visitar qualquer página do site.</p>
            ) : (
              <div className="space-y-1.5">
                {botLogs.map(log => (
                  <div key={log.id} className="bg-zinc-800 rounded p-2 text-xs flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-zinc-200 truncate font-mono">
                        {log.url.replace("https://www.canais18.com", "")}
                      </div>
                      <div className="text-zinc-500 mt-0.5">
                        {fmtRel(log.created_at)}
                        {log.ip && <span className="ml-2 font-mono">{log.ip}</span>}
                      </div>
                    </div>
                    <span className="text-emerald-400 shrink-0 text-[10px] font-bold uppercase mt-0.5">
                      {log.bot_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  <div className="text-2xl font-bold text-emerald-400">+{(data.supabase.new_this_week ?? data.supabase.new_last_7d ?? 0).toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

// sitemapCount é buscado dinamicamente de seo_config.key='sitemap_url_count'
