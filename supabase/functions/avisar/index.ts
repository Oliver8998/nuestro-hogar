import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responder = (datos: unknown, estado = 200) =>
  new Response(JSON.stringify(datos), { status: estado, headers: { ...CORS, "Content-Type": "application/json" } });

let claves: { publica: string; privada: string } | null = null;

async function obtenerClaves() {
  if (claves) return claves;
  const { data } = await db.from("push_claves").select("publica, privada").eq("id", 1).maybeSingle();
  if (data) return (claves = data);
  const nuevas = webpush.generateVAPIDKeys();
  await db.from("push_claves").upsert({ id: 1, publica: nuevas.publicKey, privada: nuevas.privateKey });
  const { data: otra } = await db.from("push_claves").select("publica, privada").eq("id", 1).single();
  return (claves = otra);
}

const ultimos = new Map<string, number>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let cuerpo: Record<string, any> = {};
  try {
    cuerpo = await req.json();
  } catch (_) {
    return responder({ error: "json" }, 400);
  }
  const { accion, hogar, yo } = cuerpo;
  const k = await obtenerClaves();

  if (accion === "clave") return responder({ clave: k.publica });

  if (typeof hogar !== "string" || !/^[A-Z0-9]{6}$/.test(hogar) || (yo !== 0 && yo !== 1)) {
    return responder({ error: "datos" }, 400);
  }

  if (accion === "suscribir") {
    const sub = cuerpo.sub;
    if (!sub || typeof sub.endpoint !== "string" || !sub.keys) return responder({ error: "sub" }, 400);
    await db.from("push_subs").upsert({ endpoint: sub.endpoint, hogar, yo, sub, creado: new Date().toISOString() });
    return responder({ ok: true });
  }

  if (accion === "quitar") {
    if (cuerpo.endpoint) await db.from("push_subs").delete().eq("endpoint", cuerpo.endpoint);
    return responder({ ok: true });
  }

  if (accion === "enviar") {
    const clave = `${hogar}-${yo}-${cuerpo.tipo || ""}`;
    const ahora = Date.now();
    if ((ultimos.get(clave) || 0) > ahora - 20000) return responder({ ok: true, saltado: true });
    ultimos.set(clave, ahora);
    const titulo = String(cuerpo.titulo || "Our Place").slice(0, 60);
    const texto = String(cuerpo.texto || "").slice(0, 160);
    const { data: subs } = await db.from("push_subs").select("endpoint, sub").eq("hogar", hogar).neq("yo", yo);
    webpush.setVapidDetails("mailto:avisos@ourplace.game", k.publica, k.privada);
    let enviados = 0;
    for (const s of subs || []) {
      try {
        await webpush.sendNotification(s.sub, JSON.stringify({ titulo, texto, tipo: cuerpo.tipo || "" }), { TTL: 86400 });
        enviados++;
      } catch (e) {
        const codigo = (e as { statusCode?: number }).statusCode;
        if (codigo === 404 || codigo === 410) await db.from("push_subs").delete().eq("endpoint", s.endpoint);
      }
    }
    return responder({ ok: true, enviados });
  }

  return responder({ error: "accion" }, 400);
});
