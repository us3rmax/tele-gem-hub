import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus, RefreshCw, MousePointerClick, Eye, Target, BarChart2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Totals { clicks: number; impressions: number; ctr: number; position: number }
interface QueryRow { key: string; clicks: number; impressions: number; ctr: number; position: number; delta_impressions?: number; delta_position?: number }
interface PageRow  { key: string; clicks: number; impressions: number; ctr: number; position: number; delta_impressions?: number }
interface DayRow   { date: string; clicks: number; impressions: number }
interface PeriodData { totals: Totals; totals_prev: Totals; queries: QueryRow[]; pages: PageRow[]; daily: DayRow[] }
interface SupabaseStats {
  total_groups: number; new_last_7d: number;
  categories: [string, number][];
  indexing: { total: number; sent: number; errors: number; last_run: string }
}
interface CacheData { "7d": PeriodData; "28d": PeriodData; "90d": PeriodData; supabase: SupabaseStats; updated_at: string }

type Period = "7d" | "28d" | "90d";

// ── Helpers ────────────────────────────────────────────────────────────────────
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const num = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));

function Delta({ val, reverse = false, unit = "" }: { val: number; reverse?: boolean; unit?: string }) {
  if (Math.abs(val) < 0.05) return <span className="text-zinc-500 text-xs">—</span>;
  const good = reverse ? val < 0 : val > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${good ? "text-emerald-400" : "text-red-400"}`}>
      {good ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(val).toFixed(unit === "pos" ? 1 : 0)}{unit === "pos" ? "" : ""}
    </span>
  );
}

function StatCard({ label, value, prev, icon: Icon, format }: {
  label: string; value: number; prev: number; icon: React.ElementType; format: "int" | "pct" | "pos"
}) {
  const display = format === "pct" ? pct(value) : format === "pos" ? value.toFixed(1) : num(value);
  const delta   = value - prev;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-xs uppercase tracking-wide">{label}</span>
        <Icon className="h-4 w-4 text-zinc-600" />
      </div>
      <div className="text-2xl font-bold text-white">{display}</div>
      <Delta val={delta} reverse={format === "pos"} unit={format === "pos" ? "pos" : ""} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SEODashboard() {
  const [data, setData]       = useState<CacheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<Period>("7d");
  const [updatedAt, setUpdatedAt] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("seo_cache")
      .select("data, updated_at")
      .eq("key", "dashboard")
      .single();
    if (rows) {
      setData(rows.data as unknown as CacheData);
      setUpdatedAt(rows.updated_at?.slice(0, 10) || "");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-zinc-400">
      <RefreshCw className="animate-spin h-6 w-6 mr-2" /> Carregando dados SEO...
    </div>
  );

  if (!data) return (
    <div className="py-12 text-center text-zinc-500 space-y-2">
      <BarChart2 className="mx-auto h-10 w-10 opacity-30" />
      <p className="text-sm">Nenhum dado disponível.</p>
      <p className="text-xs">Execute <code className="bg-zinc-800 px-1 rounded">python update_seo_cache.py</code> para popular o cache.</p>
    </div>
  );

  const p   = data[period];
  const sb  = data.supabase;
  const idx = sb.indexing;
  const indexPct = idx.total > 0 ? Math.round((idx.sent / idx.total) * 100) : 0;

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
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${period === v ? "bg-pink-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Cliques"      value={p.totals.clicks}      prev={p.totals_prev.clicks}      icon={MousePointerClick} format="int" />
        <StatCard label="Impressões"   value={p.totals.impressions}  prev={p.totals_prev.impressions}  icon={Eye}               format="int" />
        <StatCard label="CTR"          value={p.totals.ctr}          prev={p.totals_prev.ctr}          icon={Target}            format="pct" />
        <StatCard label="Posição Méd." value={p.totals.position}     prev={p.totals_prev.position}     icon={BarChart2}         format="pos" />
      </div>

      {/* Chart */}
      {p.daily.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Cliques e Impressões — {period}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={p.daily} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Line type="monotone" dataKey="impressions" stroke="#e91e63" dot={false} strokeWidth={2} name="Impressões" />
              <Line type="monotone" dataKey="clicks"      stroke="#22d3ee" dot={false} strokeWidth={2} name="Cliques" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-end">
            <span className="flex items-center gap-1 text-xs text-zinc-400"><span className="inline-block w-3 h-0.5 bg-pink-500" /> Impressões</span>
            <span className="flex items-center gap-1 text-xs text-zinc-400"><span className="inline-block w-3 h-0.5 bg-cyan-400" /> Cliques</span>
          </div>
        </div>
      )}

      {/* Top Queries + Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Queries */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Top 20 Queries por Impressões</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left px-3 py-2 font-medium">Query</th>
                  <th className="text-right px-3 py-2 font-medium">Imp.</th>
                  <th className="text-right px-3 py-2 font-medium">Cli.</th>
                  <th className="text-right px-3 py-2 font-medium">Pos.</th>
                  <th className="text-right px-3 py-2 font-medium">Δ</th>
                </tr>
              </thead>
              <tbody>
                {p.queries.map((q, i) => (
                  <tr key={q.key} className={i % 2 === 0 ? "bg-zinc-900/50" : "bg-zinc-950/30"}>
                    <td className="px-3 py-1.5 text-zinc-200 max-w-[160px] truncate">{q.key}</td>
                    <td className="px-3 py-1.5 text-right text-zinc-300">{num(q.impressions)}</td>
                    <td className="px-3 py-1.5 text-right text-zinc-300">{q.clicks}</td>
                    <td className="px-3 py-1.5 text-right text-zinc-400">{q.position.toFixed(1)}</td>
                    <td className="px-3 py-1.5 text-right"><Delta val={q.delta_impressions ?? 0} /></td>
                  </tr>
                ))}
                {p.queries.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-zinc-600">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pages */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Top 20 Páginas por Impressões</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left px-3 py-2 font-medium">Página</th>
                  <th className="text-right px-3 py-2 font-medium">Imp.</th>
                  <th className="text-right px-3 py-2 font-medium">Cli.</th>
                  <th className="text-right px-3 py-2 font-medium">Pos.</th>
                  <th className="text-right px-3 py-2 font-medium">Δ</th>
                </tr>
              </thead>
              <tbody>
                {p.pages.map((pg, i) => {
                  const label = pg.key.replace(/https?:\/\/(www\.)?canais18\.com/, "") || "/";
                  return (
                    <tr key={pg.key} className={i % 2 === 0 ? "bg-zinc-900/50" : "bg-zinc-950/30"}>
                      <td className="px-3 py-1.5 text-pink-400 font-mono max-w-[160px] truncate">{label}</td>
                      <td className="px-3 py-1.5 text-right text-zinc-300">{num(pg.impressions)}</td>
                      <td className="px-3 py-1.5 text-right text-zinc-300">{pg.clicks}</td>
                      <td className="px-3 py-1.5 text-right text-zinc-400">{pg.position.toFixed(1)}</td>
                      <td className="px-3 py-1.5 text-right"><Delta val={pg.delta_impressions ?? 0} /></td>
                    </tr>
                  );
                })}
                {p.pages.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-zinc-600">Sem dados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Supabase Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Grupos resumo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Grupos no Supabase</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{sb.total_groups.toLocaleString("pt-BR")}</span>
            <span className="text-zinc-500 text-sm mb-1">total</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">+{sb.new_last_7d}</span>
            <span className="text-zinc-500">novos nos últimos 7 dias</span>
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Por Categoria</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {sb.categories.map(([cat, count]) => {
              const pctCat = sb.total_groups > 0 ? (count / sb.total_groups) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-zinc-300 capitalize truncate">{cat}</span>
                      <span className="text-zinc-500 ml-2 shrink-0">{count}</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-600 rounded-full" style={{ width: `${pctCat}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indexação */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Google Indexing API</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{indexPct}%</span>
            <span className="text-zinc-500 text-sm mb-1">indexado</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-pink-600 rounded-full transition-all" style={{ width: `${indexPct}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-zinc-500">Enviadas</div>
              <div className="text-white font-bold">{idx.sent.toLocaleString("pt-BR")}</div>
            </div>
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-zinc-500">Total</div>
              <div className="text-white font-bold">{idx.total.toLocaleString("pt-BR")}</div>
            </div>
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-zinc-500">Erros</div>
              <div className={`font-bold ${idx.errors > 0 ? "text-red-400" : "text-zinc-400"}`}>{idx.errors}</div>
            </div>
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-zinc-500">Última run</div>
              <div className="text-zinc-300 font-medium text-[11px]">{idx.last_run}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
