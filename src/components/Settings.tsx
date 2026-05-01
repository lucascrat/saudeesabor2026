import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Save, User, Lock, ShieldCheck } from "lucide-react";

export default function Settings() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        setUsername(data.admin_username || "");
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }

    setIsLoading(true);
    try {
      const payload: any = { admin_username: username };
      if (password) payload.admin_password = password;

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Configurações salvas com sucesso!");
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Erro ao salvar configurações.");
      }
    } catch (err) {
      toast.error("Erro de conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-500">Gerencie o acesso e segurança do sistema.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <div className="h-1.5 bg-sky-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Credenciais de Acesso</CardTitle>
                <CardDescription>Altere o usuário e a senha do administrador.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase text-slate-500">Usuário do Administrador</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pass" className="text-xs font-bold uppercase text-slate-500">Nova Senha (opcional)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="pass" 
                      type="password"
                      placeholder="Deixe em branco para não alterar" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-xs font-bold uppercase text-slate-500">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="confirm" 
                      type="password"
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase tracking-widest text-xs h-10 px-6 transition-all shadow-lg hover:shadow-sky-100"
                >
                  {isLoading ? "Salvando..." : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Salvar Alterações
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
