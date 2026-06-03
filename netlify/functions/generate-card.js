// netlify/functions/generate-card.js
// Genera la fitxa en CA i ES simultàniament
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

  const { name } = body;
  if (!name) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Name required' }) };

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Genera una fitxa completa sobre el dissenyador "${name}".
Respon ÚNICAMENT amb JSON vàlid, sense markdown ni text addicional:
{
  "name": "${name}",
  "slug": "nom-en-minuscules-amb-guions",
  "tagline_ca": "eslogan en català (max 8 paraules)",
  "tagline_es": "eslogan en castellà (max 8 palabras)",
  "period": "any_naixement–any_mort_o_present",
  "origin": "Ciutat, País",
  "category": "una de: llegendes | branding | contemporanis | hispa",
  "portrait_url": "URL real Wikipedia si existeix, sino null",
  "bio_ca": "2-3 frases en català sobre la seva importància",
  "bio_es": "2-3 frases en castellà sobre su importancia",
  "style": ["característica 1","característica 2","característica 3","característica 4","característica 5"],
  "techniques": ["tècnica 1","tècnica 2","tècnica 3","tècnica 4","tècnica 5"],
  "principles": [
    {"name":"nom principi","desc":"descripció"},
    {"name":"nom principi","desc":"descripció"},
    {"name":"nom principi","desc":"descripció"}
  ],
  "works": [
    {"title":"Obra (any)","desc":"descripció breu"},
    {"title":"Obra (any)","desc":"descripció breu"},
    {"title":"Obra (any)","desc":"descripció breu"}
  ],
  "lesson_ca": "lliçó principal en català (2-3 frases)",
  "lesson_es": "lección principal en castellano (2-3 frases)",
  "sources": ["Font 1 (any)","Font 2","www.weboficial.com"],
  "video_id": "ID YouTube si el coneixes, sino null",
  "links": [{"label":"Nom","url":"https://...","icon":"🌐"}]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2500,
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
