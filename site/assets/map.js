"use strict";

function mountWorldMap(root, data) {
  const viewport = root.querySelector("#map-viewport");
  const stage = root.querySelector("#map-stage");
  const info = root.querySelector("#map-info");
  const layers = root.querySelector("#map-layers");
  const primaryLayers = root.querySelector("#map-primary-layers");
  const extraLayers = root.querySelector(".map-extra-layers");
  const searchPanel = root.querySelector(".map-search");
  const search = root.querySelector("#map-search");
  const matches = root.querySelector("#map-matches");
  const primary = new Map([
    ["towns", "Город"], ["castles", "Замок"], ["bosses", "Босс"], ["squads", "Сквад"], ["outposts", "Аванпост"],
  ]);
  root.querySelector("#map-source").href = data.source;
  const image = el("img", "map-background");
  image.src = "assets/map/worldmap2.jpg";
  image.width = data.width;
  image.height = data.height;
  image.alt = "Фон карты мира Battles for Glory";
  image.draggable = false;
  stage.append(image);

  const points = new Map();
  const controls = new Map();
  let alchemy;
  let selected;
  let scale = 1;
  let view = "region";
  let drag;

  function setLayer(control, visible) {
    control.button.setAttribute("aria-pressed", String(visible));
    control.overlay.hidden = !visible;
  }

  for (const layer of data.layers) {
    const overlay = el("div", "map-overlay");
    overlay.style.setProperty("--map-color", layer.color);
    const toggle = el("button", "map-layer-option");
    toggle.type = "button";
    const swatch = el("span", "map-layer-swatch");
    swatch.setAttribute("aria-hidden", "true");
    swatch.style.setProperty("--map-color", layer.color);
    const icon = layer.icon ? 'url("assets/map/' + layer.icon + '")' : "";
    if (icon) {
      swatch.classList.add("map-layer-icon");
      swatch.style.backgroundImage = icon;
    }
    toggle.append(swatch, el("span", "", layer.title));
    const control = { button: toggle, overlay, visible: layer.visible, swatch };
    controls.set(layer.id, control);
    setLayer(control, layer.visible);
    toggle.addEventListener("click", () => {
      setLayer(control, overlay.hidden);
      if (overlay.hidden && selected?.control === control) clearSelection();
    });
    if (layer.group && !alchemy) {
      alchemy = el("fieldset", "map-layer-group");
      alchemy.append(el("legend", "", layer.group));
      layers.append(alchemy);
    }
    if (!primary.has(layer.id)) (layer.group ? alchemy : layers).append(toggle);

    for (const marker of layer.markers) {
      const button = el("button", "map-marker");
      button.type = "button";
      button.tabIndex = -1;
      button.dataset.marker = marker.id;
      button.style.left = marker.x / data.width * 100 + "%";
      button.style.top = marker.y / data.height * 100 + "%";
      const description = marker.level ? marker.name + " · " + marker.level + " ур." : marker.name;
      button.title = description;
      button.dataset.label = layer.id === "towns" ? marker.name.replace(/^Город /, "") : marker.name;
      button.setAttribute("aria-label", description);
      if (icon) {
        button.classList.add("map-marker-icon", "map-marker-" + layer.id);
        button.style.backgroundImage = icon;
      }
      const category = layer.title + (marker.level ? " · " + marker.level + " ур." : "");
      const searchText = normalize([description, layer.title, layer.group].join(" "));
      points.set(marker.id, { marker, layer, button, control, category, searchText });
      overlay.append(button);
    }
  }
  stage.append(...[...controls.values()].reverse().map(control => control.overlay));
  for (const id of primary.keys()) {
    const control = controls.get(id);
    if (control) primaryLayers.append(control.button);
  }

  function clearSelection() {
    selected?.button.classList.remove("map-marker-selected");
    selected = undefined;
    info.hidden = true;
    info.replaceChildren();
  }

  function selectPoint(point, center) {
    selected?.button.classList.remove("map-marker-selected");
    selected = point;
    const { marker, layer, button, control } = point;
    setLayer(control, true);
    button.classList.add("map-marker-selected");
    const meta = el("div", "map-info-meta");
    meta.append(el("strong", "", primary.get(layer.id) || layer.title));
    if (marker.level) meta.append(el("span", "", "Уровень " + marker.level));
    if (marker.details?.length && (layer.id === "towns" || layer.id === "castles")) {
      meta.append(el("span", "", "Расписание из архива"));
    }
    const title = el("h2");
    title.append(control.swatch.cloneNode(), el("span", "", marker.name));
    info.hidden = false;
    info.replaceChildren(meta, title);
    for (const detail of marker.details || []) info.append(el("p", "", detail));
    if (layer.id === "books") {
      const mark = el("button");
      mark.type = "button";
      const updateLabel = (marked) => {
        mark.textContent = marked ? "Снять отметку" : "Отметить книгу";
        mark.setAttribute("aria-pressed", String(marked));
      };
      updateLabel(button.classList.contains("map-book-marked"));
      mark.addEventListener("click", () => updateLabel(button.classList.toggle("map-book-marked")));
      info.append(mark);
    }
    if (center) {
      view = "manual";
      zoomTo(Math.max(scale, 1), marker.x, marker.y);
    }
  }

  function updateMatches() {
    const query = normalize(search.value.trim());
    const options = document.createDocumentFragment();
    for (const point of points.values()) {
      if (!point.searchText.includes(query)) continue;
      const result = el("button", "", point.marker.name);
      result.type = "button";
      if (options.childElementCount) result.tabIndex = -1;
      result.dataset.marker = point.marker.id;
      result.append(el("small", "", point.category));
      options.append(result);
    }
    if (!options.childElementCount) options.append(el("p", "", "Совпадений нет"));
    matches.replaceChildren(options);
    matches.hidden = false;
    matches.scrollTop = 0;
  }

  function selectResult(result) {
    const point = points.get(result?.dataset.marker);
    if (!point) return;
    search.value = point.marker.name;
    search.focus({ preventScroll: true });
    matches.hidden = true;
    selectPoint(point, true);
  }

  const fitScale = () => Math.min(viewport.clientWidth / data.width, viewport.clientHeight / data.height);
  function zoomTo(nextScale, x, y, anchor) {
    const mapX = x ?? (viewport.scrollLeft + viewport.clientWidth / 2 - stage.offsetLeft) / scale;
    const mapY = y ?? (viewport.scrollTop + viewport.clientHeight / 2 - stage.offsetTop) / scale;
    scale = Math.min(3, Math.max(fitScale(), nextScale));
    stage.style.width = data.width * scale + "px";
    stage.style.marginTop = Math.max(0, (viewport.clientHeight - data.height * scale) / 2) + "px";
    stage.style.setProperty("--map-marker-scale", Math.max(0.55, Math.min(1, scale / .48)));
    stage.classList.toggle("map-show-labels", scale >= .42);
    viewport.scrollLeft = stage.offsetLeft + mapX * scale - (anchor?.x ?? viewport.clientWidth / 2);
    viewport.scrollTop = stage.offsetTop + mapY * scale - (anchor?.y ?? viewport.clientHeight / 2);
  }

  function fitMap() {
    view = "full";
    zoomTo(fitScale(), data.width / 2, data.height / 2);
  }

  function showRegion() {
    // Frame the central and southern regions shown in the Expedition design.
    const regionScale = Math.max(viewport.clientWidth / 1900, viewport.clientHeight / 1180);
    zoomTo(regionScale, data.width * .527, data.height * .634);
  }

  viewport.addEventListener("wheel", (event) => {
    const { deltaMode, deltaY } = event;
    if (event.ctrlKey || event.metaKey || !deltaY) return;
    event.preventDefault();
    const bounds = viewport.getBoundingClientRect();
    const mapBounds = stage.getBoundingClientRect();
    const anchor = {
      x: event.clientX - bounds.left - viewport.clientLeft,
      y: event.clientY - bounds.top - viewport.clientTop,
    };
    const x = (event.clientX - mapBounds.left) / scale;
    const y = (event.clientY - mapBounds.top) / scale;
    let delta = deltaY;
    if (deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
    if (deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= viewport.clientHeight;
    const step = Math.max(-150, Math.min(150, delta));
    view = "manual";
    zoomTo(scale * Math.exp(-step / 500), x, y, anchor);
  }, { passive: false });

  for (const [selector, factor] of [["#map-zoom-in", 1.35], ["#map-zoom-out", 1 / 1.35]]) {
    root.querySelector(selector).addEventListener("click", () => {
      view = "manual";
      zoomTo(scale * factor);
    });
  }
  root.querySelector("#map-fit").addEventListener("click", fitMap);
  for (const [selector, showAll] of [["#map-all-layers", true], ["#map-default-layers", false]]) {
    root.querySelector(selector).addEventListener("click", () => {
      for (const control of controls.values()) setLayer(control, showAll || control.visible);
      if (selected?.control.overlay.hidden) clearSelection();
    });
  }
  search.addEventListener("input", updateMatches);
  search.addEventListener("focus", (event) => {
    if (!searchPanel.contains(event.relatedTarget)) updateMatches();
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      if (matches.hidden) updateMatches();
      selectResult(matches.querySelector("button"));
    }
    if (event.key === "ArrowDown") {
      if (matches.hidden) updateMatches();
      const first = matches.querySelector("button");
      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  matches.addEventListener("click", (event) => selectResult(event.target.closest("button")));
  matches.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.target.nextElementSibling?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      (event.target.previousElementSibling || search).focus();
    }
  });
  searchPanel.addEventListener("focusout", (event) => {
    if (!searchPanel.contains(event.relatedTarget)) matches.hidden = true;
  });
  searchPanel.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || matches.hidden) return;
    event.preventDefault();
    search.focus({ preventScroll: true });
    matches.hidden = true;
  });
  extraLayers.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !extraLayers.open) return;
    extraLayers.open = false;
    extraLayers.querySelector("summary").focus();
  });
  root.querySelector(".world-map").addEventListener("click", (event) => {
    if (!searchPanel.contains(event.target)) matches.hidden = true;
    if (!extraLayers.contains(event.target)) extraLayers.open = false;
  });
  stage.addEventListener("click", (event) => {
    const marker = event.target.closest(".map-marker");
    if (marker) selectPoint(points.get(marker.dataset.marker), false);
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") view = "manual";
    if (event.pointerType !== "mouse" || event.button !== 0 || !stage.contains(event.target)) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId || !event.buttons) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!viewport.hasPointerCapture(drag.id)) {
      if (Math.hypot(dx, dy) < 5) return;
      viewport.setPointerCapture(drag.id);
      viewport.classList.add("map-dragging");
      view = "manual";
    }
    viewport.scrollLeft = drag.left - dx;
    viewport.scrollTop = drag.top - dy;
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) {
    viewport.addEventListener(event, () => {
      drag = undefined;
      viewport.classList.remove("map-dragging");
    });
  }

  showRegion();
  const observer = new ResizeObserver(() => {
    if (view === "region") showRegion();
    else if (view === "full") fitMap();
    else zoomTo(scale);
  });
  observer.observe(viewport);
  return () => observer.disconnect();
}
