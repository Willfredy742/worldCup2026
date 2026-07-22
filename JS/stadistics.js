/*
Máximos goleadores del Mundial (la API ya limita al TOP 10 con limit=10):
https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=10

Todos los partidos del torneo (grupos + eliminatorias), para calcular
las estadísticas globales de cada equipo:
https://api.football-data.org/v4/competitions/WC/matches?season=2026
*/



const API_TOKEN = 'e852d958e573426cb8cad7477a88e468';
const SCORERS_URL = 'https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=10';
const MATCHES_URL = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';
const WORKER_URL = 'https://fifaworldcup2026.gonzalezgomezjesus16061997.workers.dev/?url=';

const TOP_TEAMS_COUNT = 10;



/* ---------- TOP 10 goleadores ---------- */

async function loadTopScorers() {
    try {
        const data = await fetchFromApi(SCORERS_URL);
        const tableBody = document.getElementById('TopScorersBody');

        data.scorers.forEach((scorer, index) => tableBody.appendChild(createScorerRow(scorer, index + 1)));
    }

    catch (error) {
        console.error('No se pudieron cargar los datos de la API:', error);
    }
}


function createScorerRow(scorer, topPosition) {
    const row = document.createElement('tr');

    row.appendChild(createCell('Pos', topPosition));
    row.appendChild(createPlayerCell(scorer.player, scorer.team));
    row.appendChild(createCell('Goals', scorer.goals ?? 0));
    row.appendChild(createCell('Assists', scorer.assists ?? 0));
    row.appendChild(createCell('PlayedMatches', scorer.playedMatches ?? 0));

    return row;
}


function createPlayerCell(player, team) {
    const cell = document.createElement('td');
    cell.className = 'Player';

    const playerData = document.createElement('div');
    playerData.className = 'PlayerData';

    const teamCrest = document.createElement('img');
    teamCrest.className = 'TeamCrest';
    teamCrest.src = team.crest;
    teamCrest.alt = `Bandera de ${team.name}`;

    const playerName = document.createElement('span');
    playerName.className = 'PlayerName';
    playerName.textContent = player.name;

    playerData.appendChild(teamCrest);
    playerData.appendChild(playerName);
    cell.appendChild(playerData);

    return cell;
}



/* ---------- Mejores equipos del torneo completo ---------- */

async function loadBestTeams() {
    try {
        const data = await fetchFromApi(MATCHES_URL);
        const teamStats = buildTeamStats(data.matches);
        const bestTeams = teamStats.sort(compareTeams).slice(0, TOP_TEAMS_COUNT);

        const tableBody = document.getElementById('BestTeamsBody');
        bestTeams.forEach((stats, index) => tableBody.appendChild(createTeamRow(stats, index + 1)));
    }

    catch (error) {
        console.error('No se pudieron cargar los datos de la API:', error);
    }
}


function buildTeamStats(matches) {
    const statsByTeamId = new Map();

    matches
        .filter(match => match.status === 'FINISHED' && match.score.winner !== null)
        .forEach(match => registerMatch(statsByTeamId, match));

    return [...statsByTeamId.values()];
}


function registerMatch(statsByTeamId, match) {
    const homeGoals = match.score.fullTime.home ?? 0;
    const awayGoals = match.score.fullTime.away ?? 0;
    const winner = match.score.winner;

    const homeResult = winner === 'DRAW' ? 'drawn' : (winner === 'HOME_TEAM' ? 'won' : 'lost');
    const awayResult = winner === 'DRAW' ? 'drawn' : (winner === 'AWAY_TEAM' ? 'won' : 'lost');

    registerTeamResult(statsByTeamId, match.homeTeam, homeGoals, awayGoals, homeResult);
    registerTeamResult(statsByTeamId, match.awayTeam, awayGoals, homeGoals, awayResult);
}


function registerTeamResult(statsByTeamId, team, goalsFor, goalsAgainst, result) {
    if (!statsByTeamId.has(team.id)) {
        statsByTeamId.set(team.id, createEmptyStats(team));
    }

    const stats = statsByTeamId.get(team.id);

    stats.played += 1;
    stats.goalsFor += goalsFor;
    stats.goalsAgainst += goalsAgainst;
    stats[result] += 1;
}


function createEmptyStats(team) {
    return {
        team: team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0
    };
}


function compareTeams(teamA, teamB) {
    const byWins = teamB.won - teamA.won;
    if (byWins !== 0) {
        return byWins;
    }

    const goalDifferenceA = teamA.goalsFor - teamA.goalsAgainst;
    const goalDifferenceB = teamB.goalsFor - teamB.goalsAgainst;
    const byGoalDifference = goalDifferenceB - goalDifferenceA;
    if (byGoalDifference !== 0) {
        return byGoalDifference;
    }

    return teamB.goalsFor - teamA.goalsFor;
}


function createTeamRow(teamStats, rankingPosition) {
    const row = document.createElement('tr');
    const goalDifference = teamStats.goalsFor - teamStats.goalsAgainst;

    row.appendChild(createCell('Pos', rankingPosition));
    row.appendChild(createTeamCell(teamStats.team));
    row.appendChild(createCell('Played', teamStats.played));
    row.appendChild(createCell('Victory', teamStats.won));
    row.appendChild(createCell('Tie', teamStats.drawn));
    row.appendChild(createCell('Defeats', teamStats.lost));
    row.appendChild(createCell('GoalsFor', teamStats.goalsFor));
    row.appendChild(createCell('GoalsAgainst', teamStats.goalsAgainst));
    row.appendChild(createCell('GoalDifference', goalDifference));

    return row;
}


function createTeamCell(team) {
    const cell = document.createElement('td');
    cell.className = 'Team';

    const teamData = document.createElement('div');
    teamData.className = 'TeamData';

    const teamCrest = document.createElement('img');
    teamCrest.className = 'TeamCrest';
    teamCrest.src = team.crest;
    teamCrest.alt = `Bandera de ${team.name}`;

    const teamName = document.createElement('span');
    teamName.className = 'TeamName';
    teamName.textContent = team.name;

    teamData.appendChild(teamCrest);
    teamData.appendChild(teamName);
    cell.appendChild(teamData);

    return cell;
}



/* ---------- Utilidades compartidas ---------- */

async function fetchFromApi(apiUrl) {
    const requestUrl = WORKER_URL + encodeURIComponent(apiUrl);

    const response = await fetch(requestUrl, {
        headers: {
            'X-Auth-Token': API_TOKEN
        }
    });

    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} en ${apiUrl}`);
    }

    return response.json();
}


function createCell(className, value) {
    const cell = document.createElement('td');
    cell.className = className;
    cell.textContent = value;

    return cell;
}



loadTopScorers();
loadBestTeams();