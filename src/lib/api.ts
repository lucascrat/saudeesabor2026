export interface Category {
  id: number;
  name: string;
  type: 'INVENTORY' | 'EXPENSE';
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  unit: 'KG' | 'UN' | 'PC';
  cost_price: number;
  selling_price: number | null;
  current_stock: number;
  created_at: string;
}

export interface Purchase {
  id: number;
  inventory_id: number;
  item_name: string;
  quantity: number;
  total_cost: number;
  date: string;
}

export interface Sale {
  id: number;
  description: string;
  total_value: number;
  date: string;
}

export interface Delivery {
  id: number;
  sale_id: number;
  address: string;
  status: 'PENDENTE' | 'A_CAMINHO' | 'ENTREGUE' | 'CANCELADO';
  estimated_time: string;
  delivery_fee: number;
  notes?: string;
  tracking_link?: string;
  sale_description?: string;
  sale_value?: number;
  sale_date?: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface Stats {
  sales: number;
  expenses: number;
  profit: number;
  mototaxis: {
    count: number;
    total: number;
  };
  history: { name: string; valor: number }[];
}

const API_BASE = "/api";

export const api = {
  categories: {
    list: () => fetch(`${API_BASE}/categories`).then(res => res.json()),
    create: (data: { name: string; type: 'INVENTORY' | 'EXPENSE' }) =>
      fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    update: (id: number, name: string) =>
      fetch(`${API_BASE}/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      }).then(res => res.json()),
    delete: (id: number) =>
      fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' }).then(res => res.json()),
  },
  inventory: {
    list: () => fetch(`${API_BASE}/inventory`).then(res => res.json()),
    create: (data: Partial<InventoryItem>) => 
      fetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    update: (id: number, data: Partial<InventoryItem>) =>
      fetch(`${API_BASE}/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    getHistory: (id: number): Promise<Purchase[]> =>
      fetch(`${API_BASE}/inventory/${id}/purchases`).then(res => res.json()),
  },
  purchases: {
    list: () => fetch(`${API_BASE}/purchases`).then(res => res.json()),
    create: (data: { inventory_id: number; quantity: number; total_cost: number }) =>
      fetch(`${API_BASE}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
  },
  sales: {
    list: () => fetch(`${API_BASE}/sales`).then(res => res.json()),
    create: (data: { 
      description: string; 
      total_value: number; 
      delivery?: Partial<Delivery>;
      items?: { inventory_id: number; quantity: number }[]
    }) =>
      fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
  },
  deliveries: {
    list: () => fetch(`${API_BASE}/deliveries`).then(res => res.json()),
    update: (id: number, data: Partial<Delivery>) =>
      fetch(`${API_BASE}/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
  },
  expenses: {
    list: () => fetch(`${API_BASE}/expenses`).then(res => res.json()),
    create: (data: { description: string; amount: number; category: string }) =>
      fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
  },
  stats: () => fetch(`${API_BASE}/stats`).then(res => res.json()),
};
