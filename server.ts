import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const app = express();
const PORT = 3000;
const db = new Database("ledger.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS archives (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    data TEXT
  );
  
  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    date TEXT,
    revenue REAL,
    coupons REAL,
    debitNote TEXT,
    invoices REAL,
    creditNote TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

app.use(express.json());

// API Routes
app.get("/api/entries", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM entries ORDER BY date ASC").all();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

app.post("/api/entries", (req, res) => {
  try {
    const entries = req.body; // Expecting an array of entries
    const upsert = db.prepare(`
      INSERT INTO entries (id, date, revenue, coupons, debitNote, invoices, creditNote)
      VALUES (@id, @date, @revenue, @coupons, @debitNote, @invoices, @creditNote)
      ON CONFLICT(id) DO UPDATE SET
        date = excluded.date,
        revenue = excluded.revenue,
        coupons = excluded.coupons,
        debitNote = excluded.debitNote,
        invoices = excluded.invoices,
        creditNote = excluded.creditNote
    `);

    const transaction = db.transaction((entries) => {
      for (const entry of entries) {
        upsert.run(entry);
      }
    });

    transaction(entries);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save entries" });
  }
});

app.delete("/api/entries", (req, res) => {
  try {
    console.log("DELETE /api/entries called");
    db.prepare("DELETE FROM entries").run();
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/entries error:", error);
    res.status(500).json({ error: "Failed to clear entries" });
  }
});

app.get("/api/settings", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM settings").all();
    const settings = rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.post("/api/settings", (req, res) => {
  try {
    const { key, value } = req.body;
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

app.get("/api/archives", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM archives ORDER BY created_at DESC").all();
    res.json(rows.map(row => ({
      ...row,
      data: JSON.parse(row.data as string)
    })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch archives" });
  }
});

app.post("/api/archives", (req, res) => {
  try {
    const { id, name, data } = req.body;
    const stmt = db.prepare("INSERT INTO archives (id, name, data) VALUES (?, ?, ?)");
    stmt.run(id, name, JSON.stringify(data));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save archive" });
  }
});

app.delete("/api/archives/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM archives WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete archive" });
  }
});

async function startServer() {
  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
