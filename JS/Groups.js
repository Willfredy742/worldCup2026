/*
Estadísticas de los equipos (clasificación TOTAL, sin grupos):
https://api.football-data.org/v4/competitions/WC/standings?season=2026

Partidos de fase de grupos (cada partido indica su grupo):
https://api.football-data.org/v4/competitions/WC/matches?season=2026&stage=GROUP_STAGE
*/



const API_TOKEN = 'e852d958e573426cb8cad7477a88e468';
const STANDINGS_URL = 'https://api.football-data.org/v4/competitions/WC/standings?season=2026';
const MATCHES_URL = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026&stage=GROUP_STAGE';
const WORKER_URL = 'https://fifaworldcup2026.gonzalezgomezjesus16061997.workers.dev/?url=';



async function loadGroupStandings() {
    try {
        const [standingsData, matchesData] = await Promise.all([
            fetchFromApi(STANDINGS_URL),
            fetchFromApi(MATCHES_URL)
        ]);

        const totalStanding = standingsData.standings.find(standing => standing.type === 'TOTAL');
        const groupLetterByTeamId = buildGroupMap(matchesData.matches);
        const teamEntriesByGroup = groupTeamEntries(totalStanding.table, groupLetterByTeamId);

        teamEntriesByGroup.forEach((teamEntries, groupLetter) => createGroupTable(groupLetter, teamEntries));
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


function buildGroupMap(matches) {
    const groupLetterByTeamId = new Map();

    matches
        .filter(match => match.group !== null)
        .forEach(match => {
            const groupLetter = match.group.slice(-1);

            groupLetterByTeamId.set(match.homeTeam.id, groupLetter);
            groupLetterByTeamId.set(match.awayTeam.id, groupLetter);
        });

    return groupLetterByTeamId;
}


function groupTeamEntries(tableEntries, groupLetterByTeamId) {
    const teamEntriesByGroup = new Map();

    tableEntries.forEach(teamEntry => {
        const groupLetter = groupLetterByTeamId.get(teamEntry.team.id);

        if (groupLetter === undefined) {
            return;
        }

        if (!teamEntriesByGroup.has(groupLetter)) {
            teamEntriesByGroup.set(groupLetter, []);
        }

        teamEntriesByGroup.get(groupLetter).push(teamEntry);
    });

    return new Map([...teamEntriesByGroup.entries()].sort());
}


function createGroupTable(groupLetter, teamEntries) {
    const template = document.getElementById('GroupTableTemplate');
    const groupTable = template.content.cloneNode(true);

    groupTable.querySelector('.TitleGroup').textContent = `Grupo: ${groupLetter}`;

    const tableBody = groupTable.querySelector('.BodyTableInfo');
    teamEntries.forEach((teamEntry, index) => tableBody.appendChild(createTableRow(teamEntry, index + 1)));

    document.getElementById('AllTables').appendChild(groupTable);
}


function createTableRow(teamEntry, groupPosition) {
    const row = document.createElement('tr');

    row.appendChild(createCell('Pos', groupPosition));
    row.appendChild(createCountryCell(teamEntry.team));
    row.appendChild(createCell('Victory', teamEntry.won));
    row.appendChild(createCell('Tie', teamEntry.draw));
    row.appendChild(createCell('Defeats', teamEntry.lost));
    row.appendChild(createCell('Goals', teamEntry.goalsFor));
    row.appendChild(createCell('Points', teamEntry.points));

    return row;
}


function createCell(className, value) {
    const cell = document.createElement('td');
    cell.className = className;
    cell.textContent = value;

    return cell;
}


function createCountryCell(team) {
    const cell = document.createElement('td');
    cell.className = 'Country';

    const countryData = document.createElement('div');
    countryData.className = 'CountryData';

    const flag = document.createElement('img');
    flag.className = 'FlagCountry';
    flag.src = team.crest;
    flag.alt = `Bandera de ${team.name}`;

    const countryName = document.createElement('span');
    countryName.className = 'NameCountry';
    countryName.textContent = team.name;

    countryData.appendChild(flag);
    countryData.appendChild(countryName);
    cell.appendChild(countryData);

    return cell;
}



loadGroupStandings();