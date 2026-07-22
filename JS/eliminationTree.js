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

renderStatus(matchEl, match.status);     // estado arriba del partido
renderScore(homeEl, match.score, 'home');
renderScore(awayEl, match.score, 'away');

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

const STATUS_ES = {
  SCHEDULED: 'Programado',
  TIMED: 'Programado',
  IN_PROGRESS: 'En juego',
  LIVE: 'En juego',
  PAUSED: 'Descanso',
  FINISHED: 'Finalizado',
  POSTPONED: 'Aplazado',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
  AWARDED: 'Resuelto por sanción',
};

function matchStatusEs(status) {
  return STATUS_ES[status] || status || '';
}

function footballGoals(score, side) {
  if (!score) return null;
  if (score.duration === 'PENALTY_SHOOTOUT') {
    const rt = score.regularTime || {};
    const et = score.extraTime || {};
    return (rt[side] || 0) + (et[side] || 0);
  }
  const ft = score.fullTime || {};
  return ft[side] ?? null;
}

function penaltyGoals(score, side) {
  if (!score || score.duration !== 'PENALTY_SHOOTOUT') return null;
  const p = score.penalties || {};
  return p[side] ?? null;
}

function renderStatus(matchEl, status) {
  if (!matchEl) return;
  let statusEl = matchEl.querySelector('.match-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.className = 'match-status';
    matchEl.insertBefore(statusEl, matchEl.firstChild);
  }
  statusEl.textContent = matchStatusEs(status);
}

function renderScore(teamEl, score, side) {
  if (!teamEl) return;
  let scoreEl = teamEl.querySelector('.team-score');
  if (!scoreEl) {
    scoreEl = document.createElement('span');
    scoreEl.className = 'team-score';
    teamEl.appendChild(scoreEl);
  }

  const goals = footballGoals(score, side);
  const pen = penaltyGoals(score, side);

  let html = '<span class="team-goals">' + (goals == null ? '-' : goals) + '</span>';
  if (pen != null) {
    html += '<span class="team-pen" title="Penaltis">(' + pen + ')</span>';
  }
  scoreEl.innerHTML = html;
}

loadEliminationTree();