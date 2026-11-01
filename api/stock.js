// Lo agotado de la arepera.
// GET  /api/stock                         -> { agotado: [...] }   (público, lo lee la tienda)
// POST /api/stock { password }            -> revisa la contraseña del panel
// POST /api/stock { password, agotado }   -> guarda la lista nueva
// Necesita en Vercel: ADMIN_PASSWORD y una base de datos conectada:
//   - Supabase (variable ...POSTGRES_URL), la tabla se crea sola, o
//   - Upstash Redis (variables ...KV_REST_API_URL / ...KV_REST_API_TOKEN).
const crypto = require("crypto");
const MENU = require("../menu.js");

const IDS = new Set(MENU.ALL_IDS);

// Vercel puede ponerle un prefijo a las variables al conectar la base (ej. STORAGE_POSTGRES_URL), así que se buscan por el final del nombre
function findEnv(endings) {
  for (const end of endings) {
    if (process.env[end]) return process.env[end];
    const key = Object.keys(process.env).find((k) => k.endsWith("_" + end) && process.env[k]);
    if (key) return process.env[key];
  }
  return "";
}

/* ---------- Supabase (Postgres) ---------- */
const PG_URL = findEnv(["POSTGRES_URL", "DATABASE_URL"]);
let pool;
function pg() {
  if (!pool) {
    const { Pool } = require("pg");
    // Se quita sslmode de la dirección y se usa SSL sin verificar la cadena: así lo pide el pooler de Supabase
    const url = new URL(PG_URL);
    url.searchParams.delete("sslmode");
    pool = new Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false }, max: 1 });
  }
  return pool;
}
let tableReady = false;
async function pgTable() {
  if (tableReady) return;
  await pg().query(
    "create table if not exists arepa_stock (id text primary key, agotado jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now())"
  );
  tableReady = true;
}
const supabase = {
  async read() {
    await pgTable();
    const { rows } = await pg().query("select agotado from arepa_stock where id = 'main'");
    return rows[0] ? rows[0].agotado : [];
  },
  async write(list) {
    await pgTable();
    await pg().query(
      "insert into arepa_stock (id, agotado, updated_at) values ('main', $1::jsonb, now()) on conflict (id) do update set agotado = excluded.agotado, updated_at = now()",
      [JSON.stringify(list)]
    );
  },
};

/* ---------- Upstash Redis ---------- */
const KV_URL = findEnv(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]);
const KV_TOKEN = findEnv(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]);
const KEY = "arepa:agotado";
async function redis(command) {
  const r = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error || `Redis respondió ${r.status}`);
  return data.result;
}
const upstash = {
  async read() {
    const raw = await redis(["GET", KEY]);
    try { return JSON.parse(raw || "[]"); } catch { return []; }
  },
  async write(list) { await redis(["SET", KEY, JSON.stringify(list)]); },
};

const DB = PG_URL ? supabase : KV_URL && KV_TOKEN ? upstash : null;

/* ---------- Comunes ---------- */
function samePassword(given, real) {
  const hash = (s) => crypto.createHash("sha256").update(String(s)).digest();
  return crypto.timingSafeEqual(hash(given), hash(real));
}
function cleanList(list) {
  return Array.isArray(list) ? [...new Set(list.filter((id) => typeof id === "string" && IDS.has(id)))] : [];
}
async function readList() { return cleanList(await DB.read()); }

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (!DB) {
    return res.status(500).json({ error: "Falta conectar una base de datos (Supabase o Upstash) al proyecto en Vercel." });
  }

  if (req.method === "GET") {
    try { return res.status(200).json({ agotado: await readList() }); }
    catch (err) { console.error(err); return res.status(502).json({ error: "No se pudo leer la base de datos." }); }
  }

  if (req.method === "POST") {
    const realPassword = process.env.ADMIN_PASSWORD;
    if (!realPassword) {
      return res.status(500).json({ error: "Falta la variable ADMIN_PASSWORD en Vercel." });
    }

    let body = req.body || {};
    if (typeof body === "string") {
      try { body = JSON.parse(body || "{}"); }
      catch { return res.status(400).json({ error: "Datos inválidos." }); }
    }

    if (!samePassword(body.password || "", realPassword)) {
      await new Promise((r) => setTimeout(r, 700)); // frena a quien intente adivinar
      return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    try {
      if (Array.isArray(body.agotado)) {
        const list = cleanList(body.agotado);
        await DB.write(list);
        return res.status(200).json({ ok: true, agotado: list });
      }
      return res.status(200).json({ ok: true, agotado: await readList() });
    } catch (err) {
      console.error(err);
      return res.status(502).json({ error: "No se pudo guardar en la base de datos. Intenta de nuevo." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método no permitido." });
};
