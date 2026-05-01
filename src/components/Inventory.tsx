import React, { useEffect, useState } from "react";
import { api, InventoryItem, Category, Purchase } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Plus, Package, ShoppingCart, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { CategorySelector } from "./CategorySelector";

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // States for Purchase Form auto-calculation
  const [purchaseQty, setPurchaseQty] = useState<number>(0);
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState<number>(0);
  const [totalPurchaseCost, setTotalPurchaseCost] = useState<number>(0);

  // New state for forms
  const [newCategory, setNewCategory] = useState("OUTROS");
  const [editCategory, setEditCategory] = useState("");

  const fetchItems = () => {
    api.inventory.list().then(data => {
      setItems(data);
      setLoading(false);
    });
  };

  const fetchCategories = () => {
    api.categories.list().then(data => {
      setCategories(data.filter(c => c.type === 'INVENTORY'));
    });
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setEditCategory(editingItem.category);
    }
  }, [editingItem]);

  useEffect(() => {
    if (historyItem) {
      setHistoryLoading(true);
      api.inventory.getHistory(historyItem.id)
        .then(data => {
          setPurchaseHistory(data);
          setHistoryLoading(false);
        })
        .catch(() => {
          toast.error("Erro ao carregar histórico");
          setHistoryLoading(false);
        });
    }
  }, [historyItem]);

  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || (
      statusFilter === "ESTAVEL" ? item.current_stock > 10 : item.current_stock <= 10
    );
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      category: formData.get("category") as any,
      unit: formData.get("unit") as any,
      cost_price: Number(formData.get("cost_price")),
      selling_price: Number(formData.get("selling_price")),
      current_stock: Number(formData.get("current_stock")),
    };

    await api.inventory.create(data);
    toast.success("Item adicionado com sucesso!");
    fetchItems();
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      category: formData.get("category") as any,
      unit: formData.get("unit") as any,
      cost_price: Number(formData.get("cost_price")),
      selling_price: Number(formData.get("selling_price")),
      current_stock: Number(formData.get("current_stock")),
    };

    await api.inventory.update(editingItem.id, data);
    toast.success("Item atualizado com sucesso!");
    setEditingItem(null);
    fetchItems();
  };

  const handleAddPurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      inventory_id: Number(formData.get("inventory_id")),
      quantity: Number(formData.get("quantity")),
      total_cost: Number(formData.get("total_cost")),
    };

    await api.purchases.create(data);
    toast.success("Compra Registrada!");
    fetchItems();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando estoque...</div>;

  return (
    <div className="space-y-6">
      {/* Edit Dialog - Managed by state */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-tight">Editar Produto</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase text-slate-500">Nome do Produto</Label>
                <Input id="name" name="name" defaultValue={editingItem.name} className="bg-slate-50 border-slate-200" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-[10px] font-bold uppercase text-slate-500">Categoria</Label>
                  <CategorySelector 
                    type="INVENTORY" 
                    value={editCategory} 
                    onValueChange={(val) => {
                      setEditCategory(val);
                      fetchCategories();
                    }} 
                  />
                  <input type="hidden" name="category" value={editCategory} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit" className="text-[10px] font-bold uppercase text-slate-500">Unidade</Label>
                  <Select name="unit" defaultValue={editingItem.unit}>
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">Kg</SelectItem>
                      <SelectItem value="UN">Unidade</SelectItem>
                      <SelectItem value="PC">Pacote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cost_price" className="text-[10px] font-bold uppercase text-slate-500">Preço de Custo</Label>
                  <Input id="cost_price" name="cost_price" type="number" step="0.01" defaultValue={editingItem.cost_price} className="bg-slate-50 border-slate-200" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="selling_price" className="text-[10px] font-bold uppercase text-slate-500">Preço de Venda</Label>
                  <Input id="selling_price" name="selling_price" type="number" step="0.01" defaultValue={editingItem.selling_price || 0} className="bg-slate-50 border-slate-200" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current_stock" className="text-[10px] font-bold uppercase text-slate-500">Estoque Atual</Label>
                <Input id="current_stock" name="current_stock" type="number" step="0.01" defaultValue={editingItem.current_stock} className="bg-slate-50 border-slate-200" />
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-10 font-bold uppercase tracking-widest text-[10px]">Salvar Alterações</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyItem} onOpenChange={(open) => !open && setHistoryItem(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-600" /> Histórico de Preços: {historyItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {historyLoading ? (
              <div className="p-8 text-center text-slate-400 animate-pulse text-xs font-bold uppercase">Buscando histórico...</div>
            ) : purchaseHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">Nenhuma compra registrada para este item.</div>
            ) : (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[9px] font-bold uppercase px-3 py-2">Data</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase px-3 py-2 text-right">Qtd</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase px-3 py-2 text-right">Custo Unit.</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase px-3 py-2 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseHistory.map((p) => (
                      <TableRow key={p.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-[10px] text-slate-500 px-3 py-2">
                          {new Date(p.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-700 px-3 py-2 text-right font-mono">
                          {p.quantity}
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-emerald-600 px-3 py-2 text-right font-mono">
                          R$ {(p.total_cost / p.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-[10px] text-slate-500 px-3 py-2 text-right font-mono">
                          R$ {p.total_cost.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="mt-4 text-[9px] text-slate-400 italic text-center">Os preços são calculados com base no valor total dividido pela quantidade em cada registro de compra.</p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold tracking-tight text-slate-800">Controle de Insumos</h1>
           <p className="text-xs text-slate-500 font-medium">Gestão detalhada de compras e suprimentos</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                  <ShoppingCart className="mr-2 h-4 w-4 text-slate-400" /> Registrar Compra
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-tight">Nova Compra de Insumos</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPurchase} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="inventory_id" className="text-[10px] font-bold uppercase text-slate-500">Produto</Label>
                  <Select 
                    name="inventory_id" 
                    required 
                    onValueChange={(val) => {
                      const item = items.find(i => i.id.toString() === val);
                      if (item) {
                        setPurchaseUnitPrice(item.cost_price);
                        setTotalPurchaseCost(item.cost_price * purchaseQty);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-9">
                      <SelectValue placeholder="Selecione o item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id.toString()}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity" className="text-[10px] font-bold uppercase text-slate-500">Quantidade</Label>
                    <Input 
                      id="quantity" 
                      name="quantity" 
                      type="number" 
                      step="0.01" 
                      className="bg-slate-50 border-slate-200 h-9" 
                      required 
                      defaultValue={purchaseQty || ""}
                      onChange={(e) => {
                        const qty = Number(e.target.value);
                        setPurchaseQty(qty);
                        setTotalPurchaseCost(qty * purchaseUnitPrice);
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit_cost" className="text-[10px] font-bold uppercase text-slate-500">Custo Unitário (R$)</Label>
                    <Input 
                      id="unit_cost" 
                      type="number" 
                      step="0.01" 
                      value={purchaseUnitPrice || ""}
                      onChange={(e) => {
                        const price = Number(e.target.value);
                        setPurchaseUnitPrice(price);
                        setTotalPurchaseCost(purchaseQty * price);
                      }}
                      className="bg-slate-50 border-slate-200 h-9"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="total_cost" className="text-[10px] font-bold uppercase text-slate-500">Custo Total (R$)</Label>
                  <Input 
                    id="total_cost" 
                    name="total_cost" 
                    type="number" 
                    step="0.01" 
                    value={totalPurchaseCost.toFixed(2)} 
                    onChange={(e) => setTotalPurchaseCost(Number(e.target.value))}
                    className="bg-emerald-50 border-emerald-200 h-9 font-bold text-emerald-700" 
                    required 
                  />
                  <p className="text-[9px] text-slate-400 italic">Cálculo automático: Quantidade × Custo Unitário</p>
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-10 font-bold uppercase tracking-widest text-[10px]">Efetivar Compra</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger
              render={
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                  <Plus className="mr-1 h-4 w-4" /> Novo Item
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-tight">Cadastrar Novo Produto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase text-slate-500">Nome do Produto</Label>
                  <Input id="name" name="name" placeholder="Ex: Alcatra, Cenoura, Sacola G" className="bg-slate-50 border-slate-200" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-[10px] font-bold uppercase text-slate-500">Categoria</Label>
                  <CategorySelector 
                    type="INVENTORY" 
                    value={newCategory} 
                    onValueChange={(val) => {
                      setNewCategory(val);
                      fetchCategories();
                    }} 
                  />
                  <input type="hidden" name="category" value={newCategory} />
                </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit" className="text-[10px] font-bold uppercase text-slate-500">Unidade</Label>
                    <Select name="unit" defaultValue="KG">
                      <SelectTrigger className="bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KG">Kg</SelectItem>
                        <SelectItem value="UN">Unidade</SelectItem>
                        <SelectItem value="PC">Pacote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cost_price" className="text-[10px] font-bold uppercase text-slate-500">Preço de Custo</Label>
                    <Input id="cost_price" name="cost_price" type="number" step="0.01" className="bg-slate-50 border-slate-200" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="selling_price" className="text-[10px] font-bold uppercase text-slate-500">Preço de Venda</Label>
                    <Input id="selling_price" name="selling_price" type="number" step="0.01" className="bg-slate-50 border-slate-200" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="current_stock" className="text-[10px] font-bold uppercase text-slate-500">Estoque Inicial</Label>
                  <Input id="current_stock" name="current_stock" type="number" defaultValue="0" className="bg-slate-50 border-slate-200" />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-10 font-bold uppercase tracking-widest text-[10px]">Cadastrar Produto</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="grid gap-2 flex-1 min-w-[200px]">
          <Label className="text-[10px] font-bold uppercase text-slate-500">Buscar no Estoque</Label>
          <Input 
            placeholder="Pesquisar por nome ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 bg-slate-50 border-slate-200 text-xs"
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-[10px] font-bold uppercase text-slate-500">Filtrar por Categoria</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 h-9 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.name} className="uppercase font-medium text-[10px]">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-[10px] font-bold uppercase text-slate-500">Filtrar por Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="ESTAVEL">Estável</SelectItem>
              <SelectItem value="PEDIR">Pedir Agora</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {(categoryFilter !== "ALL" || statusFilter !== "ALL") && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] uppercase font-bold text-slate-400 hover:text-rose-500"
            onClick={() => { setCategoryFilter("ALL"); setStatusFilter("ALL"); }}
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">📊 Tabela de Disponibilidade</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3">Produto</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3">Categoria</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3">Estoque</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3">Custo Unit.</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3 text-emerald-600">Vlr. Total</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3">Venda Unit.</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 py-3 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-medium italic">
                  {items.length === 0 ? "Nenhum insumo cadastrado na base de dados." : "Nenhum item corresponde aos filtros selecionados."}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                  <TableCell className="font-semibold text-slate-800 text-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-slate-100 flex items-center justify-center">
                         <Package className="h-3 w-3 text-slate-500" />
                      </div>
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className="bg-slate-50 text-[10px] font-bold text-slate-500 border-slate-200">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={`text-xs font-bold font-mono ${item.current_stock < 10 ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100" : "text-slate-600"}`}>
                      {item.current_stock} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500 px-4 py-3">R$ {item.cost_price.toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-bold font-mono text-emerald-600 px-4 py-3">
                    R$ {(item.current_stock * item.cost_price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500 px-4 py-3">
                    {item.selling_price && item.selling_price > 0 ? (
                      `R$ ${item.selling_price.toFixed(2)}`
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Insumo</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${item.current_stock > 30 ? 'bg-emerald-100 text-emerald-700' : item.current_stock > 10 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {item.current_stock > 30 ? 'ESTÁVEL' : item.current_stock > 10 ? 'ALERTA' : 'CRÍTICO'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-4 py-3 flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                      title="Ver Histórico de Preços"
                      onClick={() => setHistoryItem(item)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                      title="Reposição Rápida (+10)"
                      onClick={async () => {
                        await api.purchases.create({ inventory_id: item.id, quantity: 10, total_cost: item.cost_price * 10 });
                        toast.success(`+10 ${item.unit} de ${item.name} registrados!`);
                        fetchItems();
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[10px] font-bold uppercase text-slate-400 hover:text-blue-600 h-8"
                      onClick={() => setEditingItem(item)}
                    >
                      Editar
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
