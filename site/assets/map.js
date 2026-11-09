"use strict";

function mountWorldMap(root, data) {
  const viewport = root.querySelector("#map-viewport");
  const stage = root.querySelector("#map-stage");
  const info = root.querySelector("#map-info");
  const layers = root.querySelector("#map-layers");
  const search = root.querySelector("#map-search");
  const matches = root.querySelector("#map-matches");
  if (matchMedia("(max-width: 660px)").matches) root.querySelector(".map-layers").open = false;
  root.querySelector("#map-source").href = data.source;
  const image = el("img", "map-background");
  image.src = "assets/map/worldmap2.jpg";
  image.width = data.width;
  image.height = data.height;
  image.alt = "Фон карты мира Battles for Glory";
  image.draggable = false;
  stage.append(image);

  const points = new Map();
  const controls = [];
  const overlays = [];
  let alchemy;
  let selected;
  let scale = 1;
  let drag;

  for (const layer of data.layers) {
    const overlay = el("div", "map-overlay");
    overlay.style.setProperty("--map-color", layer.color);
    const label = el("label", "map-layer-option");
    const checkbox = el("input");
    checkbox.type = "checkbox";
    checkbox.checked = layer.visible;
    overlay.hidden = !checkbox.checked;
    checkbox.addEventListener("change", () => {
      overlay.hidden = !checkbox.checked;
      if (overlay.hidden && selected?.overlay === overlay) clearSelection();
    });
    const swatch = el("span", "map-layer-swatch");
    const icon = layer.icon ? 'url("assets/map/' + layer.icon + '")' : "";
    if (icon) {
      swatch.classList.add("map-layer-icon");
      swatch.style.backgroundImage = icon;
    }
    label.append(checkbox, swatch, el("span", "", layer.title));
    label.style.setProperty("--map-color", layer.color);
    if (layer.group && !alchemy) {
      alchemy = el("fieldset", "map-layer-group");
      alchemy.append(el("legend", "", layer.group));
      layers.append(alchemy);
    }
    (layer.group ? alchemy : layers).append(label);
    controls.push({ checkbox, overlay, visible: layer.visible });
    overlays.push(overlay);

    for (const marker of layer.markers) {
      const button = el("button", "map-marker");
      button.type = "button";
      button.tabIndex = -1;
      button.dataset.marker = marker.id;
      button.style.left = marker.x / data.width * 100 + "%";
      button.style.top = marker.y / data.height * 100 + "%";
      const description = marker.level ? marker.name + " · " + marker.level + " ур." : marker.name;
      button.title = description;
      button.setAttribute("aria-label", description);
      if (icon) {
        button.classList.add("map-marker-icon", "map-marker-" + layer.id);
        button.style.backgroundImage = icon;
      }
      const optionLabel = description + " · " + layer.title;
      const searchText = normalize([optionLabel, layer.group].join(" "));
      points.set(marker.id, { marker, layer, button, checkbox, overlay, optionLabel, searchText });
      overlay.append(button);
    }
  }
  stage.append(...overlays.reverse());

  function clearSelection() {
    selected?.button.classList.remove("map-marker-selected");
    selected = undefined;
    matches.value = "";
    info.textContent = "Выберите метку на карте или в результатах поиска.";
  }

  function selectPoint(point, center) {
    selected?.button.classList.remove("map-marker-selected");
    selected = point;
    const { marker, layer, button, checkbox, overlay } = point;
    checkbox.checked = true;
    overlay.hidden = false;
    button.classList.add("map-marker-selected");
    matches.value = marker.id;
    info.replaceChildren(el("strong", "", marker.name), el("p", "", layer.title + (marker.level ? " · Уровень " + marker.level : "")));
    if (marker.details?.length) {
      if (layer.id === "towns" || layer.id === "castles") info.append(el("p", "", "Расписание из архива"));
      for (const detail of marker.details) info.append(el("p", "", detail));
    }
    if (layer.id === "books") {
      const mark = el("button", "class-option");
      mark.type = "button";
      const updateLabel = (marked) => {
        mark.textContent = marked ? "Снять отметку" : "Отметить книгу";
        mark.setAttribute("aria-pressed", String(marked));
      };
      updateLabel(button.classList.contains("map-book-marked"));
      mark.addEventListener("click", () => updateLabel(button.classList.toggle("map-book-marked")));
      info.append(mark);
    }
    if (center) zoomTo(Math.max(scale, 1), marker.x, marker.y);
  }

  function updateMatches() {
    const query = normalize(search.value.trim());
    const options = document.createDocumentFragment();
    let found = false;
    for (const [id, point] of points) {
      if (!point.searchText.includes(query)) continue;
      options.append(new Option(point.optionLabel, id));
      found = true;
    }
    matches.replaceChildren(new Option(found ? "Выберите метку" : "Совпадений нет", ""), options);
    matches.disabled = !found;
    if (selected?.searchText.includes(query)) matches.value = selected.marker.id;
  }

  const fitScale = () => Math.min(viewport.clientWidth / data.width, viewport.clientHeight / data.height);
  function zoomTo(nextScale, x, y, anchor) {
    const mapX = x ?? (viewport.scrollLeft + viewport.clientWidth / 2 - stage.offsetLeft) / scale;
    const mapY = y ?? (viewport.scrollTop + viewport.clientHeight / 2) / scale;
    scale = Math.min(3, Math.max(fitScale(), nextScale));
    stage.style.width = data.width * scale + "px";
    stage.style.setProperty("--map-marker-scale", Math.max(0.55, Math.min(1, scale)));
    viewport.scrollLeft = stage.offsetLeft + mapX * scale - (anchor?.x ?? viewport.clientWidth / 2);
    viewport.scrollTop = mapY * scale - (anchor?.y ?? viewport.clientHeight / 2);
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
    zoomTo(scale * Math.exp(-step / 500), x, y, anchor);
  }, { passive: false });

  root.querySelector("#map-zoom-in").addEventListener("click", () => zoomTo(scale * 1.35));
  root.querySelector("#map-zoom-out").addEventListener("click", () => zoomTo(scale / 1.35));
  root.querySelector("#map-fit").addEventListener("click", () => zoomTo(fitScale(), data.width / 2, data.height / 2));
  for (const [selector, showAll] of [["#map-all-layers", true], ["#map-default-layers", false]]) {
    root.querySelector(selector).addEventListener("click", () => {
      for (const { checkbox, overlay, visible } of controls) {
        checkbox.checked = showAll || visible;
        overlay.hidden = !checkbox.checked;
      }
      if (selected?.overlay.hidden) clearSelection();
    });
  }
  search.addEventListener("input", updateMatches);
  search.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && matches.options.length > 1) selectPoint(points.get(matches.options[1].value), true);
  });
  matches.addEventListener("change", () => {
    if (matches.value) selectPoint(points.get(matches.value), true);
  });
  stage.addEventListener("click", (event) => {
    const marker = event.target.closest(".map-marker");
    if (marker) selectPoint(points.get(marker.dataset.marker), false);
  });

  viewport.addEventListener("pointerdown", (event) => {
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

  updateMatches();
  zoomTo(fitScale(), data.width / 2, data.height / 2);
}
