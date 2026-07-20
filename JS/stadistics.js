



const API_TOKEN = 'e852d958e573426cb8cad7477a88e468';
const SCORERS_URL = 'https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=10';
const WORKER_URL = 'https://fifaworldcup2026.gonzalezgomezjesus16061997.workers.dev/?url=';



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


function createScorerRow(scorer, topPosition) {
    const row = document.createElement('tr');

    row.appendChild(createCell('Pos', topPosition));
    row.appendChild(createPlayerCell(scorer.player, scorer.team));
    row.appendChild(createCell('Goals', scorer.goals ?? 0));
    row.appendChild(createCell('Assists', scorer.assists ?? 0));
    row.appendChild(createCell('PlayedMatches', scorer.playedMatches ?? 0));

    return row;
}


function createCell(className, value) {
    const cell = document.createElement('td');
    cell.className = className;
    cell.textContent = value;

    return cell;
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



loadTopScorers();