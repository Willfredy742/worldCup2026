const API_TOKEN = '24d5f01cf74e46e0979c766b3c05149e';
const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const REQUEST_URL = `https://fifaworldcup2026.gonzalezgomezjesus16061997.workers.dev/?url=${encodeURIComponent(API_URL)}`;

const MATCH_SIDE = {
  home: 'home',
  away: 'away'
};

const WINNER = {
  homeTeam: 'HOME_TEAM',
  awayTeam: 'AWAY_TEAM'
};

const TEAM_RANK = {
  champion: 'champion',
  runnerUp: 'runnerUp',
  thirdPlace: 'thirdPlace'
};

const MATCH_STATUS_TRANSLATIONS_ES = {
  SCHEDULED: 'Programado',
  TIMED: 'Programado',
  IN_PROGRESS: 'En juego',
  LIVE: 'En juego',
  PAUSED: 'Descanso',
  FINISHED: 'Finalizado',
  POSTPONED: 'Aplazado',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
  AWARDED: 'Resuelto por sanción'
};

window.bracketData = window.bracketData || {
  byElementId: {}
};

async function loadEliminationTree() {
  try {
    const response = await fetch(REQUEST_URL, {
      headers: {
        'X-Auth-Token': API_TOKEN
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const knockoutMatches = data.matches.filter(isKnockoutMatch);

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

function isKnockoutMatch(match) {
  return match.stage !== 'GROUP_STAGE';
}

function fillMatch(match) {
  const matchElement = getMatchElement(match.id);

  if (!matchElement) {
    return;
  }

  saveMatchData(matchElement, match);

  const homeElement = matchElement.querySelector('[data-slot="home"]');
  const awayElement = matchElement.querySelector('[data-slot="away"]');

  fillTeam(homeElement, match.homeTeam);
  fillTeam(awayElement, match.awayTeam);

  renderStatus(matchElement, match.status);
  renderScore(homeElement, match.score, MATCH_SIDE.home);
  renderScore(awayElement, match.score, MATCH_SIDE.away);

  updateWinnerStyles(homeElement, awayElement, match.score.winner);
}

function getMatchElement(matchId) {
  return document.querySelector(`[data-match-id="${matchId}"]`);
}

function saveMatchData(matchElement, match) {
  const elementKey = matchElement.dataset.fifaNumber || matchElement.dataset.matchId;
  window.bracketData.byElementId[elementKey] = match;
}

function updateWinnerStyles(homeElement, awayElement, winner) {
  homeElement.classList.remove('winner');
  awayElement.classList.remove('winner');

  if (winner === WINNER.homeTeam) {
    homeElement.classList.add('winner');
  }

  if (winner === WINNER.awayTeam) {
    awayElement.classList.add('winner');
  }
}

function fillTeam(teamElement, team) {
  const flagElement = teamElement.querySelector('.teamFlag');
  const tlaElement = teamElement.querySelector('.teamTla');

  if (team.crest) {
    flagElement.src = team.crest;
    flagElement.alt = `Bandera de ${getCountryName(team.name)}`;
    flagElement.style.display = '';
  } else {
    flagElement.removeAttribute('src');
    flagElement.style.display = 'none';
  }

  tlaElement.textContent = team.tla ?? 'Por determinar';
}

function getCountryName(countryName) {
  return window.translateCountry
    ? window.translateCountry(countryName)
    : countryName;
}

function applyMedalBorders() {
  const matchesById = window.bracketData.byElementId;
  const allMatches = Object.values(matchesById);

  const finalMatch = matchesById.final || allMatches.find(isFinalStage);
  const thirdPlaceMatch = matchesById.thirdAndFourthPlace || allMatches.find(isThirdStage);

  if (hasWinner(finalMatch)) {
    const champion = getWinnerTeam(finalMatch);
    const runnerUp = getLoserTeam(finalMatch);

    markTeam(champion.tla, TEAM_RANK.champion);
    markTeam(runnerUp.tla, TEAM_RANK.runnerUp);
  }

  if (hasWinner(thirdPlaceMatch)) {
    const thirdPlaceTeam = getWinnerTeam(thirdPlaceMatch);
    markTeam(thirdPlaceTeam.tla, TEAM_RANK.thirdPlace);
  }
}

function hasWinner(match) {
  return Boolean(match?.score?.winner);
}

function getWinnerTeam(match) {
  return match.score.winner === WINNER.homeTeam
    ? match.homeTeam
    : match.awayTeam;
}

function getLoserTeam(match) {
  return match.score.winner === WINNER.homeTeam
    ? match.awayTeam
    : match.homeTeam;
}

function matchStatusEs(status) {
  return MATCH_STATUS_TRANSLATIONS_ES[status] || status || '';
}

function footballGoals(score, side) {
  if (!score) {
    return null;
  }

  if (score.duration === 'PENALTY_SHOOTOUT') {
    const regularTime = score.regularTime || {};
    const extraTime = score.extraTime || {};

    return (regularTime[side] || 0) + (extraTime[side] || 0);
  }

  const fullTime = score.fullTime || {};

  return fullTime[side] ?? null;
}

function penaltyGoals(score, side) {
  if (!score || score.duration !== 'PENALTY_SHOOTOUT') {
    return null;
  }

  const penalties = score.penalties || {};

  return penalties[side] ?? null;
}

function renderStatus(matchElement, status) {
  if (!matchElement) {
    return;
  }

  let statusElement = matchElement.querySelector('.matchStatus');

  if (!statusElement) {
    statusElement = document.createElement('div');
    statusElement.className = 'matchStatus';
    matchElement.insertBefore(statusElement, matchElement.firstChild);
  }

  statusElement.textContent = matchStatusEs(status);
}

function renderScore(teamElement, score, side) {
  if (!teamElement) {
    return;
  }

  let scoreElement = teamElement.querySelector('.teamScore');

  if (!scoreElement) {
    scoreElement = document.createElement('span');
    scoreElement.className = 'teamScore';
    teamElement.appendChild(scoreElement);
  }

  const goals = footballGoals(score, side);
  const penalties = penaltyGoals(score, side);

  scoreElement.replaceChildren(
    createGoalsElement(goals),
    ...(penalties != null ? [createPenaltiesElement(penalties)] : [])
  );
}

function createGoalsElement(goals) {
  const goalsElement = document.createElement('span');
  goalsElement.className = 'teamGoals';
  goalsElement.textContent = goals == null ? '-' : goals;

  return goalsElement;
}

function createPenaltiesElement(penalties) {
  const penaltiesElement = document.createElement('span');
  penaltiesElement.className = 'teamPen';
  penaltiesElement.title = 'Penaltis';
  penaltiesElement.textContent = `(${penalties})`;

  return penaltiesElement;
}

document.addEventListener('DOMContentLoaded', loadEliminationTree);