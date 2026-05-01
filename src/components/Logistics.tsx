import React, { useEffect, useState } from "react";
import { api, Delivery } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Truck, CheckCircle2, Clock, Package, ExternalLink, Info, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit2 } from "lucide-react";

export default function Logistics() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDENTE' | 'A_CAMINHO' | 'ENTREGUE' | 'CANCELADO'>('ALL');

  const fetchDeliveries = () => {
    api.deliveries.list().then(data => {
      setDeliveries(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleUpdate = async (id: number, data: Partial<Delivery>) => {
    await api.deliveries.update(id, data);
    if (data.status) toast.success(`Status atualizado para ${data.status}`);
    else toast.success("Entrega atualizada!");
    setEditingDelivery(null);
    fetchDeliveries();
  };

  const filteredDeliveries = statusFilter === 'ALL' 
    ? deliveries 
    : deliveries.filter(d => d.status === statusFilter);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Carregando logística...</div>;

  const statusColors = {
    'PENDENTE': 'bg-amber-100 text-amber-700',
    'A_CAMINHO': 'bg-blue-100 text-blue-700',
    'ENTREGUE': 'bg-emerald-100 text-emerald-700',
    'CANCELADO': 'bg-rose-100 text-rose-700'
  };

  const statusLabels = {
    'PENDENTE': 'Pendente',
    'A_CAMINHO': 'A Caminho',
    'ENTREGUE': 'Entregue',
    'CANCELADO': 'Cancelado'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Painel de Logística</h1>
          <p className="text-xs text-slate-500 font-medium">Acompanhamento de entregas e entregadores</p>
        </div>
      </div>

      {/* Edit Details Dialog */}
      <Dialog open={!!editingDelivery} onOpenChange={(open) => !open && setEditingDelivery(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-tight">Editar Entrega</DialogTitle>
          </DialogHeader>
          {editingDelivery && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdate(editingDelivery.id, {
                  notes: formData.get("notes") as string,
                  tracking_link: formData.get("tracking_link") as string
                });
              }}
              className="grid gap-4 py-4"
            >
              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Notas/Observações</Label>
                <Textarea 
                  name="notes" 
                  defaultValue={editingDelivery.notes} 
                  placeholder="Instruções de entrega, pontos de referência..."
                  className="bg-slate-50 border-slate-200 min-h-[100px]"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Link de Rastreamento</Label>
                <Input 
                  name="tracking_link" 
                  defaultValue={editingDelivery.tracking_link} 
                  placeholder="https://g.page/..."
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-10 font-bold uppercase tracking-widest text-[10px]">Salvar Detalhes</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
           <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-amber-50 p-2 rounded-lg text-amber-600"><Clock className="h-5 w-5" /></div>
              <div>
                 <p className="text-[10px] uppercase font-bold text-slate-400">Pendentes</p>
                 <p className="text-xl font-bold">{deliveries.filter(d => d.status === 'PENDENTE').length}</p>
              </div>
           </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
           <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Truck className="h-5 w-5" /></div>
              <div>
                 <p className="text-[10px] uppercase font-bold text-slate-400">Em Rota</p>
                 <p className="text-xl font-bold">{deliveries.filter(d => d.status === 'A_CAMINHO').length}</p>
              </div>
           </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
           <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                 <p className="text-[10px] uppercase font-bold text-slate-400">Entregues</p>
                 <p className="text-xl font-bold">{deliveries.filter(d => d.status === 'ENTREGUE').length}</p>
              </div>
           </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
           <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-600"><Package className="h-5 w-5" /></div>
              <div>
                 <p className="text-[10px] uppercase font-bold text-slate-400">Total Hoje</p>
                 <p className="text-xl font-bold">{deliveries.length}</p>
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">📍 Rastreamento de Pedidos</h3>
          
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'PENDENTE', label: 'Pendentes' },
              { id: 'A_CAMINHO', label: 'Em Rota' },
              { id: 'ENTREGUE', label: 'Entregues' },
              { id: 'CANCELADO', label: 'Cancelados' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`text-[9px] font-bold uppercase px-3 py-1.5 rounded-full transition-all ${
                  statusFilter === f.id 
                    ? 'bg-slate-800 text-white shadow-sm ring-2 ring-slate-800 ring-offset-1' 
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500">Horário</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500">Venda</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500">Endereço & Rastreio</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500">Observações</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500">Taxa Entrega</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500">Tempo Est.</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-medium italic">
                  {statusFilter === 'ALL' 
                    ? 'Nenhuma entrega ativa no momento.' 
                    : `Nenhuma entrega com status "${statusLabels[statusFilter]}" encontrada.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                  <TableCell className="text-xs font-mono text-slate-500">
                    {delivery.sale_date ? new Date(delivery.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">#{delivery.sale_id}</span>
                        <span className="font-semibold text-sm text-slate-800 line-clamp-1">{delivery.sale_description}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600">R$ {delivery.sale_value?.toFixed(2) || '0.00'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {delivery.address}
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-2.5 w-2.5" /> Abrir Mapa
                        </a>
                        {delivery.tracking_link && (
                          <a 
                            href={delivery.tracking_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[9px] font-bold text-amber-600 hover:underline flex items-center gap-0.5"
                          >
                            <Truck className="h-2.5 w-2.5" /> Rastrear Motoboy
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {delivery.notes ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded cursor-help">
                              <Info className="h-3 w-3" /> Ver Obs.
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 text-white border-none p-2 shadow-xl max-w-[200px]">
                            <p className="text-xs">{delivery.notes}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-[10px] text-slate-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-amber-600 font-mono">
                    R$ {delivery.delivery_fee?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-500">
                    {delivery.estimated_time || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={delivery.status} 
                      onValueChange={(val) => handleUpdate(delivery.id, { status: val as any })}
                    >
                      <SelectTrigger className={`h-7 text-[10px] font-bold uppercase border-none shadow-none focus:ring-0 ${statusColors[delivery.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDENTE" className="text-[10px] font-bold uppercase">Pendente</SelectItem>
                        <SelectItem value="A_CAMINHO" className="text-[10px] font-bold uppercase">A Caminho</SelectItem>
                        <SelectItem value="ENTREGUE" className="text-[10px] font-bold uppercase">Entregue</SelectItem>
                        <SelectItem value="CANCELADO" className="text-[10px] font-bold uppercase text-rose-600">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1 px-4 py-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-slate-400 hover:text-emerald-600"
                      onClick={() => setEditingDelivery(delivery)}
                      title="Editar Notas"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-slate-400 hover:text-blue-600"
                      onClick={() => fetchDeliveries()}
                      title="Atualizar"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
