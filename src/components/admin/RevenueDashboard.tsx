import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie
} from "recharts";
import { 
  DollarSign, TrendingUp, CreditCard, Calendar, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Package, Zap, Star
} from "lucide-react";
import { format, subDays, startOfDay, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  amount: number;
  payment_type: 'express' | 'premium';
  created_at: string;
  name: string;
}

type Period = "today" | "7d" | "15d" | "30d";

export default function RevenueDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      // Puxar submissões pagas dos últimos 90 dias para ter histórico
      const ninetyDaysAgo = subDays(new Date(), 90).toISOString();
      
      const { data, error } = await supabase
        .from("group_submissions")
        .select("id, name, payment_type, created_at, payment_status")
        .eq("payment_status", "paid")
        .gte("created_at", ninetyDaysAgo)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        payment_type: item.payment_type as 'express' | 'premium',
        created_at: item.created_at,
        amount: item.payment_type === 'premium' ? 29.90 : 5.99
      }));

      setTransactions(formatted);
    } catch (err) {
      console.error("Error fetching revenue:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    if (period === "today") startDate = startOfDay(now);
    else if (period === "7d") startDate = subDays(now, 7);
    else if (period === "15d") startDate = subDays(now, 15);
    else startDate = subDays(now, 30);

    const filtered = transactions.filter(t => isAfter(parseISO(t.created_at), startDate));
    
    const total = filtered.reduce((acc, t) => acc + t.amount, 0);
    const expressCount = filtered.filter(t => t.payment_type === 'express').length;
    const premiumCount = filtered.filter(t => t.payment_type === 'premium').length;
    
    // Agrupar por dia para o gráfico
    const dailyMap: Record<string, number> = {};
    filtered.forEach(t => {
      const day = format(parseISO(t.created_at), "dd/MM");
      dailyMap[day] = (dailyMap[day] || 0) + t.amount;
    });

    const chartData = Object.entries(dailyMap).map(([date, value]) => ({ date, value })).reverse();

    return {
      total,
      expressCount,
      premiumCount,
      expressRevenue: expressCount * 5.99,
      premiumRevenue: premiumCount * 29.90,
      chartData,
      transactionCount: filtered.length
    };
  }, [transactions, period]);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-zinc-400">
      <RefreshCw className="animate-spin h-6 w-6 mr-2" /> Carregando faturamento...
    </div>
  );

  const COLORS = ['#8B5CF6', '#F59E0B']; // Purple for Express, Amber for Premium

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Faturamento do Portal
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Acompanhe as vendas de planos e destaques.</p>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
          {(["today", "7d", "15d", "30d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === p ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {p === "today" ? "Hoje" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Receita Total</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
          </div>
          <div className="text-3xl font-black text-white">R$ {stats.total.toFixed(2)}</div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            {stats.transactionCount} vendas no período
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Plano Express</span>
            <div className="p-2 bg-purple-500/10 rounded-lg"><Zap className="h-4 w-4 text-purple-500" /></div>
          </div>
          <div className="text-3xl font-black text-white">R$ {stats.expressRevenue.toFixed(2)}</div>
          <div className="text-[10px] text-zinc-500">{stats.expressCount} aprovações imediatas</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Plano Premium</span>
            <div className="p-2 bg-amber-500/10 rounded-lg"><Star className="h-4 w-4 text-amber-500" /></div>
          </div>
          <div className="text-3xl font-black text-white">R$ {stats.premiumRevenue.toFixed(2)}</div>
          <div className="text-[10px] text-zinc-500">{stats.premiumCount} destaques semanais</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Ticket Médio</span>
            <div className="p-2 bg-blue-500/10 rounded-lg"><CreditCard className="h-4 w-4 text-blue-500" /></div>
          </div>
          <div className="text-3xl font-black text-white">
            R$ {stats.transactionCount > 0 ? (stats.total / stats.transactionCount).toFixed(2) : "0.00"}
          </div>
          <div className="text-[10px] text-zinc-500">Valor médio por venda</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            Evolução das Vendas
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  labelStyle={{ color: '#71717a', fontSize: '10px', marginBottom: '4px' }}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col">
          <h3 className="text-sm font-bold text-white mb-6">Distribuição de Planos</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
             <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Express', value: stats.expressCount },
                        { name: 'Premium', value: stats.premiumCount }
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#8B5CF6" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="w-full space-y-3 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <span className="text-zinc-400">Plano Express</span>
                  </div>
                  <span className="text-white font-bold">{stats.expressCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <span className="text-zinc-400">Plano Premium</span>
                  </div>
                  <span className="text-white font-bold">{stats.premiumCount}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-white">Vendas Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50">
              <tr>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Grupo/Canal</th>
                <th className="px-6 py-3 font-medium">Plano</th>
                <th className="px-6 py-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {transactions.slice(0, 10).map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-zinc-400 text-xs">
                    {format(parseISO(t.created_at), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate">
                    {t.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      t.payment_type === 'premium' 
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                        : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                    }`}>
                      {t.payment_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-white">
                    R$ {t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="py-12 text-center text-zinc-500 italic">Nenhuma venda registrada.</div>
          )}
        </div>
      </div>
    </div>
  );
}
