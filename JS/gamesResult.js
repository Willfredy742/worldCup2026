const API_TOKEN = '5c9284725d654005a499edd1905c2553';
const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const requestURL = 'https://fifa-wolrldcups.oscarperezdigitech.workers.dev/?url=' + encodeURIComponent(API_URL);


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
    return data;   // 
  } catch (error) {
    console.error('No se pudieron cargar los datos de la API:', error);
    return null;
  }
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const NOMBRES_FASE = {
  GROUP_STAGE: 'Primera fase',
  LAST_32: 'Dieciseisavos de final',
  LAST_16: 'Octavos de final',
  QUARTER_FINALS: 'Cuartos de final',
  SEMI_FINALS: 'Semifinal',
  THIRD_PLACE: 'Tercer y cuarto puesto',
  FINAL: 'Final'
};


let todosLosPartidos = [];

const NOMBRES_GRUPO = {
  GROUP_A: 'Grupo A', GROUP_B: 'Grupo B', GROUP_C: 'Grupo C', GROUP_D: 'Grupo D',
  GROUP_E: 'Grupo E', GROUP_F: 'Grupo F', GROUP_G: 'Grupo G', GROUP_H: 'Grupo H',
  GROUP_I: 'Grupo I', GROUP_J: 'Grupo J', GROUP_K: 'Grupo K', GROUP_L: 'Grupo L'
};

function agruparPartidosPorFecha(matches){
        const partidosPorFecha = {};

        matches.forEach(match => {

            const claveFecha = match.utcDate.slice(0, 10); 
            if (!partidosPorFecha[claveFecha]) {
                partidosPorFecha[claveFecha] = [];
            }
            partidosPorFecha[claveFecha].push(match);
        });
        return partidosPorFecha;
}

function obtenerDiasAMostrar(partidosPorFecha) {
        const hoy = new Date();
        const hoyStr = hoy.toISOString().slice(0, 10); 

        const fechasOrdenadas = Object.keys(partidosPorFecha).sort(); 

        const diasPasados = fechasOrdenadas.filter(fecha => fecha < hoyStr);
        const diasFuturos = fechasOrdenadas.filter(fecha => fecha > hoyStr);
        const diasHoy = fechasOrdenadas.filter(fecha => fecha === hoyStr);

        const ultimosPasados = diasPasados.slice(-10);

        const proximosDiasFuturos = diasFuturos.slice (0, 2);

        return [...ultimosPasados, ...diasHoy, ...proximosDiasFuturos];


}


function formatearFechaLarga(claveFecha) {

  const [anio, mes, dia] = claveFecha.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  const nombreDia = DIAS_SEMANA[fecha.getUTCDay()];
  const nombreMes = MESES[mes - 1];
  const diaTexto = String(dia).padStart(2, '0');

  return `${nombreDia} ${diaTexto} ${nombreMes} ${anio}`;
}

function formatearHora(utcDate) {
  const fecha = new Date(utcDate);
  const horas = String(fecha.getUTCHours()).padStart(2, '0');
  const minutos = String(fecha.getUTCMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function crearPartidoHTML(match) {
  const home = match.homeTeam;
  const away = match.awayTeam;

  let resultadoHTML;
  let estadoTexto;

  if (match.status === 'FINISHED') {
    const golesLocal = match.score.fullTime.home;
    const golesVisitante = match.score.fullTime.away;
    resultadoHTML = `<span class="resultado">${golesLocal} - ${golesVisitante}</span>`;
    estadoTexto = 'FINAL';
  } else if (match.status === 'TIMED' || match.status === 'SCHEDULED') {
    resultadoHTML = `<span class="resultado">${formatearHora(match.utcDate)}</span>`;
    estadoTexto = '';
  } else {
    
    resultadoHTML = `<span class="resultado">--</span>`;
    estadoTexto = match.status;
  }

  const fase = NOMBRES_FASE[match.stage] || match.stage;
  const grupo = match.group ? NOMBRES_GRUPO[match.group] || match.group : '';
  const faseGrupoTexto = grupo ? `${fase} · ${grupo}` : fase;

  return `
    <div class="partido">
      <div class="fila-partido">
        <div class="equipo equipo-local">
          <span class="nombre-equipo">${home.name}</span>
          <img class="escudo" src="${home.crest}" alt="${home.name}">
        </div>

         <div>
            <span class= "estado">${estadoTexto}</span>
            <div class="marcador">${estadoTexto ? `<span class="estado"></span>` : ''}
                 ${resultadoHTML}
            </div>
        </div>

        <div class="equipo equipo-visitante">
          <img class="escudo" src="${away.crest}" alt="${away.name}">
          <span class="nombre-equipo">${away.name}</span>
        </div>
      </div>

      <div class="info-partido">
        <span class="fase-grupo">${faseGrupoTexto}</span>
      </div>
    </div>
  `;
}

function crearBloqueFecha(claveFecha, partidosDelDia) {
  const partidosHTML = partidosDelDia.map(crearPartidoHTML).join('');

  return `
    <section class="dia">
      <h2 class="fecha-dia">${formatearFechaLarga(claveFecha)}</h2>
      <div class="partidos-del-dia">
        ${partidosHTML}
      </div>
    </section>
  `;
}


function renderizarPartidos(matches) {
  const worldCupsSectionHTML = document.getElementById('worldCupsSectionHTML');

  const partidosPorFecha = agruparPartidosPorFecha(matches);
  const diasAMostrar = obtenerDiasAMostrar(partidosPorFecha);

  const bloquesHTML = diasAMostrar
    .map(fecha => crearBloqueFecha(fecha, partidosPorFecha[fecha]))
    .join('');

  worldCupsSectionHTML.innerHTML = bloquesHTML;
}


function filtrarPartidosPorEstado(matches, filtro) {
  if (filtro === 'todos') {
    return matches;
  }

  if (filtro === 'programados') {
    return matches.filter(match =>
      match.status === 'SCHEDULED' || match.status === 'TIMED'
    );
  }

  if (filtro === 'en-vivo') {
    return matches.filter(match =>
      match.status === 'LIVE' ||
      match.status === 'IN_PLAY' ||
      match.status === 'PAUSED'
    );
  }

  if (filtro === 'finalizados') {
    return matches.filter(match => match.status === 'FINISHED');
  }

  
  return matches;
}


function marcarBotonActivo(botonSeleccionado) {
  const botones = document.querySelectorAll('.filtro-btn');
  botones.forEach(boton => boton.classList.remove('activo'));
  botonSeleccionado.classList.add('activo');
}


function inicializarFiltros() {
  const botones = document.querySelectorAll('.filtro-btn');

  botones.forEach(boton => {
    boton.addEventListener('click', () => {
      const filtroElegido = boton.dataset.filtro; 

      marcarBotonActivo(boton);

      const partidosFiltrados = filtrarPartidosPorEstado(todosLosPartidos, filtroElegido);
      renderizarPartidos(partidosFiltrados);
    });
  });
}

async function displayFifa() {
  const worldCupsData = await fetchworldCupsJson(); // única llamada a la API

  if (worldCupsData && worldCupsData.matches) {
    todosLosPartidos = worldCupsData.matches; 
    renderizarPartidos(todosLosPartidos);     
    inicializarFiltros();                     
  } else {
    console.error("No se encontraron datos de la API.");
  }
}

displayFifa();


