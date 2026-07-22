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

    
    if (photoEl) {
      photoEl.src = team.crest || '';
      photoEl.alt = `Bandera de ${team.name || 'Selección'}`;
      photoEl.style.display = 'block';
      photoEl.style.width = '65px';
      photoEl.style.height = 'auto';
      photoEl.style.margin = '0 auto';
    }

    
    if (nameEl) nameEl.textContent = player.name || '-';
    if (metaEl) {
      const countryCode = team.tla || '';
      metaEl.textContent = `${countryCode} FW`.trim();
    }

    if (goalsEl) goalsEl.textContent = scorer.goals ?? '-';
    if (assistsEl) assistsEl.textContent = scorer.assists ?? '-';
    
    
    if (minutesEl) {
      let matches = scorer.playedMatches;
      if (matches > 7) matches = 7; // 
      minutesEl.textContent = matches ?? '-';
    }
  });
}








function traducirPais(nombreIngles) {
    const traducciones = {
        "Spain": "España",
        "England": "Inglaterra",
        "Germany": "Alemania",
        "France": "Francia",
        "Italy": "Italia",
        "Brazil": "Brasil",
        "Argentina": "Argentina",
        "Portugal": "Portugal",
        "Netherlands": "Países Bajos",
        "Belgium": "Bélgica"
    };
    return traducciones[nombreIngles] || nombreIngles;
}








async function calcularTablaDesdePartidos() {
    try {
        const data = await fetchFootballData(`/competitions/${WC_CODE}/matches?season=2026`);
        
        if (!data || !data.matches) {
            console.warn("No se pudieron obtener los partidos para la tabla.");
            return;
        }

        const matches = data.matches;
        const tabla = {};

        matches.forEach(match => {
            if (match.status === 'FINISHED') {
                const local = match.homeTeam.name;
                const visitante = match.awayTeam.name;
                const escudoLocal = match.homeTeam.crest;
                const escudoVisitante = match.awayTeam.crest;
                const golesLocal = match.score.fullTime.home;
                const golesVisitante = match.score.fullTime.away;

                if (!tabla[local]) {
                    tabla[local] = { nombre: local, crest: escudoLocal, puntos: 0, jugados: 0, gf: 0, gc: 0, dif: 0 };
                }
                if (!tabla[visitante]) {
                    tabla[visitante] = { nombre: visitante, crest: escudoVisitante, puntos: 0, jugados: 0, gf: 0, gc: 0, dif: 0 };
                }

                tabla[local].jugados++;
                tabla[visitante].jugados++;
                tabla[local].gf += golesLocal;
                tabla[local].gc += golesVisitante;
                tabla[visitante].gf += golesVisitante;
                tabla[visitante].gc += golesLocal;

                if (golesLocal > golesVisitante) {
                    tabla[local].puntos += 3;
                } else if (golesLocal < golesVisitante) {
                    tabla[visitante].puntos += 3;
                } else {
                    tabla[local].puntos += 1;
                    tabla[visitante].puntos += 1;
                }
            }
        });

        Object.values(tabla).forEach(equipo => {
            equipo.dif = equipo.gf - equipo.gc;
        });

        const tablaOrdenada = Object.values(tabla).sort((a, b) => {
            if (b.puntos !== a.puntos) return b.puntos - a.puntos;
            if (b.dif !== a.dif) return b.dif - a.dif;
            return b.gf - a.gf;
        });

        
        
        
        const top3 = tablaOrdenada.slice(0, 3);
        const idSuffixes = ['One', 'Two', 'Three'];

        top3.forEach((equipo, index) => {
            const suffix = idSuffixes[index];
            
            const nameEl = document.getElementById(`team${suffix}Name`);
            const logoEl = document.getElementById(`team${suffix}Logo`);
            const playedEl = document.getElementById(`team${suffix}Played`);
            const goalsEl = document.getElementById(`team${suffix}Goals`);

            if (nameEl) nameEl.textContent = traducirPais(equipo.nombre);
            if (logoEl) {
                logoEl.src = equipo.crest || '';
                logoEl.alt = `Logo de ${equipo.nombre}`;
                logoEl.style.display = 'inline-block';
                logoEl.style.width = '30px';
                logoEl.style.height = 'auto';
            }
            if (playedEl) playedEl.textContent = equipo.jugados;
            if (goalsEl) goalsEl.textContent = equipo.gf;
        });

        return tablaOrdenada;

    } catch (error) {
        console.error("Error al calcular la tabla:", error);
    }
}

document.addEventListener('DOMContentLoaded', calcularTablaDesdePartidos);