// netlify/functions/generate-card.js — CommonJS format
const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  const adminPw = event.headers['x-admin-password'];
  if (!adminPw || adminPw !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) };
  }

  const { name, lang = 'ca' } = body;
  if (!name) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Name required' }) };

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Genera una fitxa completa sobre el dissenyador "${name}" en ${lang === 'ca' ? 'català' : 'castellà'}.
Respon ÚNICAMENT amb JSON vàlid, sense markdown ni text addicional:
{
  "name": "${name}",
  "slug": "nom-en-minuscules-amb-guions",
  "tagline": "descripció breu memorable (max 8 paraules)",
  "period": "any_naixement–any_mort_o_present",
  "origin": "Ciutat, País",
  "category": "una de: llegendes | branding | contemporanis | hispa",
  "portrait_url": "URL real Wikipedia si existeix, sino null",
  "bio": "2-3 frases sobre la seva importància",
  "style": ["característica 1","característica 2","característica 3","característica 4","característica 5"],
  "techniques": ["tècnica 1","tècnica 2","tècnica 3","tècnica 4","tècnica 5"],
  "principles": [{"name":"nom principi","desc":"descripció"},{"name":"nom principi","desc":"descripció"},{"name":"nom principi","desc":"descripció"}],
  "works": [{"title":"Obra (any)","desc":"descripció breu"},{"title":"Obra (any)","desc":"descripció breu"},{"title":"Obra (any)","desc":"descripció breu"}],
  "lesson": "lliçó principal en 2-3 frases",
  "sources": ["Font 1 (any)","Font 2","www.weboficial.com"],
  "video_id": "ID YouTube si el coneixes, sino null",
  "links": [{"label":"Nom","url":"https://...","icon":"🌐"}]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const card = JSON.parse(clean);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, card }) };
  } catch (err) {
    console.error('generate-card error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
