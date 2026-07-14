const API_TOKEN = '24d5f01cf74e46e0979c766b3c05149e';
const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const requestURL = 'https://corsproxy.io/?url=' + encodeURIComponent(API_URL);

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
  } catch (error) {
    console.error('No se pudieron cargar los datos de la API:', error);
  }
}

function fillMatch(match) {
  const matchEl = document.getElementById(match.id);
  if (!matchEl) return;

  const homeEl = matchEl.querySelector('[data-slot="home"]');
  const awayEl = matchEl.querySelector('[data-slot="away"]');

  homeEl.textContent = match.homeTeam.name ?? 'Por determinar';
  awayEl.textContent = match.awayTeam.name ?? 'Por determinar';

  homeEl.classList.remove('winner');
  awayEl.classList.remove('winner');

  if (match.score.winner === 'HOME_TEAM') {
    homeEl.classList.add('winner');
  } else if (match.score.winner === 'AWAY_TEAM') {
    awayEl.classList.add('winner');
  }
}

loadEliminationTree();