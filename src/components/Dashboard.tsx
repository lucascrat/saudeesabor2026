import { useEffect, useState } from "react";
import { api, Stats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, TrendingUp, Truck, Calendar } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.stats().then(setStats);
  }, []);

  if (!stats) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Sincronizando banco de dados...</div>;

  const currentData = [
    { name: 'PEDIDOS', valor: stats.sales },
    { name: 'DESPESAS', valor: stats.expenses },
    { name: 'LUCRO', valor: stats.profit },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* ... (Cards stay similar but with polished colors) */}
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Receita Bruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="text-2xl font-bold text-slate-900 leading-none">R$ {stats.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
               <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div> AO VIVO
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Custo Total</CardTitle>
            <ShoppingBag className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="text-2xl font-bold text-rose-600 leading-none">R$ {stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="mt-2 text-[10px] text-slate-400 font-medium">Insumos + Logística + Fixas</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className={`text-2xl font-bold leading-none ${stats.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              R$ {stats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Margem: {stats.sales > 0 ? ((stats.profit / stats.sales) * 100).toFixed(1) : 0}%</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Eficiência Motoboy</CardTitle>
            <Truck className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="text-2xl font-bold text-slate-900 leading-none">{stats.mototaxis.count} entregas</div>
            <p className="mt-2 text-[10px] text-amber-600 font-bold uppercase">Custo Médio: R$ {stats.mototaxis.count > 0 ? (stats.mototaxis.total / stats.mototaxis.count).toFixed(2) : 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-8 border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">Evolução de Vendas (7 Dias)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] p-4 lg:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.history}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '11px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorVal)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">Balanço Consolidado</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 lg:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip 
                   formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="valor" 
                  radius={[4, 4, 0, 0]} 
                  fill={(entry: any) => {
                    if (entry.name === 'PEDIDOS') return '#10b981';
                    if (entry.name === 'DESPESAS') return '#ef4444';
                    return '#3b82f6';
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
