const API_TOKEN = '5c9284725d654005a499edd1905c2553';
const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const requestURL = 'https://fifa-wolrldcups.oscarperezdigitech.workers.dev/?url=' + encodeURIComponent(API_URL);

function createdWorldCupsCards({ area: { id, name, code } }) {
    return `    
       <div>
         <h3>${name}</h3>
         <p>${code}</p>
         <p>${id}</p>
       </div>
    `;
}

async function fetchworldCupsJson() {
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
    return data;   // <- esto es lo que faltaba
  } catch (error) {
    console.error('No se pudieron cargar los datos de la API:', error);
    return null;
  }
}

async function displayFifa() {
    const worldCupsSectionHTML = document.getElementById("worldCupsSectionHTML");
    const worldCupsData = await fetchworldCupsJson();

    if (worldCupsData && worldCupsData.matches) {
        const worldCupsCards = worldCupsData.matches.map(createdWorldCupsCards).join("");
        worldCupsSectionHTML.innerHTML = worldCupsCards;
    } else {
        console.error("No se encontraron datos de la API.");
    }
}

displayFifa();