import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, User, Lock, ShieldCheck, DollarSign, Utensils, Bike } from "lucide-react";

export default function Settings() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [appLogo, setAppLogo] = useState("");
  const [marmitaPrice, setMarmitaPrice] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingValues, setIsSavingValues] = useState(false);

  const loadSettings = () => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        setUsername(data.admin_username || "");
        setAppLogo(data.app_logo || "");
        setMarmitaPrice(data.default_marmita_price || "25.00");
        setDeliveryFee(data.default_delivery_fee || "7.00");
      });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }

    setIsLoading(true);
    try {
      const payload: any = { admin_username: username, app_logo: appLogo };
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

  const handleSaveValues = async (e: React.FormEvent) => {
    e.preventDefault();

    const marmita = Number(marmitaPrice);
    const fee = Number(deliveryFee);

    if (Number.isNaN(marmita) || marmita < 0) {
      return toast.error("Valor da marmita inválido.");
    }
    if (Number.isNaN(fee) || fee < 0) {
      return toast.error("Taxa do mototáxi inválida.");
    }

    setIsSavingValues(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_marmita_price: marmita.toFixed(2),
          default_delivery_fee: fee.toFixed(2),
        }),
      });

      if (response.ok) {
        toast.success("Valores operacionais atualizados!");
        loadSettings();
      } else {
        toast.error("Erro ao salvar valores.");
      }
    } catch (err) {
      toast.error("Erro de conexão.");
    } finally {
      setIsSavingValues(false);
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

              <div className="space-y-2 mt-4">
                <Label htmlFor="appLogo" className="text-xs font-bold uppercase text-slate-500">URL da Logo na Tela de Login (Opcional)</Label>
                <div className="relative">
                  <Input 
                    id="appLogo" 
                    type="text"
                    placeholder="Ex: https://i.imgur.com/logo.png" 
                    value={appLogo} 
                    onChange={(e) => setAppLogo(e.target.value)}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
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

        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <div className="h-1.5 bg-emerald-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Valores Operacionais</CardTitle>
                <CardDescription>Defina os preços padrão usados em vendas rápidas e entregas.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveValues} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marmitaPrice" className="text-xs font-bold uppercase text-slate-500">Valor da Marmita Padrão (R$)</Label>
                  <div className="relative">
                    <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="marmitaPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="25.00"
                      value={marmitaPrice}
                      onChange={(e) => setMarmitaPrice(e.target.value)}
                      className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Usado no botão "+1 Marmita Padrão" da tela de Vendas.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryFee" className="text-xs font-bold uppercase text-slate-500">Taxa do Mototáxi (R$)</Label>
                  <div className="relative">
                    <Bike className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="deliveryFee"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="7.00"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Valor padrão sugerido ao agendar entrega em uma venda.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingValues}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs h-10 px-6 transition-all shadow-lg hover:shadow-emerald-100"
                >
                  {isSavingValues ? "Salvando..." : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Salvar Valores
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
