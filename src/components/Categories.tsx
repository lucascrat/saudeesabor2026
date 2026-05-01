import React, { useEffect, useState } from "react";
import { api, Category } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Plus, Tag, Trash2, Edit2, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { toast } from "sonner";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = () => {
    setLoading(true);
    api.categories.list().then(data => {
      setCategories(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: (formData.get("name") as string).toUpperCase(),
      type: formData.get("type") as 'INVENTORY' | 'EXPENSE'
    };

    try {
      const res = await api.categories.create(data);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Categoria criada com sucesso!");
      setIsCreateOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error("Erro ao criar categoria");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).toUpperCase();

    try {
      await api.categories.update(editingCategory.id, name);
      toast.success("Categoria atualizada!");
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error("Erro ao atualizar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    try {
      await api.categories.delete(id);
      toast.success("Categoria excluída");
      fetchCategories();
    } catch (err) {
      toast.error("Erro ao excluir");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Carregando categorias...</div>;

  const inventoryCats = categories.filter(c => c.type === 'INVENTORY');
  const expenseCats = categories.filter(c => c.type === 'EXPENSE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-600" /> CATEGORIAS
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Gerencie as classificações de produtos e despesas.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 font-bold uppercase tracking-widest text-[10px] h-10 px-6"><Plus className="mr-2 h-4 w-4" /> Nova Categoria</Button>} />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-tight">Criar Nova Categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase text-slate-500">Nome da Categoria</Label>
                <Input id="name" name="name" placeholder="Ex: BEBIDAS, LIMPEZA..." className="bg-slate-50 border-slate-200" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type" className="text-[10px] font-bold uppercase text-slate-500">Tipo</Label>
                <Select name="type" defaultValue="INVENTORY">
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVENTORY">Estoque (Insumos/Produtos)</SelectItem>
                    <SelectItem value="EXPENSE">Despesas (Gastos Fixos/Var.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-10 font-bold uppercase tracking-widest text-[10px]">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-tight">Editar Categoria</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Nome da Categoria</Label>
                <Input name="name" defaultValue={editingCategory.name} className="bg-slate-50 border-slate-200" required autoFocus />
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-10 font-bold uppercase tracking-widest text-[10px]">Salvar Alterações</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Categorias de Estoque</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {inventoryCats.map(cat => (
                  <TableRow key={cat.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-xs text-slate-700 uppercase py-3">{cat.name}</TableCell>
                    <TableCell className="text-right py-3 flex justify-end gap-1 px-4">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => setEditingCategory(cat)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Categorias de Despesas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {expenseCats.map(cat => (
                  <TableRow key={cat.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-xs text-slate-700 uppercase py-3">{cat.name}</TableCell>
                    <TableCell className="text-right py-3 flex justify-end gap-1 px-4">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => setEditingCategory(cat)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
