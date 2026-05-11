import React, { useEffect, useState } from "react";
import { api, Expense, Category } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Truck, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CategorySelector } from "./CategorySelector";

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("OUTROS");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [editCategory, setEditCategory] = useState<string>("OUTROS");
  const [mototaxiPrice, setMototaxiPrice] = useState<number>(7);

  const fetchExpenses = () => {
    api.expenses.list().then(data => {
      setExpenses(data);
      setLoading(false);
    });
  };

  const fetchCategories = () => {
    api.categories.list().then(data => {
      setCategories(data.filter(c => c.type === 'EXPENSE'));
    });
  };

  const fetchSettings = () => {
    api.settings.get().then(data => {
      const fee = Number(data.default_delivery_fee);
      if (!Number.isNaN(fee) && fee >= 0) setMototaxiPrice(fee);
    });
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchSettings();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      category: formData.get("category") as string,
    };

    await api.expenses.create(data);
    toast.success("Gasto registrado com sucesso!");
    fetchExpenses();
  };

  const handleMototaxi = async () => {
    await api.expenses.create({
      description: `Pedido Mototáxi ${new Date().toLocaleTimeString()}`,
      amount: mototaxiPrice,
      category: "MOTOTAXI"
    });
    toast.success(`Mototáxi solicitado e registrado (R$ ${mototaxiPrice.toFixed(2)})!`);
    fetchExpenses();
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setEditCategory(expense.category);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const formData = new FormData(e.currentTarget);
    await api.expenses.update(editing.id, {
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      category: editCategory,
    });
    toast.success("Gasto atualizado!");
    setEditing(null);
    fetchExpenses();
  };

  const handleDelete = async (expense: Expense) => {
    const ok = window.confirm(`Excluir o gasto "${expense.description}" (R$ ${expense.amount.toFixed(2)})?`);
    if (!ok) return;
    await api.expenses.delete(expense.id);
    toast.success("Gasto excluído.");
    fetchExpenses();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando gastos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Custos & Despesas</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100" onClick={handleMototaxi}>
            <Truck className="mr-2 h-4 w-4" /> Chamada Rápida Mototaxi (R$ {mototaxiPrice.toFixed(2)})
          </Button>

          <Dialog>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Registrar Gasto</Button>} />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Lançar Novo Gasto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" name="description" placeholder="Ex: Conta de Luz, Aluguel, Sacolas extras" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <CategorySelector
                      type="EXPENSE"
                      value={newCategory}
                      onValueChange={(val) => {
                        setNewCategory(val);
                        fetchCategories();
                      }}
                    />
                    <input type="hidden" name="category" value={newCategory} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" required />
                  </div>
                </div>
                <Button type="submit" className="w-full">Registrar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum gasto registrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(expense.date).toLocaleDateString()}<br/>
                    {new Date(expense.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {expense.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={expense.category === 'MOTOTAXI' ? "secondary" : "outline"}>
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    R$ {expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-sky-600" onClick={() => openEdit(expense)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-rose-600" onClick={() => handleDelete(expense)}>
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
            <DialogTitle>Editar Gasto</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Input id="edit-description" name="description" defaultValue={editing.description} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <CategorySelector
                    type="EXPENSE"
                    value={editCategory}
                    onValueChange={(val) => {
                      setEditCategory(val);
                      fetchCategories();
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Valor (R$)</Label>
                  <Input id="edit-amount" name="amount" type="number" step="0.01" defaultValue={editing.amount} required />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
