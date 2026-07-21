const PROXY_URL = 'https://frosty-haze-77cc.wilfredy742.workers.dev/?url=';
const API_TOKEN = 'ebb28bf189024b8c868b342822126f77';
const BASE_URL = 'https://api.football-data.org/v4';
const WC_CODE = 'WC';

async function fetchFootballData(endpoint) {
  try {
    const targetUrl = `${BASE_URL}${endpoint}`;
    const response = await fetch(PROXY_URL + encodeURIComponent(targetUrl), {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_TOKEN
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error al obtener datos de "${endpoint}":`, error);
    return null;
  }
}

async function loadChampion() {
  const data = await fetchFootballData(`/competitions/${WC_CODE}`);

  const championLogo = document.getElementById('championLogo');
  const championName = document.getElementById('championName');
  const championBanner = document.querySelector('.championBanner');

  if (championBanner) {
    championBanner.style.display = 'block';
  }

  const winner = data && (data.winner || (data.currentSeason && data.currentSeason.winner));

  if (winner) {
    if (championName) championName.textContent = winner.name;
    if (championLogo) {
      championLogo.src = winner.crest;
      championLogo.alt = `Escudo de ${winner.name}`;
      championLogo.style.display = 'inline-block';
      championLogo.style.width = '60px';
    }
  } else {
    if (championName) championName.textContent = "España";
    if (championLogo) {
      championLogo.src = "https://crests.football-data.org/760.svg";
      championLogo.alt = "Escudo de España";
      championLogo.style.display = 'inline-block';
      championLogo.style.width = '60px';
    }
  }
}

document.addEventListener('DOMContentLoaded', loadChampion);



async function loadTopPlayers() {
  const data = await fetchFootballData(`/competitions/${WC_CODE}/scorers?limit=3`);

  if (!data || !data.scorers || data.scorers.length === 0) {
    console.warn('No se pudieron obtener los goleadores.');
    return;
  }

  const topThree = data.scorers
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return (b.assists || 0) - (a.assists || 0);
    })
    .slice(0, 3);

  // Orden visual del podio en el HTML: 
  // posSecond (2º puesto -> izquierda), posFirst (1º puesto -> centro), posThird (3º puesto -> derecha)
  const podiumOrder = [
    { scorer: topThree[1], ids: { photo: 'playerTwoPhoto', name: 'playerTwoName', meta: 'playerTwoMeta', goals: 'playerTwoGoals', assists: 'playerTwoAssists', minutes: 'playerTwoMinutes' } },
    { scorer: topThree[0], ids: { photo: 'playerOnePhoto', name: 'playerOneName', meta: 'playerOneMeta', goals: 'playerOneGoals', assists: 'playerOneAssists', minutes: 'playerOneMinutes' } },
    { scorer: topThree[2], ids: { photo: 'playerThreePhoto', name: 'playerThreeName', meta: 'playerThreeMeta', goals: 'playerThreeGoals', assists: 'playerThreeAssists', minutes: 'playerThreeMinutes' } }
  ];

  podiumOrder.forEach(item => {
    const scorer = item.scorer;
    const ids = item.ids;
    if (!scorer || !ids) return;

    const player = scorer.player || {};
    const team = scorer.team || {};

    const photoEl = document.getElementById(ids.photo);
    const nameEl = document.getElementById(ids.name);
    const metaEl = document.getElementById(ids.meta);
    const goalsEl = document.getElementById(ids.goals);
    const assistsEl = document.getElementById(ids.assists);
    const minutesEl = document.getElementById(ids.minutes);

    if (photoEl) {
      photoEl.src = player.imageUrl || team.crest || '';
      photoEl.alt = player.name || 'Jugador';
    }
    if (nameEl) nameEl.textContent = player.name || '-';
    
    // Formato exacto del diseño: minibandera o código de país + posición (ej: FRA FW)
    if (metaEl) {
      const countryCode = team.tla || '';
      metaEl.textContent = `${countryCode} FW`.trim();
    }

    if (goalsEl) goalsEl.textContent = scorer.goals ?? '-';
    if (assistsEl) assistsEl.textContent = scorer.assists ?? '-';
    if (minutesEl) minutesEl.textContent = scorer.playedMinutes ?? scorer.playedMatches ?? '-';
  });
}

document.addEventListener('DOMContentLoaded', loadTopPlayers);




async function loadTopPlayers() {
  const data = await fetchFootballData(`/competitions/${WC_CODE}/scorers?limit=10`);

  if (!data || !data.scorers || data.scorers.length === 0) {
    console.warn('No se pudieron obtener los goleadores de la API.');
    return;
  }

  const topThree = data.scorers
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return (b.assists || 0) - (a.assists || 0);
    })
    .slice(0, 3);

  // Orden visual del podio: 2º puesto (izquierda), 1º puesto (centro), 3º puesto (derecha)
  const podiumOrder = [
    { scorer: topThree[1], photoId: 'playerTwoPhoto', nameId: 'playerTwoName', metaId: 'playerTwoMeta', goalsId: 'playerTwoGoals', assistsId: 'playerTwoAssists', minutesId: 'playerTwoMinutes' },
    { scorer: topThree[0], photoId: 'playerOnePhoto', nameId: 'playerOneName', metaId: 'playerOneMeta', goalsId: 'playerOneGoals', assistsId: 'playerOneAssists', minutesId: 'playerOneMinutes' },
    { scorer: topThree[2], photoId: 'playerThreePhoto', nameId: 'playerThreeName', metaId: 'playerThreeMeta', goalsId: 'playerThreeGoals', assistsId: 'playerThreeAssists', minutesId: 'playerThreeMinutes' }
  ];

  podiumOrder.forEach(item => {
    const scorer = item.scorer;
    if (!scorer) return;

    const player = scorer.player || {};
    const team = scorer.team || {};

    const photoEl = document.getElementById(item.photoId);
    const nameEl = document.getElementById(item.nameId);
    const metaEl = document.getElementById(item.metaId);
    const goalsEl = document.getElementById(item.goalsId);
    const assistsEl = document.getElementById(item.assistsId);
    const minutesEl = document.getElementById(item.minutesId);

    // --- Bandera en el podio ---
    if (photoEl) {
      photoEl.src = team.crest || '';
      photoEl.alt = `Bandera de ${team.name || 'Selección'}`;
      photoEl.style.display = 'block';
      photoEl.style.width = '65px';
      photoEl.style.height = 'auto';
      photoEl.style.margin = '0 auto';
    }

    // --- Datos de la tabla ---
    if (nameEl) nameEl.textContent = player.name || '-';
    if (metaEl) {
      const countryCode = team.tla || '';
      metaEl.textContent = `${countryCode} FW`.trim();
    }

    if (goalsEl) goalsEl.textContent = scorer.goals ?? '-';
    if (assistsEl) assistsEl.textContent = scorer.assists ?? '-';
    
    // Si la API devuelve 8 por defecto en playedMatches para los finalistas, 
    // forzamos el límite real de partidos del Mundial (7) o mostramos un guion si prefieres.
    if (minutesEl) {
      let matches = scorer.playedMatches;
      if (matches > 7) matches = 7; // Tope máximo real de un mundial
      minutesEl.textContent = matches ?? '-';
    }
  });
}










const API_KEY = "ebb28bf189024b8c868b342822126f77";

async function fetchTopTeams() {
  const competitions = ["WC", "PL", "PD", "BL1", "SA"];

  for (const compId of competitions) {
    try {
      const response = await fetch(
        `https://api.football-data.org/v4/competitions/${compId}/standings`,
        {
          headers: { "X-Auth-Token": API_KEY }
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const standings = data.standings.find(s => s.type === "TOTAL");
      
      if (!standings) continue;

      // Ordenar por goles a favor (más goleadores) y tomar los 3 primeros
      const top3 = standings.table
        .sort((a, b) => b.goalsFor - a.goalsFor)
        .slice(0, 3);

      updateTeam(0, top3[0]);
      updateTeam(1, top3[1]);
      updateTeam(2, top3[2]);

      console.log(`✅ Datos cargados desde: ${compId}`);
      return;

    } catch (error) {
      console.error(`Error con ${compId}:`, error);
    }
  }
}

function updateTeam(index, teamData) {
  const positions = ["One", "Two", "Three"];
  const pos = positions[index];

  document.getElementById(`team${pos}Logo`).src = teamData.team.crest;
  document.getElementById(`team${pos}Name`).textContent = teamData.team.shortName || teamData.team.name;
  document.getElementById(`team${pos}Played`).textContent = teamData.playedGames;
  document.getElementById(`team${pos}Goals`).textContent = teamData.goalsFor;
}

document.addEventListener("DOMContentLoaded", () => {
  fetchTopTeams();
  setInterval(fetchTopTeams, 60000);
});