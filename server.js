// server.js — Zephyr Financial Portal Backend
// Deploy to Render.com or similar
// Requires: SUPABASE_URL, SUPABASE_KEY env vars

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Zephyr backend online ✓', version: '1.0' });
});

// ==================== ENTRIES API ====================

// GET /api/entries?mes=2026-06
app.get('/api/entries', async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .gte('date', mes + '-01')
      .lt('date', mes + '-32')
      .order('date', { ascending: true });
    if (error) throw error;
    // Convert snake_case to camelCase for frontend
    const entries = data.map(e => ({
      id: e.id,
      date: e.date,
      pixY: e.pix_y,
      ccY: e.cc_y,
      pixCNPJ: e.pix_cnpj,
      vliq: e.vliq,
      custos: e.custos,
      estorno: e.estorno,
      gasto: e.gasto,
      pedidos: e.pedidos,
      pecas: e.pecas,
    }));
    res.json(entries);
  } catch (err) {
    console.error('GET /api/entries error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/entries (create new entry)
app.post('/api/entries', async (req, res) => {
  try {
    const { id, date, pixY, ccY, pixCNPJ, vliq, custos, estorno, gasto, pedidos, pecas } = req.body;
    const { data, error } = await supabase
      .from('entries')
      .insert([{
        id,
        date,
        pix_y: pixY,
        cc_y: ccY,
        pix_cnpj: pixCNPJ,
        vliq,
        custos,
        estorno,
        gasto,
        pedidos,
        pecas,
      }])
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('POST /api/entries error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/entries/:id (update entry)
app.put('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pixY, ccY, pixCNPJ, vliq, custos, estorno, gasto, pedidos, pecas } = req.body;
    const { data, error } = await supabase
      .from('entries')
      .update({
        pix_y: pixY,
        cc_y: ccY,
        pix_cnpj: pixCNPJ,
        vliq,
        custos,
        estorno,
        gasto,
        pedidos,
        pecas,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('PUT /api/entries error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/entries/:id
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ deleted: id });
  } catch (err) {
    console.error('DELETE /api/entries error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== CONFIG API ====================

// GET /api/config
app.get('/api/config', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .eq('id', 'default')
      .single();
    if (error) throw error;
    const cfg = {
      yampiRate: data.yampi_rate,
      metaRate: data.meta_rate,
      cpaMax: data.cpa_max,
      roasAlvo: data.roas_alvo,
      margemMeta: data.margem_meta,
    };
    res.json(cfg);
  } catch (err) {
    console.error('GET /api/config error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/config
app.put('/api/config', async (req, res) => {
  try {
    const { yampiRate, metaRate, cpaMax, roasAlvo, margemMeta } = req.body;
    const { data, error } = await supabase
      .from('config')
      .update({
        yampi_rate: yampiRate,
        meta_rate: metaRate,
        cpa_max: cpaMax,
        roas_alvo: roasAlvo,
        margem_meta: margemMeta,
        updated_at: new Date(),
      })
      .eq('id', 'default')
      .select();
    if (error) throw error;
    res.json({
      yampiRate: data[0].yampi_rate,
      metaRate: data[0].meta_rate,
      cpaMax: data[0].cpa_max,
      roasAlvo: data[0].roas_alvo,
      margemMeta: data[0].margem_meta,
    });
  } catch (err) {
    console.error('PUT /api/config error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== DESPESAS API ====================

// GET /api/despesas?mes=2026-06
app.get('/api/despesas', async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .eq('mes', mes)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const despesas = data.map(d => ({ desc: d.descricao, valor: d.valor }));
    res.json(despesas);
  } catch (err) {
    console.error('GET /api/despesas error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/despesas
app.post('/api/despesas', async (req, res) => {
  try {
    const { mes, desc, valor } = req.body;
    const id = `desp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { data, error } = await supabase
      .from('despesas')
      .insert([{ id, mes, descricao: desc, valor }])
      .select();
    if (error) throw error;
    res.json({ desc: data[0].descricao, valor: data[0].valor });
  } catch (err) {
    console.error('POST /api/despesas error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/despesas/:id
app.delete('/api/despesas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('despesas')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ deleted: id });
  } catch (err) {
    console.error('DELETE /api/despesas error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== SHOPIFY WEBHOOKS (Future) ====================
// POST /api/webhooks/shopify
app.post('/api/webhooks/shopify', async (req, res) => {
  try {
    // TODO: Verify HMAC signature from Shopify header
    // const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    // For now: just log and acknowledge
    const order = req.body;
    console.log('📦 Shopify webhook received:', {
      orderId: order.id,
      totalPrice: order.total_price,
      items: order.line_items?.length || 0,
    });

    // Example: Create entry from Shopify order
    // (requires mapping Shopify fields to entry format)
    // For now, just acknowledge
    res.json({ received: true, orderId: order.id });
  } catch (err) {
    console.error('Shopify webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Zephyr backend running on port ${PORT}`);
  console.log(`✓ Supabase connected: ${supabaseUrl}`);
  console.log(`✓ Ready to receive requests from ${process.env.FRONTEND_URL || 'any origin'}`);
});

export default app;
