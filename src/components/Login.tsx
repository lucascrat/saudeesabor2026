import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { toast } from "sonner";
import { motion } from "motion/react";
import { LogIn, Lock, User } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        localStorage.setItem("isAuthenticated", "true");
        toast.success("Login realizado com sucesso!");
        setTimeout(() => {
          onLogin();
        }, 500);
      } else {
        const error = await response.json();
        toast.error(error.message || "Usuário ou senha incorretos.");
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("Erro ao conectar com o servidor.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-500 relative overflow-hidden px-4">
      {/* Abstract decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="flex justify-center mb-8">
           <motion.div 
             initial={{ y: -20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-2xl border-[6px] border-orange-400 p-2 overflow-hidden"
           >
              <img 
                src="https://lirp.cdn-website.com/3932750e/dms3blk/lib/exe/fetch.php?media=logo_saude_sabor.png" 
                alt="Saúde & Sabor Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://cdn-icons-png.flaticon.com/512/2927/2927347.png"; // Healthy food icon fallback
                }}
              />
           </motion.div>
        </div>

        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400" />
          <CardHeader className="space-y-1 flex flex-col items-center pb-6">
            <CardTitle className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">
              Saúde <span className="text-orange-600">&</span> Sabor
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">
              Painel de Gestão Operacional
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase text-slate-500 ml-1">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="username"
                    placeholder="admin" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase text-slate-500 ml-1">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-orange-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Entrar no Painel
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <div className="p-4 bg-slate-50 rounded-b-lg border-t border-slate-100 mt-2 text-center">
             <p className="text-[10px] text-slate-400 font-medium">© 2026 Saúde & Sabor · Gestão Operacional</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
