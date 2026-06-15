// server.js — Zephyr Backend (Realtime DISABLED)
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

// Create Supabase client WITHOUT Realtime (key option)
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    broker: {
      supabase: { realtime: null },
    },
  },
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Zephyr backend online ✓', version: '1.0' });
});

// ENTRIES
app.get('/api/entries', async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .gte('date', mes + '-01')
      .lt('date', mes + '-32')
      .order('date');
    if (error) throw error;
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
    const { data, error } = await supabase.from('entries').insert([{
      id, date, pix_y: pixY, cc_y: ccY, pix_cnpj: pixCNPJ,
      vliq, custos, estorno, gasto, pedidos, pecas,
    }]).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/entries/:id', async (req, res) => {
  try {
    const { pixY, ccY, pixCNPJ, vliq, custos, estorno, gasto, pedidos, pecas } = req.body;
    const { data, error } = await supabase.from('entries').update({
      pix_y: pixY, cc_y: ccY, pix_cnpj: pixCNPJ, vliq, custos, estorno, gasto, pedidos, pecas,
      updated_at: new Date(),
    }).eq('id', req.params.id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('entries').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CONFIG
app.get('/api/config', async (req, res) => {
  try {
    const { data, error } = await supabase.from('config').select('*').eq('id', 'default').single();
    if (error) throw error;
    res.json({
      yampiRate: data.yampi_rate, metaRate: data.meta_rate, cpaMax: data.cpa_max,
      roasAlvo: data.roas_alvo, margemMeta: data.margem_meta,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/config', async (req, res) => {
  try {
    const { yampiRate, metaRate, cpaMax, roasAlvo, margemMeta } = req.body;
    const { data, error } = await supabase.from('config').update({
      yampi_rate: yampiRate, meta_rate: metaRate, cpa_max: cpaMax,
      roas_alvo: roasAlvo, margem_meta: margemMeta, updated_at: new Date(),
    }).eq('id', 'default').select();
    if (error) throw error;
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
    const { data, error } = await supabase.from('despesas').select('*').eq('mes', mes).order('created_at');
    if (error) throw error;
    res.json(data.map(d => ({ desc: d.descricao, valor: d.valor })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/despesas', async (req, res) => {
  try {
    const { mes, desc, valor } = req.body;
    const { data, error } = await supabase.from('despesas').insert([{
      id: `desp-${Date.now()}`, mes, descricao: desc, valor,
    }]).select();
    if (error) throw error;
    res.json({ desc: data[0].descricao, valor: data[0].valor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/despesas/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('despesas').delete().eq('id', req.params.id);
    if (error) throw error;
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

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => console.log(`✓ Zephyr on ${PORT}`));
export default app;
