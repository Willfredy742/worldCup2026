/*
Datos del Grupo:
https://api.football-data.org/v4/competitions/WC/standings?season=2026

Grupos - NO USAR DE MOMENTO:
https://api.football-data.org/v4/competitions/WC/matches?season=2026&stage=GROUP_STAGE
*/



const API_TOKEN = 'e852d958e573426cb8cad7477a88e468';
const API_URL = 'https://api.football-data.org/v4/competitions/WC/standings?season=2026';
const requestURL = 'https://fifaworldcup2026.gonzalezgomezjesus16061997.workers.dev/?url=' + encodeURIComponent(API_URL);



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
    }
    
    catch (error) {
        console.error('No se pudieron cargar los datos de la API:', error);
    }
}

