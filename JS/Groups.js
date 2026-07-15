/*
Datos del Grupo:
https://api.football-data.org/v4/competitions/WC/standings?season=2026

Grupos
https://api.football-data.org/v4/competitions/WC/matches?season=2026&stage=GROUP_STAGE
*/

const UrlApi = "e852d958e573426cb8cad7477a88e468"
const InfoGroupsURL = "https://api.football-data.org/v4/competitions/WC/standings?season=2026";
const GroupsURL = "https://api.football-data.org/v4/competitions/WC/matches?season=2026&stage=GROUP_STAGE";

const Respuesta = await fetch(UrlApi, {
    headers: {
    "X-Auth-Token": X-Auth-Token   // el nombre exacto lo dice tu API
    }
});



function CreateTittleGroups({group}){
    return `

    <caption class="TittleGroup">${group}</caption>

    `;
}



async function fetchGroupsJason(){
    try{
        const response = await fetch(GroupsURL);
            if(!response.ok){
                throw new error("Error de la solicitud: " + response.status);
            }
            return response.json();
    }
    catch(error){
        console.error("Error al obtener los datos del grupo. Código de error: " + error);
        return null;
    }
}

async function fetchInfoGroupsJason(){
    try{
        const response = await fetch(GroupsURL);
            if(!response.ok){
                throw new error("Error de la solicitud: " + response.status);
            }
            return response.json();
    }
    catch(error){
        console.error("Error al obtener los datos del grupo. Código de error: " + error);
        return null;
    }
}



async function DisplayGroups () {
    const TittleGroupsSection = document.getElementById('TittleGroupsSection');
    const TittleGroupsData = await fetchGroupsJson();

    if (TittleGroupsData && TittleGroupsSection.matches){
        const TittleGroupsDowlandConfirmed = TittleGroupsData.matches.map(CreateTittleGroups).join('');
        TittleGroupsSection.innerHTML = TittleGroupsDowlandConfirmed;
    }
    else{
        console.error("No se encontraron los datos");
    }
}