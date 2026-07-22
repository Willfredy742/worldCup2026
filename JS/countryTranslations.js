(function () {
  "use strict";
  
  const COUNTRY_ES = {
    Algeria: "Argelia",
    Argentina: "Argentina",
    Australia: "Australia",
    Austria: "Austria",
    Belgium: "Bélgica",
    "Bosnia-Herzegovina": "Bosnia y Herzegovina",
    Brazil: "Brasil",
    Canada: "Canadá",
    "Cape Verde Islands": "Cabo Verde",
    Colombia: "Colombia",
    "Congo DR": "República Democrática del Congo",
    Croatia: "Croacia",
    Curaçao: "Curazao",
    Czechia: "Chequia",
    Ecuador: "Ecuador",
    Egypt: "Egipto",
    England: "Inglaterra",
    France: "Francia",
    Germany: "Alemania",
    Ghana: "Ghana",
    Haiti: "Haití",
    Iran: "Irán",
    Iraq: "Irak",
    "Ivory Coast": "Costa de Marfil",
    Japan: "Japón",
    Jordan: "Jordania",
    Mexico: "México",
    Morocco: "Marruecos",
    Netherlands: "Países Bajos",
    "New Zealand": "Nueva Zelanda",
    Norway: "Noruega",
    Panama: "Panamá",
    Paraguay: "Paraguay",
    Portugal: "Portugal",
    Qatar: "Catar",
    "Saudi Arabia": "Arabia Saudí",
    Scotland: "Escocia",
    Senegal: "Senegal",
    "South Africa": "Sudáfrica",
    "South Korea": "Corea del Sur",
    Spain: "España",
    Sweden: "Suecia",
    Switzerland: "Suiza",
    Tunisia: "Túnez",
    Turkey: "Turquía",
    "United States": "Estados Unidos",
    Uruguay: "Uruguay",
    Uzbekistan: "Uzbekistán",
  };

  function translateCountry(name) {
    if (name == null) return name;
    return COUNTRY_ES[name] ?? name; // si no está, devuelve el original
  }

  window.translateCountry = translateCountry;
})();