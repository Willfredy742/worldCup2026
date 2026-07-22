(function () {
  "use strict";

  const radius = 10;
  const strokeColor = "#555";
  const strokeWidth = 2;
  const highlightWidth = 3.5;
  const straightLineThreshold = 1;
  const redrawDelayMs = 100;
  const svgNamespace = "http://www.w3.org/2000/svg";

  const bracketSide = Object.freeze({
    a: "A",
    b: "B"
  });

  const connections = Object.freeze([
    Object.freeze({ from: "p74", to: "p89", side: bracketSide.a }),
    Object.freeze({ from: "p77", to: "p89", side: bracketSide.a }),
    Object.freeze({ from: "p73", to: "p90", side: bracketSide.a }),
    Object.freeze({ from: "p75", to: "p90", side: bracketSide.a }),
    Object.freeze({ from: "p83", to: "p93", side: bracketSide.a }),
    Object.freeze({ from: "p84", to: "p93", side: bracketSide.a }),
    Object.freeze({ from: "p81", to: "p94", side: bracketSide.a }),
    Object.freeze({ from: "p82", to: "p94", side: bracketSide.a }),
    Object.freeze({ from: "p89", to: "p97", side: bracketSide.a }),
    Object.freeze({ from: "p90", to: "p97", side: bracketSide.a }),
    Object.freeze({ from: "p93", to: "p98", side: bracketSide.a }),
    Object.freeze({ from: "p94", to: "p98", side: bracketSide.a }),
    Object.freeze({ from: "p97", to: "p101", side: bracketSide.a }),
    Object.freeze({ from: "p98", to: "p101", side: bracketSide.a }),
    Object.freeze({ from: "p101", to: "final", side: bracketSide.a }),
    Object.freeze({ from: "p101", to: "thirdAndFourthPlace", side: bracketSide.a }),

    Object.freeze({ from: "p76", to: "p91", side: bracketSide.b }),
    Object.freeze({ from: "p78", to: "p91", side: bracketSide.b }),
    Object.freeze({ from: "p79", to: "p92", side: bracketSide.b }),
    Object.freeze({ from: "p80", to: "p92", side: bracketSide.b }),
    Object.freeze({ from: "p86", to: "p95", side: bracketSide.b }),
    Object.freeze({ from: "p88", to: "p95", side: bracketSide.b }),
    Object.freeze({ from: "p85", to: "p96", side: bracketSide.b }),
    Object.freeze({ from: "p87", to: "p96", side: bracketSide.b }),
    Object.freeze({ from: "p91", to: "p99", side: bracketSide.b }),
    Object.freeze({ from: "p92", to: "p99", side: bracketSide.b }),
    Object.freeze({ from: "p95", to: "p100", side: bracketSide.b }),
    Object.freeze({ from: "p96", to: "p100", side: bracketSide.b }),
    Object.freeze({ from: "p99", to: "p102", side: bracketSide.b }),
    Object.freeze({ from: "p100", to: "p102", side: bracketSide.b }),
    Object.freeze({ from: "p102", to: "final", side: bracketSide.b }),
    Object.freeze({ from: "p102", to: "thirdAndFourthPlace", side: bracketSide.b })
  ]);

  const sources = {};

  connections.forEach(function (connection) {
    if (!sources[connection.to]) {
      sources[connection.to] = [];
    }

    sources[connection.to].push(connection.from);
  });

  let svg = null;
  let cachedElements = null;
  let currentHighlight = null;
  let redrawTimeout = null;
  let observer = null;
  let observerTarget = null;

  const observerOptions = Object.freeze({
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "style", "class"]
  });

  function buildIndex() {
    const elementsByKey = {};

    document.querySelectorAll("[data-fifa-number]").forEach(function (element) {
      const key = (element.getAttribute("data-fifa-number") || "").trim();

      if (key) {
        elementsByKey[key] = element;
      }
    });

    const finalElement = document.getElementById("final");
    const thirdPlaceElement = document.getElementById("thirdAndFourthPlace");

    if (finalElement) {
      elementsByKey.final = finalElement;
    }

    if (thirdPlaceElement) {
      elementsByKey.thirdAndFourthPlace = thirdPlaceElement;
    }

    return elementsByKey;
  }

  function getMatchElement(matchKey) {
    if (!cachedElements) {
      cachedElements = buildIndex();
    }

    return cachedElements[matchKey] || null;
  }

  function parseTransformMatrix(transform) {
    if (transform.startsWith("matrix3d(")) {
      const parts = transform.slice(9, -1).split(",").map(parseFloat);

      return {
        a: parts[0],
        b: parts[1],
        c: parts[4],
        d: parts[5]
      };
    }

    if (transform.startsWith("matrix(")) {
      const parts = transform.slice(7, -1).split(",").map(parseFloat);

      return {
        a: parts[0],
        b: parts[1],
        c: parts[2],
        d: parts[3]
      };
    }

    return null;
  }

  function getUntransformedRect(node) {
    const rect = node.getBoundingClientRect();
    const transform = window.getComputedStyle(node).transform;

    if (!transform || transform === "none") {
      return rect;
    }

    const matrix = parseTransformMatrix(transform);

    if (!matrix) {
      return rect;
    }

    const scaleX = Math.hypot(matrix.a, matrix.b) || 1;
    const scaleY = Math.hypot(matrix.c, matrix.d) || 1;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const width = rect.width / scaleX;
    const height = rect.height / scaleY;

    return {
      left: centerX - width / 2,
      top: centerY - height / 2,
      right: centerX + width / 2,
      bottom: centerY + height / 2
    };
  }

  function getBox(element, containerRect) {
    const teamElements = element.querySelectorAll(".team");
    const measuredElements = teamElements.length
      ? teamElements
      : element.querySelectorAll("[data-slot]");

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    if (measuredElements.length) {
      measuredElements.forEach(function (node) {
        const rect = getUntransformedRect(node);

        left = Math.min(left, rect.left);
        top = Math.min(top, rect.top);
        right = Math.max(right, rect.right);
        bottom = Math.max(bottom, rect.bottom);
      });
    } else {
      const rect = getUntransformedRect(element);

      left = rect.left;
      top = rect.top;
      right = rect.right;
      bottom = rect.bottom;
    }

    return {
      left: left - containerRect.left,
      right: right - containerRect.left,
      top: top - containerRect.top,
      bottom: bottom - containerRect.top,
      centerY: (top + bottom) / 2 - containerRect.top
    };
  }

  function buildElbowPath(x1, y1, x2, y2, side) {
    const midX = (x1 + x2) / 2;

    if (Math.abs(y2 - y1) < straightLineThreshold) {
      return `M ${x1}, ${y1} L ${x2}, ${y2}`;
    }

    const cornerRadius = Math.min(
      radius,
      Math.abs(y2 - y1) / 2,
      Math.abs(midX - x1),
      Math.abs(x2 - midX)
    );

    const direction = y2 > y1 ? 1 : -1;

    if (side === bracketSide.a) {
      return [
        `M ${x1}, ${y1}`,
        `H ${midX - cornerRadius}`,
        `Q ${midX}, ${y1} ${midX}, ${y1 + direction * cornerRadius}`,
        `V ${y2 - direction * cornerRadius}`,
        `Q ${midX}, ${y2} ${midX + cornerRadius}, ${y2}`,
        `H ${x2}`
      ].join(" ");
    }

    return [
      `M ${x1}, ${y1}`,
      `H ${midX + cornerRadius}`,
      `Q ${midX}, ${y1} ${midX}, ${y1 + direction * cornerRadius}`,
      `V ${y2 - direction * cornerRadius}`,
      `Q ${midX}, ${y2} ${midX - cornerRadius}, ${y2}`,
      `H ${x2}`
    ].join(" ");
  }

  function setAttributes(element, attributes) {
    Object.entries(attributes).forEach(function (entry) {
      element.setAttribute(entry[0], entry[1]);
    });
  }

  function applyHighlight() {
    if (!svg) {
      return;
    }

    svg.querySelectorAll("path").forEach(function (path) {
      path.setAttribute("stroke", strokeColor);
      path.setAttribute("stroke-width", strokeWidth);
    });

    if (!currentHighlight) {
      return;
    }

    currentHighlight.pairs.forEach(function (pair) {
      const path = svg.querySelector(
        `path[data-from="${pair.from}"][data-to="${pair.to}"]`
      );

      if (!path) {
        return;
      }

      path.setAttribute("stroke", currentHighlight.color);
      path.setAttribute("stroke-width", highlightWidth);
    });
  }

  function highlightRoute(matchIds, color) {
    if (!Array.isArray(matchIds) || !color) {
      return;
    }

    const pairs = [];

    for (let index = 0; index < matchIds.length - 1; index += 1) {
      pairs.push({
        from: matchIds[index],
        to: matchIds[index + 1]
      });
    }

    currentHighlight = {
      pairs: pairs,
      color: color
    };

    applyHighlight();
  }

  function clearHighlight() {
    currentHighlight = null;
    applyHighlight();
  }

  function drawLines() {
    const main = document.querySelector("main");

    if (!main) {
      return;
    }

    if (observer) {
      observer.disconnect();
    }

    try {
      if (!svg) {
        svg = document.createElementNS(svgNamespace, "svg");

        setAttributes(svg, {
          class: "bracketLines"
        });

        Object.assign(svg.style, {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "visible",
          zIndex: "0"
        });

        if (main.style.position !== "relative") {
          main.style.position = "relative";
        }

        main.appendChild(svg);
      }

      svg.replaceChildren();
      cachedElements = null;

      const containerRect = main.getBoundingClientRect();

      connections.forEach(function (connection) {
        const fromElement = getMatchElement(connection.from);
        const toElement = getMatchElement(connection.to);

        if (!fromElement || !toElement) {
          return;
        }

        const fromBox = getBox(fromElement, containerRect);
        const toBox = getBox(toElement, containerRect);

        let x1;
        let y1;
        let x2;
        let y2;

        if (connection.side === bracketSide.a) {
          x1 = fromBox.right;
          y1 = fromBox.centerY;
          x2 = toBox.left;
          y2 = toBox.centerY;
        } else {
          x1 = fromBox.left;
          y1 = fromBox.centerY;
          x2 = toBox.right;
          y2 = toBox.centerY;
        }

        const path = document.createElementNS(svgNamespace, "path");

        setAttributes(path, {
          d: buildElbowPath(x1, y1, x2, y2, connection.side),
          fill: "none",
          stroke: strokeColor,
          "stroke-width": strokeWidth,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "data-from": connection.from,
          "data-to": connection.to
        });

        svg.appendChild(path);
      });

      applyHighlight();
    } finally {
      if (observer) {
        observerTarget = main;
        observer.observe(observerTarget, observerOptions);
      }
    }
  }

  function scheduleRedraw() {
    clearTimeout(redrawTimeout);
    redrawTimeout = setTimeout(drawLines, redrawDelayMs);
  }

  function isRelevantMutation(mutation) {
    if (mutation.type !== "attributes") {
      return true;
    }

    if (mutation.attributeName !== "class") {
      return true;
    }

    const target = mutation.target;

    return !(target instanceof Element && target.classList.contains("team"));
  }

  function handleMainMutations(mutations) {
    if (!mutations.some(isRelevantMutation)) {
      return;
    }

    scheduleRedraw();
  }

  function observeMain(main) {
    if (observer) {
      observer.disconnect();
    }

    observerTarget = main;
    observer = new MutationObserver(handleMainMutations);
    observer.observe(observerTarget, observerOptions);
  }

  window.addEventListener("load", drawLines);
  window.addEventListener("resize", scheduleRedraw);

  document.addEventListener("DOMContentLoaded", function () {
    const main = document.querySelector("main");

    if (!main) {
      return;
    }

    observeMain(main);
  });

  window.bracketLines = Object.freeze({
    redraw: drawLines,
    highlightRoute: highlightRoute,
    clearHighlight: clearHighlight,
    sourcesOf: function (matchId) {
      return (sources[matchId] || []).slice();
    }
  });
})();