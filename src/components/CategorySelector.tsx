import React, { useEffect, useState } from "react";
import { api, Category } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";

interface CategorySelectorProps {
  type: 'INVENTORY' | 'EXPENSE';
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function CategorySelector({ type, value, onValueChange, className, placeholder }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const fetchCategories = () => {
    api.categories.list().then((data: Category[]) => {
      setCategories(data.filter(c => c.type === type));
    });
  };

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await api.categories.create({ name: newCategory.toUpperCase(), type });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Categoria adicionada!");
      setNewCategory("");
      setIsAdding(false);
      fetchCategories();
      onValueChange(newCategory.toUpperCase());
    } catch (e) {
      toast.error("Erro ao adicionar categoria");
    }
  };

  if (isAdding) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Input 
          size={1}
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Nova Categoria"
          className="h-8 text-[10px] uppercase font-bold"
          autoFocus
           onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCategory();
            }
            if (e.key === 'Escape') {
              setIsAdding(false);
            }
          }}
        />
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-emerald-600" 
          onClick={handleAddCategory}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-rose-600" 
          onClick={() => setIsAdding(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-xs">
          <SelectValue placeholder={placeholder || "Selecione..."} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.name} className="text-xs uppercase font-medium">
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        type="button" 
        size="icon" 
        variant="outline" 
        className="h-9 w-9 shrink-0 border-slate-200" 
        onClick={() => setIsAdding(true)}
        title="Nova Categoria"
      >
        <Plus className="h-4 w-4 text-slate-400" />
      </Button>
    </div>
  );
}
