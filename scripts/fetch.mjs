import { readFile, writeFile, mkdir } from 'node:fs/promises';

const UA = process.env.UA || 'FFToolkit/1.0 (+https://github.com)';
const KEY = process.env.FF_KEY || '';

const list = JSON.parse(await readFile('data/watchlist.json', 'utf8'));
const out = { updated: new Date().toISOString(), players: {} };

async function get(url) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 60000);
  const h = { 'User-Agent': UA };
  if (KEY) h['x-api-key'] = KEY;
  try {
    return await fetch(url, { headers: h, signal: ctl.signal });
  } finally {
    clearTimeout(to);
  }
}

for (const item of list) {
  const uid = typeof item === 'string' ? item : item.uid;
  const region = typeof item === 'string' ? 'sg' : (item.region || 'sg');
  const url = `https://developers.freefirecommunity.com/api/v1/info?region=${region}&uid=${uid}`;
  try {
    const r = await get(url);
    if (!r.ok) { out.players[uid] = { error: r.status }; }
    else { out.players[uid] = await r.json(); }
  } catch (e) {
    out.players[uid] = { error: String(e.message || e) };
  }
  await new Promise(r => setTimeout(r, 1500));
}

await mkdir('data', { recursive: true });
await writeFile('data/cache.json', JSON.stringify(out, null, 2));
console.log('Listo. Jugadores guardados:', Object.keys(out.players).length);
