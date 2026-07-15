/*
Datos del Grupo:
https://api.football-data.org/v4/competitions/WC/standings?season=2026

Grupos
https://api.football-data.org/v4/competitions/WC/matches?season=2026&stage=GROUP_STAGE
*/

// ============================================================
//  api.js — Llamadas a football-data.org con control de errores
//
//  Uso:
//    const datos = await llamarApi("/competitions/WC/standings?season=2026");
// ============================================================

const API_BASE   = "https://api.football-data.org/v4";
const API_TOKEN  = "e852d958e573426cb8cad7477a88e468";   // ⚠️ En producción esto va en tu backend, no aquí
const REINTENTOS = 3;


/** Pausa la ejecución los milisegundos indicados. */
const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


/** Traduce un código HTTP a un mensaje entendible. */
function mensajeDeError(status) {
  const mensajes = {
    400: "Petición mal formada. Revisa los filtros de la URL.",
    403: "Tu plan no tiene acceso a este recurso (el Mundial suele ser de pago).",
    404: "El recurso no existe. ¿Está bien el código de competición o la temporada?",
    429: "Has superado el límite de peticiones por minuto.",
  };
  return mensajes[status] ?? `Error HTTP ${status}.`;
}


/**
 * Llama a la API y devuelve el JSON ya parseado.
 *
 * Reintenta automáticamente ante:
 *   - 429 (límite de peticiones)  → espera lo que diga la cabecera de la API
 *   - 5xx (fallo del servidor)    → espera creciente: 2s, 4s, 8s…
 *   - fallos de red / CORS        → espera 1s, 2s, 3s…
 *
 * NO reintenta ante 4xx (400, 403, 404): eso es un error nuestro y no se arregla solo.
 *
 * Si agota los intentos, lanza un Error → captúralo con try/catch al llamarla.
 */
async function llamarApi(endpoint, reintentos = REINTENTOS) {
  const url = `${API_BASE}${endpoint}`;

  for (let intento = 1; intento <= reintentos; intento++) {
    try {
      const respuesta = await fetch(url, {
        headers: { "X-Auth-Token": API_TOKEN },
      });

      // --- Errores temporales: merece la pena reintentar ---
      if (respuesta.status === 429 || respuesta.status >= 500) {

        // Si ya era el último intento, no esperamos en balde: abortamos.
        if (intento === reintentos) {
          throw new Error(mensajeDeError(respuesta.status));
        }

        const segundos = respuesta.status === 429
          ? Number(respuesta.headers.get("X-RequestCounter-Reset")) || 60
          : 2 ** intento;

        console.warn(
          `[${respuesta.status}] Espero ${segundos}s y reintento… (${intento}/${reintentos})`
        );
        await dormir(segundos * 1000);
        continue;   // ← vuelve al principio del bucle
      }

      // --- Errores permanentes (400, 403, 404…): abortamos ya ---
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        throw new Error(cuerpo.message || mensajeDeError(respuesta.status));
      }

      // --- ✅ Todo correcto ---
      return await respuesta.json();

    } catch (error) {
      // fetch() solo lanza TypeError ante fallo de red o bloqueo por CORS.
      // Cualquier otro Error es uno de los nuestros de arriba → hay que propagarlo.
      const esFalloDeRed = error instanceof TypeError;
      if (!esFalloDeRed || intento === reintentos) throw error;

      console.warn(`Fallo de red o CORS. Reintento ${intento}/${reintentos}…`);
      await dormir(1000 * intento);
    }
  }

  throw new Error(`No se pudo completar la petición tras ${reintentos} intentos.`);
}


// ============================================================
//  EJEMPLO DE USO
// ============================================================

async function cargarPartidos() {
  try {
    const datos = await llamarApi(
      "/competitions/WC/matches?season=2026&stage=GROUP_STAGE"
    );

    console.log(`✅ ${datos.matches.length} partidos cargados`);
    return datos.matches;

  } catch (error) {
    console.error("❌ No se pudieron cargar los partidos:", error.message);
    // Aquí pintas el mensaje en la interfaz, p. ej.:
    // document.getElementById("aviso").textContent = error.message;
    return [];
  }
}
