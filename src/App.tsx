/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  Utensils, 
  Truck,
  Menu,
  X,
  Layers,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { useState, ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";

import Dashboard from "@/components/Dashboard.tsx";
import Inventory from "@/components/Inventory.tsx";
import Categories from "@/components/Categories.tsx";
import Expenses from "@/components/Expenses.tsx";
import Sales from "@/components/Sales.tsx";
import Logistics from "@/components/Logistics.tsx";
import Settings from "@/components/Settings.tsx";
import Login from "@/components/Login.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function Layout({ children, onLogout }: { children: ReactNode, onLogout: () => void }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Painel Geral", href: "/", icon: LayoutDashboard },
    { name: "Logística", href: "/logistica", icon: Truck },
    { name: "Estoque de Insumos", href: "/estoque", icon: Package },
    { name: "Categorias", href: "/categorias", icon: Layers },
    { name: "Gestão de Vendas", href: "/vendas", icon: Utensils },
    { name: "Financeiro & Custos", href: "/despesas", icon: Receipt },
    { name: "Configurações", href: "/settings", icon: ShieldCheck },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 flex-col bg-[#0F172A] text-white overflow-hidden shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-emerald-500 p-1 rounded">🥗</span> Saúde & Sabor
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">Painel de Controle v1.0</p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-emerald-600 text-white font-medium shadow-sm shadow-emerald-900/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive(item.href) ? "text-white" : "text-slate-500"}`} />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-700 bg-slate-900/50 mt-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">ADM</div>
              <div>
                <p className="text-xs font-semibold">Gerente Admin</p>
                <p className="text-[10px] text-slate-500">SQLite Ativo</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#0F172A] text-white border-b border-slate-700 shadow-sm">
          <h2 className="font-bold flex items-center gap-2">
            <span className="bg-emerald-500 p-1 rounded">🥗</span> Saúde & Sabor
          </h2>
          <Button variant="ghost" size="icon" className="hover:bg-slate-800" onClick={() => setIsMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Header / Page Info (Desktop Only Style) */}
        <header className="hidden md:flex bg-white border-b border-slate-200 p-6 items-center justify-between shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
           <div className="flex items-center gap-4">
             <h2 className="text-lg font-bold text-slate-800">
               {navigation.find(n => n.href === location.pathname)?.name || "Saúde e Sabor"}
             </h2>
             <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
             <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Muitas Vendas Hoje!</p>
           </div>
           <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600">
               {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
             </span>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <nav className="fixed inset-y-0 left-0 w-72 bg-[#0F172A] p-6 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-bold text-white flex items-center gap-2">
                 <span className="bg-emerald-500 p-1 rounded">🥗</span> Saúde & Sabor
              </h2>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => setIsMobileOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isActive(item.href)
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-800">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                  onClick={onLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sair do Sistema</span>
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    toast.info("Sessão encerrada.");
  };

  if (isAuthenticated === null) return null; // Prevent flicker

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <RoutesContent />
      </Layout>
    </Router>
  );
}

function RoutesContent() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logistica" element={<Logistics />} />
          <Route path="/estoque" element={<Inventory />} />
          <Route path="/categorias" element={<Categories />} />
          <Route path="/vendas" element={<Sales />} />
          <Route path="/despesas" element={<Expenses />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
