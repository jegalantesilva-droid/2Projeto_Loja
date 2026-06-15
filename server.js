// server.js — Zephyr Backend (Pure REST API — no Supabase SDK)
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Health
app.get('/', (req, res) => {
  res.json({ status: 'Zephyr backend online ✓', version: '1.0' });
});

// Helper: Supabase REST API call
const sb = async (table, method = 'GET', body = null, filter = '') => {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

// ENTRIES
app.get('/api/entries', async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    const data = await sb('entries', 'GET', null, 
      `date=gte.${mes}-01&date=lt.${mes}-32&order=date.asc`);
    res.json(data.map(e => ({
      id: e.id, date: e.date, pixY: e.pix_y, ccY: e.cc_y, pixCNPJ: e.pix_cnpj,
      vliq: e.vliq, custos: e.custos, estorno: e.estorno, gasto: e.gasto,
      pedidos: e.pedidos, pecas: e.pecas,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    const { id, date, pixY, ccY, pixCNPJ, vliq, custos, estorno, gasto, pedidos, pecas } = req.body;
    const data = await sb('entries', 'POST', {
      id, date, pix_y: pixY, cc_y: ccY, pix_cnpj: pixCNPJ,
      vliq, custos, estorno, gasto, pedidos, pecas,
    });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/entries/:id', async (req, res) => {
  try {
    const { pixY, ccY, pixCNPJ, vliq, custos, estorno, gasto, pedidos, pecas } = req.body;
    const data = await sb('entries', 'PATCH', {
      pix_y: pixY, cc_y: ccY, pix_cnpj: pixCNPJ, vliq, custos, estorno, gasto, pedidos, pecas,
      updated_at: new Date(),
    }, `id=eq.${req.params.id}`);
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    await sb('entries', 'DELETE', null, `id=eq.${req.params.id}`);
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CONFIG
app.get('/api/config', async (req, res) => {
  try {
    const data = await sb('config', 'GET', null, 'id=eq.default');
    res.json({
      yampiRate: data[0].yampi_rate, metaRate: data[0].meta_rate, cpaMax: data[0].cpa_max,
      roasAlvo: data[0].roas_alvo, margemMeta: data[0].margem_meta,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/config', async (req, res) => {
  try {
    const { yampiRate, metaRate, cpaMax, roasAlvo, margemMeta } = req.body;
    const data = await sb('config', 'PATCH', {
      yampi_rate: yampiRate, meta_rate: metaRate, cpa_max: cpaMax,
      roas_alvo: roasAlvo, margem_meta: margemMeta, updated_at: new Date(),
    }, 'id=eq.default');
    res.json({
      yampiRate: data[0].yampi_rate, metaRate: data[0].meta_rate, cpaMax: data[0].cpa_max,
      roasAlvo: data[0].roas_alvo, margemMeta: data[0].margem_meta,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DESPESAS
app.get('/api/despesas', async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    const data = await sb('despesas', 'GET', null, `mes=eq.${mes}&order=created_at.asc`);
    res.json(data.map(d => ({ desc: d.descricao, valor: d.valor })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/despesas', async (req, res) => {
  try {
    const { mes, desc, valor } = req.body;
    const data = await sb('despesas', 'POST', {
      id: `desp-${Date.now()}`, mes, descricao: desc, valor,
    });
    res.json({ desc: data[0].descricao, valor: data[0].valor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/despesas/:id', async (req, res) => {
  try {
    await sb('despesas', 'DELETE', null, `id=eq.${req.params.id}`);
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SHOPIFY
app.post('/api/webhooks/shopify', (req, res) => {
  console.log('📦 Webhook:', req.body.id);
  res.json({ received: true });
});

app.listen(PORT, () => console.log(`✓ Zephyr on ${PORT}`));
export default app;
