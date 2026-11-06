/**
 * Trip Split Cloudflare Worker.
 * Public GitHub repository holds expenses.json; the GitHub write token stays in a
 * Cloudflare secret and is NEVER sent to browsers.
 *
 * Required Cloudflare secrets:
 *   GITHUB_TOKEN  Fine-grained PAT, Contents read/write, ONLY bndia/trip-split
 *   APP_PASSWORD  bbttrrjj (casual shared password; not strong authentication)
 */
const REPOSITORY = 'bndia/trip-split';
const FILE_PATH = 'expenses.json';
const GITHUB_BRANCH = 'main';
const ALLOWED_ORIGIN = 'https://bndia.github.io';
const FRIENDS = ['רובי', 'גרציאני', 'ג׳ורדן', 'בן'];
const CURRENCIES = ['EUR', 'ILS', 'USD'];
const GITHUB_CONTENT_URL = `https://api.github.com/repos/${REPOSITORY}/contents/${FILE_PATH}`;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Trip-Password',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': 'application/json; charset=utf-8',
  };
}
function reply(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}
function decodeUtf8Base64(value) {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function encodeUtf8Base64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}
function githubHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'trip-split-worker',
  };
}
async function readSnapshot(token) {
  const response = await fetch(`${GITHUB_CONTENT_URL}?ref=${GITHUB_BRANCH}`, {
    headers: githubHeaders(token), cache: 'no-store',
  });
  if (response.status === 404) return { sha: null, items: [] };
  if (!response.ok) throw new Error(`GitHub read failed: ${response.status}`);
  const file = await response.json();
  if (file.type !== 'file' || typeof file.content !== 'string') {
    throw new Error('GitHub returned a non-file response');
  }
  const items = JSON.parse(decodeUtf8Base64(file.content));
  if (!Array.isArray(items)) throw new Error('expenses.json must contain an array');
  return { sha: file.sha, items };
}
async function writeSnapshot(token, items, sha, message) {
  const body = {
    message,
    branch: GITHUB_BRANCH,
    content: encodeUtf8Base64(JSON.stringify(items, null, 2) + '\n'),
  };
  if (sha) body.sha = sha;
  const response = await fetch(GITHUB_CONTENT_URL, {
    method: 'PUT',
    headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.ok) return 'saved';
  if (response.status === 409 || response.status === 422) return 'retry';
  throw new Error(`GitHub write failed: ${response.status}`);
}
function validateExpense(value) {
  if (!value || typeof value !== 'object') return null;
  const id = value.id;
  const cents = value.cents;
  const currency = value.currency;
  const payer = value.payer;
  const participants = value.participants;
  const description = value.description ?? '';
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(id)) return null;
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 1000000000) return null;
  if (!CURRENCIES.includes(currency) || !FRIENDS.includes(payer)) return null;
  if (!Array.isArray(participants) || participants.length < 1 || participants.length > FRIENDS.length) return null;
  if (new Set(participants).size !== participants.length || !participants.every(p => FRIENDS.includes(p))) return null;
  if (typeof description !== 'string' || description.length > 120) return null;
  return { id, cents, currency, payer, participants, description, created_at: new Date().toISOString() };
}
async function parseBody(request) {
  const raw = await request.text();
  if (raw.length > 4096) throw new Error('Request too large');
  return JSON.parse(raw);
}
async function changeFile(token, kind, payload) {
  // GitHub's file SHA is an optimistic lock. A simultaneous write returns
  // 409/422, so we reload the latest file, reapply, and retry without losing it.
  for (let attempt = 0; attempt < 8; attempt++) {
    const { sha, items } = await readSnapshot(token);
    let updated;
    if (kind === 'add') {
      if (items.some(item => item.id === payload.id)) return { ok: true, alreadyApplied: true };
      updated = [payload, ...items];
    } else {
      if (!items.some(item => item.id === payload.id)) return { ok: true, alreadyApplied: true };
      updated = items.filter(item => item.id !== payload.id);
    }
    const done = await writeSnapshot(token, updated, sha, `trip-split: ${kind} expense`);
    if (done === 'saved') return { ok: true };
    await new Promise(resolve => setTimeout(resolve, 60 + Math.floor(Math.random() * 140) * (attempt + 1)));
  }
  throw new Error('Too many concurrent updates');
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (origin && origin !== ALLOWED_ORIGIN) return reply({ error: 'Origin not allowed' }, 403);
    const url = new URL(request.url);
    if (url.pathname !== '/api/expenses') return reply({ error: 'Not found' }, 404);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
    if (!['GET', 'POST', 'DELETE'].includes(request.method)) return reply({ error: 'Method not allowed' }, 405);
    if (!env.GITHUB_TOKEN || !env.APP_PASSWORD) return reply({ error: 'Worker secrets are not configured' }, 503);
    if (request.headers.get('X-Trip-Password') !== env.APP_PASSWORD) return reply({ error: 'Wrong trip password' }, 401);
    try {
      if (request.method === 'GET') {
        const { items } = await readSnapshot(env.GITHUB_TOKEN);
        return reply({ items });
      }
      let value;
      try { value = await parseBody(request); }
      catch { return reply({ error: 'Invalid JSON request' }, 400); }
      if (request.method === 'POST') {
        const expense = validateExpense(value);
        if (!expense) return reply({ error: 'Invalid expense' }, 400);
        return reply(await changeFile(env.GITHUB_TOKEN, 'add', expense));
      }
      if (typeof value?.id !== 'string' || !/^[0-9a-f-]{36}$/.test(value.id)) {
        return reply({ error: 'Invalid expense ID' }, 400);
      }
      return reply(await changeFile(env.GITHUB_TOKEN, 'remove', { id: value.id }));
    } catch (error) {
      console.error('Trip Split Worker:', error);
      return reply({ error: 'GitHub sync failed. Try again.' }, 502);
    }
  },
};
