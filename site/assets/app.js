"use strict";

const RACE_LABELS = {
  "race-aliance": "Альянс",
  "race-belatto": "Беллато",
  "race-dominion": "Доминион",
  "race-imperia": "Империя",
  "race-legion": "Легион",
  "race-orda": "Орда",
  "race-pirats": "Пираты",
  "race-union": "Союз",
};

const BRANCH_LABELS = {
  base: "Основная ветка",
  one: "Ветка I",
  two: "Ветка II",
  three: "Ветка III",
};

const app = document.querySelector("#app");
let archiveIndex;

function el(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(value));
}

function normalize(value) {
  return String(value || "").toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
}

function raceName(classes) {
  return (classes || []).map((name) => RACE_LABELS[name] || name).join(", ") || "Без фракции";
}

function cloneTemplate(id) {
  return document.querySelector(id).content.cloneNode(true);
}

function localIconUrl(value) {
  if (!String(value || "").startsWith("/icon/")) return "";
  return "assets/icons/" + value
    .slice("/icon/".length)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

function renderSkillIcon(iconValue, name, className = "skill-icon") {
  const frame = el("span", className);
  frame.append(el("span", "icon-fallback", name.slice(0, 1).toLocaleUpperCase("ru-RU")));
  const source = localIconUrl(iconValue);
  if (source) {
    const image = document.createElement("img");
    image.src = source;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => image.remove(), { once: true });
    frame.append(image);
  }
  return frame;
}

function showError(message) {
  app.replaceChildren();
  const state = el("section", "empty-state error-state");
  state.append(el("h1", "", "Не удалось открыть архив"), el("p", "", message));
  app.append(state);
}

function renderCatalog() {
  document.title = "Архив профессий BSFG";
  app.replaceChildren(cloneTemplate("#catalog-template"));
  document.querySelector("#stat-professions").textContent = formatNumber(archiveIndex.profession_count);
  document.querySelector("#stat-records").textContent = formatNumber(archiveIndex.record_count);
  document.querySelector("#stat-date").textContent = formatDate(archiveIndex.captured_at);

  const search = document.querySelector("#profession-search");
  const filter = document.querySelector("#class-filter");
  const classes = [...new Set(archiveIndex.professions.flatMap((item) => item.classes))]
    .sort((a, b) => raceName([a]).localeCompare(raceName([b]), "ru"));
  for (const className of classes) {
    const option = el("option", "", raceName([className]));
    option.value = className;
    filter.append(option);
  }

  const refresh = () => {
    const query = normalize(search.value.trim());
    const selectedClass = filter.value;
    const matches = archiveIndex.professions.filter((item) => {
      const haystack = normalize(item.title + " " + raceName(item.classes) + " " + item.description);
      return (!query || haystack.includes(query))
        && (!selectedClass || item.classes.includes(selectedClass));
    });
    renderProfessionCards(matches);
  };
  search.addEventListener("input", refresh);
  filter.addEventListener("change", refresh);
  refresh();
  app.focus({ preventScroll: true });
}

function renderProfessionCards(items) {
  const grid = document.querySelector("#profession-grid");
  const empty = document.querySelector("#empty-catalog");
  grid.replaceChildren();
  document.querySelector("#result-count").textContent =
    "Показано: " + items.length + " из " + archiveIndex.profession_count;
  empty.hidden = items.length > 0;

  for (const item of items) {
    const card = el("a", "profession-card");
    card.href = "#/profession/" + encodeURIComponent(item.slug);
    const avatar = el("span", "card-avatar", item.title.slice(0, 1).toLocaleUpperCase("ru-RU"));
    const body = el("span", "card-body");
    body.append(
      el("span", "card-race", raceName(item.classes)),
      el("strong", "card-title", item.title),
      el("span", "card-description", item.description || "Описание отсутствует"),
      el("span", "card-stats", item.skill_count + " умений · " + item.record_count + " уровней и веток"),
    );
    card.append(avatar, body, el("span", "card-arrow", "→"));
    grid.append(card);
  }
}

async function renderProfession(slug) {
  const catalogItem = archiveIndex.professions.find((item) => item.slug === slug);
  if (!catalogItem) {
    showError("Такой профессии нет в сохранённом слепке.");
    return;
  }
  app.innerHTML = '<section class="loading-state"><div class="loader"></div><p>Открываю карточку…</p></section>';
  let exported;
  try {
    const response = await fetch("data/professions/" + encodeURIComponent(slug) + ".json");
    if (!response.ok) throw new Error("HTTP " + response.status);
    exported = await response.json();
  } catch (error) {
    showError("Файл профессии не загрузился: " + error.message);
    return;
  }

  const profession = exported.profession;
  document.title = profession.title + " — архив BSFG";
  app.replaceChildren(cloneTemplate("#detail-template"));
  document.querySelector("#crumb-title").textContent = profession.title;
  document.querySelector("#profession-title").textContent = profession.title;
  document.querySelector("#profession-class").textContent = raceName(profession.title_classes);
  document.querySelector("#profession-summary").textContent = profession.descriptions[0] || "";
  document.querySelector("#profession-avatar").textContent =
    profession.title.slice(0, 1).toLocaleUpperCase("ru-RU");
  document.querySelector("#profession-skill-count").textContent =
    catalogItem.skill_count + " умений";
  document.querySelector("#profession-record-count").textContent =
    catalogItem.record_count + " записей уровней и веток";

  const descriptions = document.querySelector("#profession-descriptions");
  descriptions.append(el("h2", "", "Описание профессии"));
  for (const paragraph of profession.descriptions) descriptions.append(el("p", "", paragraph));

  document.querySelector("#source-snapshot").textContent = exported.archive.snapshot;
  document.querySelector("#source-date").textContent = formatDate(exported.archive.captured_at);
  document.querySelector("#source-url").href = exported.archive.original_url;

  renderSectionTabs(profession.sections);
  app.focus({ preventScroll: true });
}

function renderSectionTabs(sections) {
  const tabs = document.querySelector("#section-tabs");
  const search = document.querySelector("#skill-search");
  const activeTitle = document.querySelector("#active-section-title");
  const activeCount = document.querySelector("#active-section-count");
  let activeSection = 0;

  sections.forEach((section, index) => {
    const skillCount = new Set(section.entries.map((row) => row.name)).size;
    const button = el("button", "section-tab");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(index === 0));
    button.append(
      el("span", "tab-index", String(index + 1).padStart(2, "0")),
      el("span", "tab-copy", section.title),
      el("span", "tab-count", String(skillCount)),
    );
    button.addEventListener("click", () => {
      activeSection = index;
      for (const tab of tabs.children) {
        tab.setAttribute("aria-selected", String(tab === button));
      }
      refresh();
      document.querySelector(".skills-shell").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    tabs.append(button);
  });

  const refresh = () => {
    const section = sections[activeSection];
    const skillCount = new Set(section.entries.map((row) => row.name)).size;
    activeTitle.textContent = section.title;
    activeCount.textContent = skillCount + " умений · " + section.entries.length + " записей уровней и веток";
    renderSkills(section, search.value);
  };
  search.addEventListener("input", refresh);
  refresh();
}

function groupBy(items, key) {
  const result = new Map();
  for (const item of items) {
    const value = item[key];
    if (!result.has(value)) result.set(value, []);
    result.get(value).push(item);
  }
  return result;
}

function groupSkills(entries) {
  const groups = [];
  for (const row of entries) {
    const current = groups.at(-1);
    const repeatsLevel = current?.rows.some(
      (item) => item.branch === row.branch && item.level === row.level
    );
    if (!current || current.name !== row.name || repeatsLevel) {
      groups.push({ name: row.name, rows: [row] });
    } else {
      current.rows.push(row);
    }
  }
  return groups;
}

function renderSkills(section, queryValue) {
  const list = document.querySelector("#skills-list");
  const empty = document.querySelector("#empty-skills");
  const query = normalize(queryValue.trim());
  list.replaceChildren();
  const grouped = groupSkills(section.entries)
    .filter(({ name }) => !query || normalize(name).includes(query));
  empty.hidden = grouped.length > 0;

  grouped.forEach(({ name, rows }, index) => {
    const details = el("details", "skill-card");
    details.open = Boolean(query) || index === 0;
    const summary = el("summary", "skill-summary");
    const iconValue = rows.find((row) => row.icon)?.icon || "";
    const icon = renderSkillIcon(iconValue, name);
    const heading = el("span", "skill-heading");
    const branchCount = new Set(rows.map((row) => row.branch)).size;
    const levelCount = new Set(rows.map((row) => row.level)).size;
    heading.append(
      el("strong", "", name),
      el("small", "", levelCount + " уровней · " + branchCount + " веток"),
    );
    summary.append(icon, heading, el("span", "disclosure", "+"));
    details.append(summary);

    const content = el("div", "skill-content");
    for (const [branch, branchRows] of groupBy(rows, "branch")) {
      const branchBlock = el("section", "branch-block");
      const branchHeading = el("div", "branch-heading");
      branchHeading.append(
        renderSkillIcon(branchRows.find((row) => row.icon)?.icon || "", name, "branch-icon"),
        el("h3", "", BRANCH_LABELS[branch] || branch),
        el("span", "branch-record-count", branchRows.length + " ур."),
      );
      branchBlock.append(branchHeading);
      const sortedRows = [...branchRows].sort((a, b) => Number(a.level) - Number(b.level));
      branchBlock.append(renderLevelSwitcher(sortedRows, name, branch));
      content.append(branchBlock);
    }
    details.append(content);
    list.append(details);
  });
}

function renderLevelSwitcher(rows, skillName, branch) {
  const panel = el("div", "level-panel");
  const switcher = el("div", "level-switcher");
  const current = el("output", "level-current");
  current.setAttribute("aria-live", "polite");
  const options = el("div", "level-options");
  options.setAttribute("role", "group");
  options.setAttribute(
    "aria-label",
    "Уровень умения «" + skillName + "», " + (BRANCH_LABELS[branch] || branch)
  );
  const levelContent = el("div", "level-detail");
  const buttons = [];

  const selectLevel = (row, activeButton) => {
    current.value = row.level;
    current.textContent = row.level;
    for (const button of buttons) {
      const selected = button === activeButton;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("is-selected", selected);
    }
    levelContent.replaceChildren(renderLevel(row, true));
  };

  for (const row of rows) {
    const button = el("button", "level-option", row.level);
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.title = "Показать уровень " + row.level;
    button.addEventListener("click", () => selectLevel(row, button));
    buttons.push(button);
    options.append(button);
  }

  switcher.append(el("span", "level-switcher-label", "Уровень:"), current, options);
  panel.append(switcher, levelContent);
  selectLevel(rows.at(-1), buttons.at(-1));
  return panel;
}

function renderLevel(row, compact = false) {
  const card = el("article", compact ? "level-card active-level" : "level-card");
  if (!compact) {
    const heading = el("div", "level-heading");
    heading.append(el("span", "level-number", row.level), el("h4", "", "Уровень умения"));
    if (row.selection_id) heading.append(el("span", "selection-id", "#" + row.selection_id));
    card.append(heading);
  } else if (row.selection_id) {
    card.append(el("span", "selection-id active-selection-id", "#" + row.selection_id));
  }
  if (row.description) card.append(el("p", "level-description", row.description));

  if (row.specifications && row.specifications.length) {
    const specifications = el("ul", "spec-list");
    for (const value of row.specifications) specifications.append(el("li", "", value));
    card.append(specifications);
  }

  if (row.effects && row.effects.length) {
    const effects = el("dl", "effect-list");
    for (const effect of row.effects) {
      const parts = effect.text.split(":");
      const label = parts.shift();
      const className = effect.kind === "group" ? "effect-group" : "";
      effects.append(el("dt", className, label));
      effects.append(el("dd", className, parts.join(":").trim() || "—"));
    }
    card.append(effects);
  }
  return card;
}

function route() {
  const match = location.hash.match(/^#\/profession\/([^/?#]+)$/);
  if (match) renderProfession(decodeURIComponent(match[1]));
  else renderCatalog();
  window.scrollTo({ top: 0, behavior: "instant" });
}

async function init() {
  try {
    const response = await fetch("data/index.json");
    if (!response.ok) throw new Error("HTTP " + response.status);
    archiveIndex = await response.json();
    document.querySelector("#header-snapshot").textContent = archiveIndex.snapshot;
    addEventListener("hashchange", route);
    route();
  } catch (error) {
    showError(
      "Индекс данных не загрузился: " + error.message
      + ". Откройте сайт через локальный HTTP-сервер."
    );
  }
}

init();
