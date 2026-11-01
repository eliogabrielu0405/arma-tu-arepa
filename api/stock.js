// Lo agotado de la arepera.
// GET  /api/stock                         -> { agotado: [...] }   (público, lo lee la tienda)
// POST /api/stock { password }            -> revisa la contraseña del panel
// POST /api/stock { password, agotado }   -> guarda la lista nueva
// Necesita en Vercel: ADMIN_PASSWORD y la base Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN).
const crypto = require("crypto");
const MENU = require("../menu.js");

const IDS = new Set(MENU.ALL_IDS);
const KEY = "arepa:agotado";
// Vercel puede ponerle un prefijo a las variables al conectar Upstash (ej. STORAGE_KV_REST_API_URL), así que se buscan por el final del nombre
function findEnv(endings) {
  for (const end of endings) {
    if (process.env[end]) return process.env[end];
    const key = Object.keys(process.env).find((k) => k.endsWith("_" + end) && process.env[k]);
    if (key) return process.env[key];
  }
  return "";
}
const DB_URL = findEnv(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]);
const DB_TOKEN = findEnv(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]);

async function redis(command) {
  const r = await fetch(DB_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${DB_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error || `Redis respondió ${r.status}`);
  return data.result;
}

function samePassword(given, real) {
  const hash = (s) => crypto.createHash("sha256").update(String(s)).digest();
  return crypto.timingSafeEqual(hash(given), hash(real));
}

function cleanList(list) {
  return Array.isArray(list) ? [...new Set(list.filter((id) => typeof id === "string" && IDS.has(id)))] : [];
}

async function readList() {
  const raw = await redis(["GET", KEY]);
  try { return cleanList(JSON.parse(raw || "[]")); } catch { return []; }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (!DB_URL || !DB_TOKEN) {
    return res.status(500).json({ error: "Falta conectar la base de datos Upstash Redis al proyecto en Vercel." });
  }

  if (req.method === "GET") {
    try { return res.status(200).json({ agotado: await readList() }); }
    catch { return res.status(502).json({ error: "No se pudo leer la base de datos." }); }
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
        await redis(["SET", KEY, JSON.stringify(list)]);
        return res.status(200).json({ ok: true, agotado: list });
      }
      return res.status(200).json({ ok: true, agotado: await readList() });
    } catch {
      return res.status(502).json({ error: "No se pudo guardar en la base de datos. Intenta de nuevo." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método no permitido." });
};
