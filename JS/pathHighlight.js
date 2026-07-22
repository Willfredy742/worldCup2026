(function () {
  "use strict";

  const colors = Object.freeze({
    win: "#2ecc71",
    loss: "#e74c3c",
    champion: "#ffd700",
    runnerUp: "#c0c0c0",
    third: "#cd7f32"
  });

  const cssClass = Object.freeze({
    team: "team",
    teamTla: "teamTla",
    hlWin: "hlWin",
    hlLoss: "hlLoss",
    hlChampion: "hlChampion",
    hlRunnerUp: "hlRunnerUp",
    hlThird: "hlThird",
    scaleChampion: "scaleChampion",
    scaleRunnerUp: "scaleRunnerUp",
    scaleThird: "scaleThird"
  });

  const domSelector = Object.freeze({
    finalOrThirdPlace: "#final, #thirdAndFourthPlace",
    match: ".match, [data-fifa-number]",
    fifaNumber: "[data-fifa-number]"
  });

  const matchStage = Object.freeze({
    final: "FINAL",
    third: "THIRD"
  });

  const winnerSource = Object.freeze({
    home: "HOME_TEAM",
    away: "AWAY_TEAM"
  });

  const slotName = Object.freeze({
    home: "home",
    away: "away"
  });

  const undeterminedLabel = "Por determinar";

  let activeTeamElement = null;
  let activeClassNames = [];

  function isFinalStage(match) {
    return Boolean(match && match.stage === matchStage.final);
  }

  function isThirdStage(match) {
    return Boolean(
      match &&
      typeof match.stage === "string" &&
      match.stage.toUpperCase().includes(matchStage.third)
    );
  }

  function hasTeamPlayedInMatch(tla, matchId) {
    const match = window.bracketData?.byElementId?.[matchId];

    if (!match) {
      return false;
    }

    return match.homeTeam?.tla === tla || match.awayTeam?.tla === tla;
  }

  function buildRoute(tla, targetMatchId) {
    const route = [targetMatchId];
    const visitedMatchIds = new Set([targetMatchId]);
    let currentMatchId = targetMatchId;

    while (true) {
      const sourceMatchIds = window.bracketLines?.sourcesOf?.(currentMatchId) ?? [];

      if (!sourceMatchIds.length) {
        break;
      }

      const previousMatchId = sourceMatchIds.find(function (sourceMatchId) {
        return hasTeamPlayedInMatch(tla, sourceMatchId);
      });

      if (!previousMatchId || visitedMatchIds.has(previousMatchId)) {
        break;
      }

      route.unshift(previousMatchId);
      visitedMatchIds.add(previousMatchId);
      currentMatchId = previousMatchId;
    }

    return route;
  }

  function getCanonicalMatchId(matchElement) {
    if (matchElement.id === "final") {
      return "final";
    }

    if (matchElement.id === "thirdAndFourthPlace") {
      return "thirdAndFourthPlace";
    }

    const fifaElement = matchElement.closest(domSelector.fifaNumber);

    return (
      fifaElement?.dataset.fifaNumber ||
      matchElement.dataset.matchId ||
      matchElement.id
    );
  }

  function getMatchData(matchElement, matchId) {
    const matchesByElementId = window.bracketData?.byElementId ?? {};
    const fifaElement = matchElement.closest(domSelector.fifaNumber);
    const datasetMatchId = matchElement.dataset.matchId;

    let match =
      matchesByElementId[matchId] ||
      (matchElement.id ? matchesByElementId[matchElement.id] : null) ||
      (datasetMatchId ? matchesByElementId[datasetMatchId] : null) ||
      (fifaElement ? matchesByElementId[fifaElement.dataset.fifaNumber] : null);

    if (!match && matchElement.id === "final") {
      match = Object.values(matchesByElementId).find(isFinalStage);
    }

    if (!match && matchElement.id === "thirdAndFourthPlace") {
      match = Object.values(matchesByElementId).find(isThirdStage);
    }

    return match || null;
  }

  function getHighlightStyle(isFinal, isThird, hasResult, won) {
    if (isFinal && hasResult) {
      if (won) {
        return {
          color: colors.champion,
          borderClass: cssClass.hlChampion,
          scaleClass: cssClass.scaleChampion
        };
      }

      return {
        color: colors.runnerUp,
        borderClass: cssClass.hlRunnerUp,
        scaleClass: cssClass.scaleRunnerUp
      };
    }

    if (isThird && hasResult && won) {
      return {
        color: colors.third,
        borderClass: cssClass.hlThird,
        scaleClass: cssClass.scaleThird
      };
    }

    return {
      color: won ? colors.win : colors.loss,
      borderClass: won ? cssClass.hlWin : cssClass.hlLoss,
      scaleClass: null
    };
  }

  function activateTeamHighlight(teamElement) {
    if (!window.bracketLines) {
      return;
    }

    const tlaElement = teamElement.querySelector(`.${cssClass.teamTla}`);
    const tla = tlaElement ? tlaElement.textContent.trim() : "";

    if (!tla || tla === undeterminedLabel) {
      return;
    }

    const matchElement =
      teamElement.closest(domSelector.finalOrThirdPlace) ||
      teamElement.closest(domSelector.match);

    if (!matchElement) {
      return;
    }

    const matchId = getCanonicalMatchId(matchElement);
    const match = getMatchData(matchElement, matchId);
    const hasResult = Boolean(match?.score?.winner);

    let won = true;

    if (hasResult) {
      const isHome = teamElement.dataset.slot === slotName.home;

      won = isHome
        ? match.score.winner === winnerSource.home
        : match.score.winner === winnerSource.away;
    }

    const isFinal = matchElement.id === "final" || isFinalStage(match);
    const isThird = matchElement.id === "thirdAndFourthPlace" || isThirdStage(match);
    const highlightStyle = getHighlightStyle(isFinal, isThird, hasResult, won);

    teamElement.classList.add(highlightStyle.borderClass);
    activeClassNames = [highlightStyle.borderClass];

    if (highlightStyle.scaleClass) {
      teamElement.classList.add(highlightStyle.scaleClass);
      activeClassNames.push(highlightStyle.scaleClass);
    }

    const route = buildRoute(tla, matchId);

    if (route.length > 1) {
      window.bracketLines.highlightRoute(route, highlightStyle.color);
    }

    activeTeamElement = teamElement;
  }

  function deactivateTeamHighlight() {
    if (!activeTeamElement) {
      return;
    }

    activeClassNames.forEach(function (activeClassName) {
      activeTeamElement.classList.remove(activeClassName);
    });

    window.bracketLines?.clearHighlight?.();

    activeTeamElement = null;
    activeClassNames = [];
  }

  function getTeamElementFromEvent(event) {
    const targetElement = event.target instanceof Element ? event.target : null;

    return targetElement?.closest(`.${cssClass.team}`) || null;
  }

  function initializeHighlight() {
    document.addEventListener("mouseover", function (event) {
      const teamElement = getTeamElementFromEvent(event);

      if (!teamElement || teamElement === activeTeamElement) {
        return;
      }

      deactivateTeamHighlight();
      activateTeamHighlight(teamElement);
    });

    document.addEventListener("mouseout", function (event) {
      const teamElement = getTeamElementFromEvent(event);

      if (!teamElement || teamElement !== activeTeamElement) {
        return;
      }

      if (event.relatedTarget && teamElement.contains(event.relatedTarget)) {
        return;
      }

      deactivateTeamHighlight();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeHighlight, { once: true });
  } else {
    initializeHighlight();
  }
})();