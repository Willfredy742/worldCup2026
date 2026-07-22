const API_TOKEN = '24d5f01cf74e46e0979c766b3c05149e';
const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const requestURL = 'https://fifaworldcup2026.gonzalezgomezjesus16061997.workers.dev/?url=' + encodeURIComponent(API_URL);

// Estado compartido: pathHighlight.js lee de aquí los resultados.
// Clave = identificador usado en el HTML (data-fifa-number o id).
window.bracketData = window.bracketData || { byElementId: {} };

async function loadEliminationTree() {
  try {
    const response = await fetch(requestURL, {
      headers: {
        'X-Auth-Token': API_TOKEN
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const knockoutMatches = data.matches.filter(match => match.stage !== 'GROUP_STAGE');

    knockoutMatches.forEach(fillMatch);
    applyMedalBorders();

    if (window.bracketLines) {
      window.bracketLines.redraw();
    }

    document.dispatchEvent(new CustomEvent('bracket:data-loaded'));
  } catch (error) {
    console.error('No se pudieron cargar los datos de la API:', error);
  }
}

function fillMatch(match) {
  const matchEl = document.getElementById(match.id);
  if (!matchEl) return;

  const elKey = matchEl.dataset.fifaNumber || matchEl.id;
  window.bracketData.byElementId[elKey] = match;

  const homeEl = matchEl.querySelector('[data-slot="home"]');
  const awayEl = matchEl.querySelector('[data-slot="away"]');

  fillTeam(homeEl, match.homeTeam);
  fillTeam(awayEl, match.awayTeam);

  homeEl.classList.remove('winner');
  awayEl.classList.remove('winner');

  if (match.score.winner === 'HOME_TEAM') {
    homeEl.classList.add('winner');
  } else if (match.score.winner === 'AWAY_TEAM') {
    awayEl.classList.add('winner');
  }
}

function fillTeam(teamEl, team) {
  const flagEl = teamEl.querySelector('.team-flag');
  const tlaEl = teamEl.querySelector('.team-tla');

  if (team.crest) {
    flagEl.src = team.crest;
    const countryName = window.translateCountry ? window.translateCountry(team.name) : team.name;
    flagEl.alt = `Bandera de ${countryName}`;
    flagEl.style.display = '';
  } else {
    flagEl.removeAttribute('src');
    flagEl.style.display = 'none';
  }

  tlaEl.textContent = team.tla ?? 'Por determinar';
}

function applyMedalBorders() {
  const byId = window.bracketData.byElementId;
  const all = Object.values(byId);

  const finalMatch = byId["final"] || all.find(isFinalStage);
  const thirdMatch = byId["thirdAndFourPlace"] || all.find(isThirdStage);

  if (finalMatch && finalMatch.score && finalMatch.score.winner) {
    const champion =
      finalMatch.score.winner === "HOME_TEAM"
        ? finalMatch.homeTeam
        : finalMatch.awayTeam;

    const runnerUp =
      finalMatch.score.winner === "HOME_TEAM"
        ? finalMatch.awayTeam
        : finalMatch.homeTeam;

    markTeam(champion.tla, "champion");
    markTeam(runnerUp.tla, "runner-up");
  }

  if (thirdMatch && thirdMatch.score && thirdMatch.score.winner) {
    const third =
      thirdMatch.score.winner === "HOME_TEAM"
        ? thirdMatch.homeTeam
        : thirdMatch.awayTeam;

    markTeam(third.tla, "third-place");
  }
}

loadEliminationTree();