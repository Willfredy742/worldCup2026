const API_TOKEN = '24d5f01cf74e46e0979c766b3c05149e';
const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const requestURL = 'https://corsproxy.io/?url=' + encodeURIComponent(API_URL);

async function loadEliminationTree() {
  try {
    const response = await fetch(requestURL);
 
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
  if (!matchEl) return; // partido de fase de grupos u otro no presente en el árbol
 
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
    flagEl.alt = `Bandera de ${team.name}`;
    flagEl.style.display = ''; // por si se había ocultado antes
  } else {
    flagEl.removeAttribute('src');
    flagEl.style.display = 'none'; // sin equipo asignado todavía, no mostramos bandera vacía
  }
 
  tlaEl.textContent = team.tla ?? 'Por determinar';
}
 
loadEliminationTree();