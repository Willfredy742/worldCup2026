(function () {
  "use strict";

  const COLORS = {
    win: "#2ecc71",
    loss: "#e74c3c",
    champion: "#ffd700",
    runnerUp: "#c0c0c0",
    third: "#cd7f32",
  };

  let activeTeamEl = null;
  let activeClasses = [];

  function isFinalStage(match) {
    return !!(match && match.stage === "FINAL");
  }

  function isThirdStage(match) {
    return !!(
      match &&
      typeof match.stage === "string" &&
      /THIRD/.test(match.stage)
    );
  }

  function teamPlayedIn(tla, matchId) {
    const match = window.bracketData && window.bracketData.byElementId[matchId];
    if (!match) return false;

    return (
      (match.homeTeam && match.homeTeam.tla === tla) ||
      (match.awayTeam && match.awayTeam.tla === tla)
    );
  }

  function buildRoute(tla, targetMatchId) {
    const route = [targetMatchId];
    let current = targetMatchId;

    while (true) {
      const sources = window.bracketLines.sourcesOf(current);
      if (!sources.length) break;

      const prev = sources.find(function (id) {
        return teamPlayedIn(tla, id);
      });

      if (!prev) break;

      route.unshift(prev);
      current = prev;
    }

    return route;
  }

  function getCanonicalMatchId(matchEl) {
    if (matchEl.id === "final") return "final";
    if (matchEl.id === "thirdAndFourPlace") return "thirdAndFourPlace";

    const fifaEl = matchEl.closest("[data-fifa-number]");
    return (fifaEl && fifaEl.dataset.fifaNumber) || matchEl.id;
  }

  function getMatchData(matchEl, matchId) {
    const byId = (window.bracketData && window.bracketData.byElementId) || {};
    const fifaEl = matchEl.closest("[data-fifa-number]");

    let match =
      byId[matchId] ||
      byId[matchEl.id] ||
      (fifaEl ? byId[fifaEl.dataset.fifaNumber] : null);

    if (!match && matchEl.id === "final") {
      match = Object.values(byId).find(isFinalStage);
    }

    if (!match && matchEl.id === "thirdAndFourPlace") {
      match = Object.values(byId).find(isThirdStage);
    }

    return match || null;
  }

  function activate(teamEl) {
    if (!window.bracketLines) return;

    const tlaEl = teamEl.querySelector(".team-tla");
    const tla = tlaEl ? tlaEl.textContent.trim() : "";
    if (!tla || tla === "Por determinar") return;

    const matchEl =
      teamEl.closest("#final, #thirdAndFourPlace") ||
      teamEl.closest(".match, [data-fifa-number]");

    if (!matchEl) return;

    const matchId = getCanonicalMatchId(matchEl);
    const match = getMatchData(matchEl, matchId);
    const hasResult = !!(match && match.score && match.score.winner);

    let won = true;

    if (hasResult) {
      const isHome = teamEl.dataset.slot === "home";
      won = isHome
        ? match.score.winner === "HOME_TEAM"
        : match.score.winner === "AWAY_TEAM";
    }

    const isFinal = matchEl.id === "final" || isFinalStage(match);
    const isThird = matchEl.id === "thirdAndFourPlace" || isThirdStage(match);

    let color;
    let borderClass;
    let scaleClass = null;

    if (isFinal && hasResult) {
      if (won) {
        color = COLORS.champion;
        borderClass = "hl-champion";
        scaleClass = "scale-champion";
      } else {
        color = COLORS.runnerUp;
        borderClass = "hl-runner-up";
        scaleClass = "scale-runner-up";
      }
    } else if (isThird && hasResult && won) {
      color = COLORS.third;
      borderClass = "hl-third";
      scaleClass = "scale-third";
    } else {
      color = won ? COLORS.win : COLORS.loss;
      borderClass = won ? "hl-win" : "hl-loss";
    }

    teamEl.classList.add(borderClass);
    activeClasses = [borderClass];

    if (scaleClass) {
      teamEl.classList.add(scaleClass);
      activeClasses.push(scaleClass);
    }

    const route = buildRoute(tla, matchId);
    if (route.length > 1) {
      window.bracketLines.highlightRoute(route, color);
    }

    activeTeamEl = teamEl;
  }

  function deactivate() {
    if (!activeTeamEl) return;

    activeClasses.forEach(function (c) {
      activeTeamEl.classList.remove(c);
    });

    if (window.bracketLines) {
      window.bracketLines.clearHighlight();
    }

    activeTeamEl = null;
    activeClasses = [];
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("mouseover", function (e) {
      const teamEl = e.target.closest(".team");
      if (!teamEl || teamEl === activeTeamEl) return;

      deactivate();
      activate(teamEl);
    });

    document.addEventListener("mouseout", function (e) {
      const teamEl = e.target.closest(".team");
      if (!teamEl || teamEl !== activeTeamEl) return;

      if (e.relatedTarget && teamEl.contains(e.relatedTarget)) return;

      deactivate();
    });
  });
})();