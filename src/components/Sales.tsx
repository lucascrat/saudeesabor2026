import React, { useEffect, useState } from "react";
import { api, Sale, InventoryItem } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [withDelivery, setWithDelivery] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [marmitaPrice, setMarmitaPrice] = useState<number>(25);
  const [deliveryFee, setDeliveryFee] = useState<number>(7);
  const [editing, setEditing] = useState<Sale | null>(null);

  // Selected items for new sale
  const [selectedItems, setSelectedItems] = useState<{ inventory_id: number; quantity: number; name: string; cost: number }[]>([]);
  const [newItemId, setNewItemId] = useState<string>("");
  const [newItemQty, setNewItemQty] = useState<number>(1);

  const fetchSales = () => {
    api.sales.list().then(data => {
      setSales(data);
      setLoading(false);
    });
  };

  const fetchInventory = () => {
    api.inventory.list().then(data => setInventory(data));
  };

  const fetchSettings = () => {
    api.settings.get().then(data => {
      const marmita = Number(data.default_marmita_price);
      const fee = Number(data.default_delivery_fee);
      if (!Number.isNaN(marmita) && marmita > 0) setMarmitaPrice(marmita);
      if (!Number.isNaN(fee) && fee >= 0) setDeliveryFee(fee);
    });
  };

  useEffect(() => {
    fetchSales();
    fetchInventory();
    fetchSettings();
  }, []);

  const addItemToSale = () => {
    if (!newItemId) return;
    const invItem = inventory.find(i => i.id === Number(newItemId));
    if (!invItem) return;

    setSelectedItems([...selectedItems, {
      inventory_id: invItem.id,
      quantity: newItemQty,
      name: invItem.name,
      cost: invItem.cost_price
    }]);
    setNewItemId("");
    setNewItemQty(1);
  };

  const removeItemFromSale = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const totalCostOfSelected = selectedItems.reduce((acc, curr) => acc + (curr.cost * curr.quantity), 0);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const hasDelivery = formData.get("has_delivery") === "on";
    const total_value = Number(formData.get("total_value"));
    
    const data = {
      description: formData.get("description") as string,
      total_value,
      items: selectedItems.map(i => ({ inventory_id: i.inventory_id, quantity: i.quantity })),
      delivery: hasDelivery ? {
        address: formData.get("address") as string,
        estimated_time: formData.get("estimated_time") as string,
        delivery_fee: Number(formData.get("delivery_fee") || deliveryFee),
        notes: formData.get("notes") as string,
        tracking_link: formData.get("tracking_link") as string
      } : undefined
    };

    await api.sales.create(data);
    
    let successMsg = hasDelivery 
      ? `Venda registrada! Entrega agendada (R$ ${data.delivery?.delivery_fee?.toFixed(2)}).` 
      : "Venda registrada com sucesso!";

    if (total_value < totalCostOfSelected) {
      const loss = totalCostOfSelected - total_value;
      successMsg += ` Notificado perda de R$ ${loss.toFixed(2)} lançada em PERDA.`;
    }

    toast.success(successMsg);
    setWithDelivery(false);
    setSelectedItems([]);
    fetchSales();
  };

  const quickSale = async (desc: string, value: number) => {
    await api.sales.create({ description: desc, total_value: value });
    toast.success(`Venda de ${desc} registrada!`);
    fetchSales();
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const formData = new FormData(e.currentTarget);
    await api.sales.update(editing.id, {
      description: formData.get("description") as string,
      total_value: Number(formData.get("total_value")),
    });
    toast.success("Venda atualizada!");
    setEditing(null);
    fetchSales();
  };

  const handleDelete = async (sale: Sale) => {
    const ok = window.confirm(
      `Excluir a venda #${sale.id} (${sale.description})?\n\nAtenção: o estoque deduzido não será restaurado.`
    );
    if (!ok) return;
    await api.sales.delete(sale.id);
    toast.success(`Venda #${sale.id} excluída.`);
    fetchSales();
  };

  const filteredSales = sales.filter(sale => 
    sale.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id.toString().includes(searchTerm)
  );

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Carregando registro de vendas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold tracking-tight text-slate-800">Gestão de Vendas</h1>
           <p className="text-xs text-slate-500 font-medium">Acompanhamento em tempo real dos pedidos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 shadow-sm" onClick={() => quickSale("Marmita Padrão", marmitaPrice)}>
            <Plus className="mr-2 h-4 w-4" /> +1 Marmita Padrão (R$ {marmitaPrice.toFixed(2)})
          </Button>

          <Dialog>
            <DialogTrigger
              render={
                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                  <Plus className="mr-1 h-4 w-4" /> Registrar Venda
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-tight">Nova Venda Manual</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-[10px] font-bold uppercase text-slate-500">Descrição do Pedido</Label>
                  <Input id="description" name="description" placeholder="Ex: 3 Marmitas + Suco" className="bg-slate-50 border-slate-200" required />
                </div>

                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Itens / Insumos Vendidos</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select value={newItemId} onValueChange={setNewItemId}>
                        <SelectTrigger className="bg-white text-xs h-9">
                          <SelectValue placeholder="Selecione o Insumo" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map(item => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name} (R$ {item.cost_price.toFixed(2)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={newItemQty} 
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-20 bg-white h-9 text-xs"
                      placeholder="Qtd"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={addItemToSale} className="h-9 border-emerald-200 text-emerald-700">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-slate-100 text-[11px]">
                          <span className="font-semibold text-slate-700">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono">{item.quantity} x R$ {item.cost.toFixed(2)}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-rose-500" onClick={() => removeItemFromSale(idx)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-200">
                        <span className="font-bold text-slate-500 uppercase">Custo Total:</span>
                        <span className="font-mono font-bold text-slate-700">R$ {totalCostOfSelected.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="total_value" className="text-[10px] font-bold uppercase text-slate-500">Valor Total Recebido (R$)</Label>
                  <Input id="total_value" name="total_value" type="number" step="0.01" className="bg-slate-50 border-slate-200" required />
                </div>

                <div className="flex items-center space-x-2 py-1">
                  <input 
                    type="checkbox" 
                    id="has_delivery" 
                    name="has_delivery" 
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" 
                    onChange={(e) => setWithDelivery(e.target.checked)}
                  />
                  <Label htmlFor="has_delivery" className="text-xs font-semibold text-slate-700">Agendar Entrega?</Label>
                </div>

                {withDelivery && (
                  <div className="space-y-3 p-3 bg-white rounded-lg border border-slate-200 shadow-inner">
                    <div className="grid gap-1">
                      <Label htmlFor="address" className="text-[10px] font-bold uppercase text-slate-500">Endereço Completo</Label>
                      <Input id="address" name="address" placeholder="Rua, Número, Bairro" className="h-8 text-xs" required={withDelivery} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label htmlFor="estimated_time" className="text-[10px] font-bold uppercase text-slate-500">Tempo Est.</Label>
                        <Input id="estimated_time" name="estimated_time" placeholder="30-40 min" className="h-8 text-xs" />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="delivery_fee" className="text-[10px] font-bold uppercase text-slate-500">Taxa Motoboy</Label>
                        <Input id="delivery_fee" name="delivery_fee" type="number" step="0.01" defaultValue={deliveryFee.toFixed(2)} className="h-8 text-xs" />
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 font-bold uppercase tracking-widest text-[10px] mt-2">Confirmar Lançamento</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="relative w-full md:w-96">
          <Input 
            placeholder="Buscar vendas por descrição ou ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 bg-slate-50 border-slate-200 text-xs pl-4"
          />
        </div>
        <div className="text-[10px] items-center gap-1.5 hidden md:flex font-bold uppercase tracking-widest text-slate-400">
           <div className="h-2 w-2 rounded-full bg-emerald-500"></div> Total: {filteredSales.length} registros
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">📅 Histórico de Pedidos Hoje</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3">ID</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3">Horário</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3">Pedido</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3 text-right">Valor Total</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3 text-right w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-medium italic">
                  {searchTerm ? "Nenhuma venda encontrada para esta busca." : "Nenhuma venda registrada na sessão atual."}
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                  <TableCell className="text-slate-400 text-[10px] font-mono px-4 py-3">
                    #{sale.id}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs font-mono px-4 py-3">
                    {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 text-sm px-4 py-3 underline decoration-emerald-200 underline-offset-4">
                    {sale.description}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600 px-4 py-3">
                    R$ {sale.total_value.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-sky-600" onClick={() => setEditing(sale)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-rose-600" onClick={() => handleDelete(sale)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Venda #{editing?.id}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-description" className="text-[10px] font-bold uppercase text-slate-500">Descrição</Label>
                <Input id="edit-description" name="description" defaultValue={editing.description} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-total" className="text-[10px] font-bold uppercase text-slate-500">Valor Total (R$)</Label>
                <Input id="edit-total" name="total_value" type="number" step="0.01" defaultValue={editing.total_value} required />
              </div>
              <p className="text-[10px] text-slate-400 italic">A edição altera apenas descrição e valor — o estoque já deduzido não é recalculado.</p>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
