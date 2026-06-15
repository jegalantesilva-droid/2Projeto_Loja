-- Zephyr Financial Portal Schema
-- Copy and paste into Supabase SQL Editor (supabase.com > Project > SQL Editor > New Query)

-- Table: entries (daily transaction records)
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  pix_y NUMERIC DEFAULT 0,
  cc_y NUMERIC DEFAULT 0,
  pix_cnpj NUMERIC DEFAULT 0,
  vliq NUMERIC DEFAULT 0,
  custos NUMERIC DEFAULT 0,
  estorno NUMERIC DEFAULT 0,
  gasto NUMERIC DEFAULT 0,
  pedidos INTEGER DEFAULT 0,
  pecas INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on entries
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Anyone can read, anyone can insert/update/delete for now (later: add auth)
CREATE POLICY "Allow all on entries" ON entries
  FOR ALL USING (true) WITH CHECK (true);

-- Table: config (tax rates, goals, thresholds)
CREATE TABLE config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  yampi_rate NUMERIC DEFAULT 2.5,
  meta_rate NUMERIC DEFAULT 13.83,
  cpa_max NUMERIC DEFAULT 117.90,
  roas_alvo NUMERIC DEFAULT 1.5,
  margem_meta NUMERIC DEFAULT 20,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on config" ON config
  FOR ALL USING (true) WITH CHECK (true);

-- Table: despesas (monthly fixed expenses)
CREATE TABLE despesas (
  id TEXT PRIMARY KEY,
  mes TEXT NOT NULL, -- format: '2026-06'
  descricao TEXT NOT NULL,
  valor NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on despesas" ON despesas
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX idx_entries_date ON entries(date);
CREATE INDEX idx_entries_mes ON entries(date); -- for monthly rollups
CREATE INDEX idx_despesas_mes ON despesas(mes);

-- Insert default config
INSERT INTO config (id, yampi_rate, meta_rate, cpa_max, roas_alvo, margem_meta)
VALUES ('default', 2.5, 13.83, 117.90, 1.5, 20)
ON CONFLICT (id) DO NOTHING;

-- Optional: enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE entries;
ALTER PUBLICATION supabase_realtime ADD TABLE config;
ALTER PUBLICATION supabase_realtime ADD TABLE despesas;
