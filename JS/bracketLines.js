(function () {
  "use strict";

  const RADIUS = 10;
  const STROKE_COLOR = "#555";
  const STROKE_WIDTH = 2;

  const CONNECTIONS = [
    // LADO A
    ["p74", "p89", "A"],
    ["p77", "p89", "A"],
    ["p73", "p90", "A"],
    ["p75", "p90", "A"],
    ["p83", "p93", "A"],
    ["p84", "p93", "A"],
    ["p81", "p94", "A"],
    ["p82", "p94", "A"],
    ["p89", "p97", "A"],
    ["p90", "p97", "A"],
    ["p93", "p98", "A"],
    ["p94", "p98", "A"],
    ["p97", "p101", "A"],
    ["p98", "p101", "A"],
    ["p101", "final", "A"],
    ["p101", "thirdAndFourPlace", "A"],
    // LADO B
    ["p76", "p91", "B"],
    ["p78", "p91", "B"],
    ["p79", "p92", "B"],
    ["p80", "p92", "B"],
    ["p86", "p95", "B"],
    ["p88", "p95", "B"],
    ["p85", "p96", "B"],
    ["p87", "p96", "B"],
    ["p91", "p99", "B"],
    ["p92", "p99", "B"],
    ["p95", "p100", "B"],
    ["p96", "p100", "B"],
    ["p99", "p102", "B"],
    ["p100", "p102", "B"],
    ["p102", "final", "B"],
    ["p102", "thirdAndFourPlace", "B"],
  ];

  let svg = null;
  let cachedEls = null;

  function buildIndex() {
    const map = {};
    document.querySelectorAll("[data-fifa-number]").forEach(function (el) {
      const key = (el.getAttribute("data-fifa-number") || "").trim();
      if (key) map[key] = el;
    });
    const f = document.getElementById("final");
    const t = document.getElementById("thirdAndFourPlace");
    if (f) map["final"] = f;
    if (t) map["thirdAndFourPlace"] = t;
    return map;
  }

  function getMatchEl(id) {
    if (!cachedEls) cachedEls = buildIndex();
    return cachedEls[id] || null;
  }

  function getBox(el, containerRect) {
    let nodes = el.querySelectorAll(".team");
    if (!nodes.length) nodes = el.querySelectorAll("[data-slot]");

    let left, top, right, bottom;

    if (nodes.length) {
      left = Infinity;
      top = Infinity;
      right = -Infinity;
      bottom = -Infinity;
      nodes.forEach(function (n) {
        const r = n.getBoundingClientRect();
        if (r.left < left) left = r.left;
        if (r.top < top) top = r.top;
        if (r.right > right) right = r.right;
        if (r.bottom > bottom) bottom = r.bottom;
      });
    } else {
      const r = el.getBoundingClientRect();
      left = r.left;
      top = r.top;
      right = r.right;
      bottom = r.bottom;
    }

    return {
      left: left - containerRect.left,
      right: right - containerRect.left,
      top: top - containerRect.top,
      bottom: bottom - containerRect.top,
      centerY: (top + bottom) / 2 - containerRect.top,
    };
  }

  function buildElbowPath(x1, y1, x2, y2, side) {
    const midX = (x1 + x2) / 2;
    if (Math.abs(y2 - y1) < 1) {
      return "M " + x1 + "," + y1 + " L " + x2 + "," + y2;
    }
    const r = Math.min(
      RADIUS,
      Math.abs(y2 - y1) / 2,
      Math.abs(midX - x1),
      Math.abs(x2 - midX),
    );
    const dir = y2 > y1 ? 1 : -1;
    if (side === "A") {
      return [
        "M " + x1 + "," + y1,
        "H " + (midX - r),
        "Q " + midX + "," + y1 + " " + midX + "," + (y1 + dir * r),
        "V " + (y2 - dir * r),
        "Q " + midX + "," + y2 + " " + (midX + r) + "," + y2,
        "H " + x2,
      ].join(" ");
    }
    return [
      "M " + x1 + "," + y1,
      "H " + (midX + r),
      "Q " + midX + "," + y1 + " " + midX + "," + (y1 + dir * r),
      "V " + (y2 - dir * r),
      "Q " + midX + "," + y2 + " " + (midX - r) + "," + y2,
      "H " + x2,
    ].join(" ");
  }

  function drawLines() {
    const main = document.querySelector("main");
    if (!main) return;

    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "bracket-lines");
      svg.style.position = "absolute";
      svg.style.top = "0";
      svg.style.left = "0";
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.pointerEvents = "none";
      svg.style.overflow = "visible";
      svg.style.zIndex = "0";
      main.style.position = "relative";
      main.appendChild(svg);
    }

    svg.innerHTML = "";
    cachedEls = null;
    const containerRect = main.getBoundingClientRect();

    CONNECTIONS.forEach(function (conn) {
      const fromEl = getMatchEl(conn[0]);
      const toEl = getMatchEl(conn[1]);
      if (!fromEl || !toEl) {
        return;
      }

      const from = getBox(fromEl, containerRect);
      const to = getBox(toEl, containerRect);
      let x1, y1, x2, y2;
      if (conn[2] === "A") {
        x1 = from.right;
        y1 = from.centerY;
        x2 = to.left;
        y2 = to.centerY;
      } else {
        x1 = from.left;
        y1 = from.centerY;
        x2 = to.right;
        y2 = to.centerY;
      }

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute("d", buildElbowPath(x1, y1, x2, y2, conn[2]));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", STROKE_COLOR);
      path.setAttribute("stroke-width", STROKE_WIDTH);
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      svg.appendChild(path);
    });
  }

  window.addEventListener("load", drawLines);
  window.addEventListener("resize", drawLines);
  document.addEventListener("DOMContentLoaded", function () {
    const main = document.querySelector("main");
    if (!main) return;
    let timeout = null;
    const observer = new MutationObserver(function () {
      clearTimeout(timeout);
      timeout = setTimeout(drawLines, 100);
    });
    observer.observe(main, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "style", "class"],
    });
  });
})();