import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cors from "cors";

import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path configuration for persistence (e.g., for Coolify/Docker volumes)
const dbPath = process.env.DATABASE_PATH || "saude_sabor.db";
const dbDir = path.dirname(dbPath);

if (dbDir !== "." && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT CHECK(unit IN ('KG', 'UN', 'PC')) NOT NULL,
    cost_price REAL NOT NULL,
    selling_price REAL,
    current_stock REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER,
    quantity REAL NOT NULL,
    total_cost REAL NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(inventory_id) REFERENCES inventory(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    total_value REAL NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER UNIQUE,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    estimated_time TEXT,
    delivery_fee REAL DEFAULT 0,
    notes TEXT,
    tracking_link TEXT,
    FOREIGN KEY(sale_id) REFERENCES sales(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Migration and Seed
try {
  // Check if we need to migrate from inventory_new to inventory if it somehow got stuck
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_new'").get();
  if (tableCheck) {
    db.exec(`
      INSERT OR IGNORE INTO inventory SELECT * FROM inventory_new;
      DROP TABLE inventory_new;
    `);
  }
} catch (e) {
  console.log("Migration skipped or failed:", e);
}

// Initial Admin Settings
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("admin_username", "saudeesabor");
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("admin_password", "saude2026");
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("app_logo", "");

// Seed default categories
const ensureCategory = (name: string, type: string) => {
  db.prepare("INSERT OR IGNORE INTO categories (name, type) VALUES (?, ?)").run(name, type);
};

const inventoryCategories = ['CARNES', 'LEGUMES', 'EMBALAGENS', 'OUTROS'];
const expenseCategories = ['MOTOTAXI', 'ALUGUEL', 'LUZ', 'AGUA', 'PERDA', 'OUTROS'];

inventoryCategories.forEach(c => ensureCategory(c, 'INVENTORY'));
expenseCategories.forEach(c => ensureCategory(c, 'EXPENSE'));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  
  // Settings & Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const dbUser = db.prepare("SELECT value FROM settings WHERE key = 'admin_username'").get() as any;
    const dbPass = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get() as any;

    if (dbUser && dbPass && username === dbUser.value && password === dbPass.value) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Usuário ou senha incorretos." });
    }
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = (settings as any[]).reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/settings", (req, res) => {
    const { admin_username, admin_password, app_logo } = req.body;
    const transaction = db.transaction(() => {
      if (admin_username) {
        db.prepare("UPDATE settings SET value = ? WHERE key = 'admin_username'").run(admin_username);
      }
      if (admin_password) {
        db.prepare("UPDATE settings SET value = ? WHERE key = 'admin_password'").run(admin_password);
      }
      if (app_logo !== undefined) {
        const existing = db.prepare("SELECT key FROM settings WHERE key = 'app_logo'").get();
        if (existing) {
          db.prepare("UPDATE settings SET value = ? WHERE key = 'app_logo'").run(app_logo);
        } else {
          db.prepare("INSERT INTO settings (key, value) VALUES ('app_logo', ?)").run(app_logo);
        }
      }
    });
    transaction();
    res.json({ success: true });
  });

  // Categories
  app.get("/api/categories", (req, res) => {
    const items = db.prepare("SELECT * FROM categories").all();
    res.json(items);
  });

  app.post("/api/categories", (req, res) => {
    const { name, type } = req.body;
    try {
      const info = db.prepare("INSERT INTO categories (name, type) VALUES (?, ?)")
        .run(name, type);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      if (e.message.includes('UNIQUE')) {
        return res.status(400).json({ error: "Categoria já existe" });
      }
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/categories/:id", (req, res) => {
    const { name } = req.body;
    db.prepare("UPDATE categories SET name = ? WHERE id = ?")
      .run(name, req.params.id);
    res.json({ success: true });
  });

  // Inventory
  app.get("/api/inventory", (req, res) => {
    const items = db.prepare("SELECT * FROM inventory").all();
    res.json(items);
  });

  app.post("/api/inventory", (req, res) => {
    const { name, category, unit, cost_price, selling_price, current_stock } = req.body;
    const info = db.prepare(
      "INSERT INTO inventory (name, category, unit, cost_price, selling_price, current_stock) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(name, category, unit, cost_price, selling_price, current_stock || 0);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch("/api/inventory/:id", (req, res) => {
    const { name, category, unit, cost_price, selling_price, current_stock } = req.body;
    db.prepare("UPDATE inventory SET name = ?, category = ?, unit = ?, cost_price = ?, selling_price = ?, current_stock = ? WHERE id = ?")
      .run(name, category, unit, cost_price, selling_price, current_stock, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/inventory/:id/purchases", (req, res) => {
    const items = db.prepare(`
      SELECT * FROM purchases 
      WHERE inventory_id = ? 
      ORDER BY date DESC
    `).all(req.params.id);
    res.json(items);
  });

  // Purchases
  app.get("/api/purchases", (req, res) => {
    const items = db.prepare(`
      SELECT p.*, i.name as item_name 
      FROM purchases p 
      JOIN inventory i ON p.inventory_id = i.id
      ORDER BY date DESC
    `).all();
    res.json(items);
  });

  app.post("/api/purchases", (req, res) => {
    const { inventory_id, quantity, total_cost } = req.body;
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO purchases (inventory_id, quantity, total_cost) VALUES (?, ?, ?)")
        .run(inventory_id, quantity, total_cost);
      db.prepare("UPDATE inventory SET current_stock = current_stock + ? WHERE id = ?")
        .run(quantity, inventory_id);
    });
    transaction();
    res.json({ success: true });
  });

  // Sales
  app.get("/api/sales", (req, res) => {
    const items = db.prepare("SELECT * FROM sales ORDER BY date DESC").all();
    res.json(items);
  });

  app.post("/api/sales", (req, res) => {
    const { description, total_value, delivery, items } = req.body;
    const transaction = db.transaction(() => {
      const info = db.prepare("INSERT INTO sales (description, total_value) VALUES (?, ?)")
        .run(description, total_value);
      const saleId = info.lastInsertRowid;

      let totalCost = 0;

      // Se houver itens, calcula o custo e reduz estoque
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const invItem = db.prepare("SELECT cost_price FROM inventory WHERE id = ?").get(item.inventory_id) as any;
          if (invItem) {
            totalCost += invItem.cost_price * item.quantity;
            db.prepare("UPDATE inventory SET current_stock = current_stock - ? WHERE id = ?")
              .run(item.quantity, item.inventory_id);
          }
        }
      }

      // Calcula custo total incluindo entrega
      const deliveryFee = (delivery && delivery.delivery_fee) ? Number(delivery.delivery_fee) : 0;
      const totalOutflow = totalCost + deliveryFee;

      // Se o valor total da venda for menor que o custo total, registra como perda
      if (total_value < totalOutflow) {
        const loss = totalOutflow - total_value;
        db.prepare("INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)")
          .run(`Prejuízo Operacional Pedido #${saleId}`, loss, 'PERDA', new Date().toISOString());
      }

      if (delivery) {
        db.prepare(
          "INSERT INTO deliveries (sale_id, address, estimated_time, delivery_fee, notes, tracking_link) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(
          saleId, 
          delivery.address, 
          delivery.estimated_time, 
          delivery.delivery_fee || 0,
          delivery.notes || null,
          delivery.tracking_link || null
        );
        
        // Registrar o gasto do mototáxi automaticamente se houver entrega
        if (delivery.delivery_fee && delivery.delivery_fee > 0) {
          db.prepare("INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)")
            .run(`Entrega Automática Pedido #${saleId}`, delivery.delivery_fee, 'MOTOTAXI', new Date().toISOString());
        }
      }
      return saleId;
    });
    const id = transaction();
    res.json({ id });
  });

  // Logística/Entregas
  app.get("/api/deliveries", (req, res) => {
    const items = db.prepare(`
      SELECT d.*, s.description as sale_description, s.total_value as sale_value, s.date as sale_date
      FROM deliveries d
      JOIN sales s ON d.sale_id = s.id
      ORDER BY s.date DESC
    `).all();
    res.json(items);
  });

  app.patch("/api/deliveries/:id", (req, res) => {
    const { status, notes, tracking_link } = req.body;
    
    if (status !== undefined) {
      db.prepare("UPDATE deliveries SET status = ? WHERE id = ?")
        .run(status, req.params.id);
    }
    
    if (notes !== undefined) {
      db.prepare("UPDATE deliveries SET notes = ? WHERE id = ?")
        .run(notes, req.params.id);
    }

    if (tracking_link !== undefined) {
      db.prepare("UPDATE deliveries SET tracking_link = ? WHERE id = ?")
        .run(tracking_link, req.params.id);
    }

    res.json({ success: true });
  });

  // Expenses
  app.get("/api/expenses", (req, res) => {
    const items = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
    res.json(items);
  });

  app.post("/api/expenses", (req, res) => {
    const { description, amount, category } = req.body;
    const info = db.prepare("INSERT INTO expenses (description, amount, category) VALUES (?, ?, ?)")
      .run(description, amount, category);
    res.json({ id: info.lastInsertRowid });
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const totalSales = db.prepare("SELECT SUM(total_value) as total FROM sales").get() as any;
    const totalExpenses = db.prepare("SELECT SUM(amount) as total FROM expenses").get() as any;
    const totalPurchases = db.prepare("SELECT SUM(total_cost) as total FROM purchases").get() as any;
    const mototaxiCount = db.prepare("SELECT COUNT(*) as count FROM expenses WHERE category = 'MOTOTAXI'").get() as any;
    const mototaxiTotal = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE category = 'MOTOTAXI'").get() as any;

    // Histórico de vendas dos últimos 7 dias
    const history = db.prepare(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-6 days')
        UNION ALL
        SELECT date(date, '+1 day') FROM dates WHERE date < date('now')
      )
      SELECT 
        strftime('%d/%m', d.date) as name,
        COALESCE(SUM(s.total_value), 0) as valor
      FROM dates d
      LEFT JOIN sales s ON date(s.date) = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `).all();

    res.json({
      sales: totalSales.total || 0,
      expenses: (totalExpenses.total || 0) + (totalPurchases.total || 0),
      profit: (totalSales.total || 0) - ((totalExpenses.total || 0) + (totalPurchases.total || 0)),
      mototaxis: {
        count: mototaxiCount.count || 0,
        total: mototaxiTotal.total || 0
      },
      history
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
