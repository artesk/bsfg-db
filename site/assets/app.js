"use strict";

const RACE_LABELS = {
  "race-imperia": "Империя",
  "race-aliance": "Альянс",
  "race-dominion": "Доминион",
  "race-orda": "Орда",
  "race-union": "Союз",
  "race-legion": "Легион",
  "race-belatto": "Беллато",
  "race-pirats": "Пираты",
};

const BRANCH_LABELS = {
  base: "Основная ветка",
  one: "Ветка I",
  two: "Ветка II",
  three: "Ветка III",
};

const ENCHANT_PAGES = new Map([
  ["/specifications/enchant-skills", {
    title: "Заточка скиллов",
    intro: "Выберите тип заточки, чтобы сравнить эффекты на разных уровнях.",
    filterLabel: "Тип заточки",
    renderCategory: renderSkillEnchantments,
  }],
  ["/specifications/enchant-weapon", {
    title: "Улучшения оружия",
    intro: "При улучшении до +4 оружие получает пассивное свойство. Выберите ранг, чтобы посмотреть бонусы оружия и щитов.",
    filterLabel: "Ранг",
    renderCategory: renderWeaponEnchantments,
  }],
]);

const PROGRESSION_PAGES = new Map([
  ["/specifications/banners", {
    title: "Знамёна", intro: "Сравните бонусы знамён по рангам.", label: "Знамя", level: "Ранг",
  }],
  ["/specifications/dragon-relics", {
    title: "Реликвии драконов", intro: "Эффекты и активные умения реликвий по уровням.", label: "Реликвия", level: "Уровень",
  }],
  ["/specifications/boss-trophies", {
    title: "Трофеи боссов", intro: "Пассивные бонусы по уровням и активные умения реликтовых трофеев.",
    label: "Трофей", level: "Уровень", effect: "Пассивный эффект",
    kinds: {base: "Базовые", combined: "Объединённые", relic: "Реликтовые"},
  }],
  ["/specifications/sibyl-cards", {
    title: "Карты Сивиллы", label: "Карта", level: "Уровни", effect: "Бонусы и эффекты",
    intro: "Пассивные бонусы и условия срабатывания карт. Числовые параметры приведены в объёме клиентских подсказок.",
    compactLevels: true,
  }],
  ["/specifications/equipment-properties", {
    title: "Свойства экипировки", intro: "Найдите свойство и сравните его значения по уровням.", label: "Свойство", level: "Уровень",
  }],
  ["/specifications/military-service", {
    title: "Награды и медали за военную службу", intro: "Распределите лычки или откройте таблицу эффектов.", label: "Эффект", level: "Уровень",
  }],
]);
const MILITARY_PATH = "/specifications/military-service";
const EQUIPMENT_CATEGORIES = {
  heavy: "Тяжёлая броня", light: "Лёгкая броня", robe: "Роба", "robe-legion": "Роба (Легион)", form: "Форма",
  jewelry: "Бижутерия", bracelets: "Браслеты", "hunter-bracelets": "Браслеты (охотник)",
  talismans: "Талисманы", shields: "Щиты", books: "Боевые книги", linen: "Бельё", pet: "Предметы питомца",
};
const WEAPON_CATEGORIES = {
  "two-handed-swords": "Двуручные мечи", "one-handed-swords": "Одноручные мечи", "twin-swords": "Парные мечи",
  "ancient-swords": "Древние мечи", daggers: "Кинжалы", claw: "Коготь", "sharp-axes": "Острые топоры",
  "paired-daggers": "Парные кинжалы", rapier: "Рапиры", "rapier-with-symbol": "Рапира с символом",
  "paired-rapiers": "Парные рапиры", "two-handed-hammers": "Двуручные топоры (молоты)",
  "one-handed-hammers": "Одноручные топоры (молоты)", "steam-hammers": "Парные топоры (молоты)",
  crossbows: "Арбалеты", "warp-crossbows": "Варп-арбалеты", "long-bows": "Длинные луки",
  "short-bows": "Короткие луки", shotguns: "Ружья", halberds: "Алебарды (пики)", knuckles: "Кастеты",
  rod: "Жезлы", "rod-symbol": "Жезл с символом", stick: "Посохи",
};
const GEAR_CATALOGS = new Map([
  ["/items/equipment", {
    title: "Экипировка", navigationLabel: "Виды экипировки", categories: EQUIPMENT_CATEGORIES,
    intro: "Комплекты, базовые характеристики, эффекты и рецепты из клиента BSFG.",
    related: [["/items/pit-boss-jewelry", "Бижутерия Пит-боссов"], ["/specifications/boss-trophies", "Трофеи боссов"]],
  }],
  ["/items/weapons", {
    title: "Оружие", navigationLabel: "Типы оружия", categories: WEAPON_CATEGORIES,
    intro: "Базовые характеристики, эффекты оружия и заточки, рецепты из клиента BSFG.",
    related: [],
  }],
]);
const EQUIPMENT_STATS = {
  pDefense: "Физ. защита", mDefense: "Маг. защита", pAttack: "Физ. атака", mAttack: "Маг. атака",
  pAttackSpeed: "Скорость атаки", pHit: "Физ. точность", mHit: "Маг. точность",
  pCritical: "Физ. крит", mCritical: "Маг. крит", speed: "Скорость бега",
  ShieldDefense: "Защита щита", ShieldDefenseRate: "Шанс блока",
  pavoid: "Физ. уклонение", mavoid: "Маг. уклонение",
  random_damage: "Разброс урона", soulshot_count: "Заряды души", spiritshot_count: "Заряды духа",
};
const MILITARY_SLOTS = [
  ["critical-power", "Сила критического удара"],
  ["critical-chance", "Шанс критического удара"],
  ["attack", "Физическая и магическая атака"],
  ["speed", "Скорость атаки и каста"],
  ["pvp", "PvP-урон и защита"],
];

const app = document.querySelector("#app");
const siteLinks = document.querySelectorAll(".site-nav a");
const enchantData = new Map();
const gearData = new Map();
let archiveIndex;
let worldMap;
let pitJewelry;
let routeVersion = 0;
let disposeStream;
let hlsScript;

function el(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
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

function loadHls() {
  hlsScript ??= new Promise((resolve, reject) => {
    const script = el("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.7.4/dist/hls.light.min.js";
    script.integrity = "sha384-vpNtFjJmrPAaL9LfqByx3MxTVjqrtQ6Ue6UVNnFeghNrhE0uvpydDr3tkTVcBgDz";
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(window.Hls);
    script.onerror = () => {
      script.remove();
      hlsScript = undefined;
      reject(new Error("Не удалось загрузить плеер."));
    };
    document.head.append(script);
  });
  return hlsScript;
}

function mountStream(section) {
  const video = section.querySelector("video");
  const button = section.querySelector(".stream-play");
  const status = section.querySelector(".stream-status");
  let attempt;
  let hls;

  function stop() {
    if (!attempt) return;
    attempt.abort();
    attempt = undefined;
    hls?.destroy();
    hls = undefined;
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  button.addEventListener("click", async () => {
    attempt = new AbortController();
    const { signal } = attempt;
    video.controls = true;
    if (document.activeElement === button) video.focus();
    button.hidden = true;
    status.textContent = "Подключение к эфиру…";

    function fail(message = "Не удалось подключиться к эфиру.") {
      if (signal.aborted) return;
      const restoreFocus = document.activeElement === video;
      stop();
      video.controls = false;
      status.textContent = message;
      button.textContent = "Повторить";
      button.hidden = false;
      if (restoreFocus) button.focus();
    }

    async function play() {
      if (signal.aborted) return;
      try {
        await video.play();
      } catch (error) {
        if (signal.aborted) return;
        if (error.name === "NotAllowedError") status.textContent = "Нажмите кнопку воспроизведения в плеере.";
        else fail();
      }
    }

    video.addEventListener("playing", () => { status.textContent = ""; }, { signal });
    video.addEventListener("error", () => fail(), { signal });
    try {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = video.dataset.src;
        void play();
        return;
      }

      const Hls = await loadHls();
      if (signal.aborted) return;
      if (!Hls?.isSupported()) {
        fail("Этот браузер не поддерживает воспроизведение эфира.");
        return;
      }
      hls = new Hls();
      hls.on(Hls.Events.ERROR, (_, error) => { if (error.fatal) fail(); });
      hls.on(Hls.Events.MEDIA_ATTACHED, play);
      hls.loadSource(video.dataset.src);
      hls.attachMedia(video);
    } catch {
      fail();
    }
  });

  return stop;
}

function localIconUrl(value) {
  if (!String(value || "").startsWith("/icon/")) return "";
  return "assets/icons/" + value
    .slice("/icon/".length)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

function renderIcon(source, name, className) {
  const frame = el("span", className);
  frame.setAttribute("aria-hidden", "true");
  frame.append(el("span", "icon-fallback", name.slice(0, 1).toLocaleUpperCase("ru-RU")));
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
  const state = el("section", "empty-state error-state");
  state.append(el("h1", "", "Не удалось открыть страницу"), el("p", "", message));
  app.replaceChildren(state);
}

function renderCatalog() {
  document.title = "Профессии — База знаний BSFG";
  app.replaceChildren(cloneTemplate("#catalog-template"));

  const search = document.querySelector("#profession-search");
  const factionFilter = document.querySelector("#faction-filter");
  const factions = [...new Set(archiveIndex.professions.flatMap((item) => item.classes))]
    .sort((a, b) => raceName([a]).localeCompare(raceName([b]), "ru"));
  for (const faction of factions) {
    const option = el("option", "", raceName([faction]));
    option.value = faction;
    factionFilter.append(option);
  }

  const selectedCategories = new Set();
  const refresh = () => {
    const query = normalize(search.value.trim());
    const selectedFaction = factionFilter.value;
    const matches = archiveIndex.professions.filter((item) => {
      const categories = item.categories ?? [];
      const haystack = normalize([item.title, raceName(item.classes), ...categories, item.description].join(" "));
      return (!query || haystack.includes(query))
        && (!selectedFaction || item.classes.includes(selectedFaction))
        && (!selectedCategories.size || categories.some((category) => selectedCategories.has(category)));
    });
    renderProfessionGroups(matches, selectedFaction);
  };
  renderClassFilters(archiveIndex.categories ?? [], selectedCategories, refresh);
  search.addEventListener("input", refresh);
  factionFilter.addEventListener("change", refresh);
  refresh();
}

function renderClassFilters(categories, selectedCategories, refresh) {
  if (!categories.length) return;
  const options = document.querySelector("#class-options");
  const buttons = new Map();
  for (const category of ["", ...categories]) {
    const button = el("button", "class-option", category || "Все классы");
    button.type = "button";
    button.setAttribute("aria-pressed", String(!category));
    button.addEventListener("click", () => {
      if (!category) selectedCategories.clear();
      else if (!selectedCategories.delete(category)) selectedCategories.add(category);
      for (const [label, option] of buttons) {
        option.setAttribute("aria-pressed", String(label ? selectedCategories.has(label) : !selectedCategories.size));
      }
      refresh();
    });
    buttons.set(category, button);
    options.append(button);
  }
  document.querySelector("#class-filters").hidden = false;
}

function renderProfessionGroups(items, selectedFaction) {
  const grid = document.querySelector("#profession-groups");
  const empty = document.querySelector("#empty-catalog");
  grid.replaceChildren();
  document.querySelector("#result-count").textContent =
    "Показано: " + items.length + " из " + archiveIndex.profession_count;
  empty.hidden = items.length > 0;

  const groups = new Map(Object.keys(RACE_LABELS).map((faction) => [faction, []]));
  for (const item of items) {
    const factions = selectedFaction ? [selectedFaction] : item.classes.length ? item.classes : [""];
    for (const faction of new Set(factions)) {
      if (!groups.has(faction)) groups.set(faction, []);
      groups.get(faction).push(item);
    }
  }
  for (const [faction, professions] of groups) {
    if (!professions.length) continue;
    const group = el("section", "profession-group");
    const list = el("ul", "profession-list");
    for (const item of professions) {
      const entry = el("li");
      const link = el("a", "profession-link");
      link.href = "#/professions/" + encodeURIComponent(item.slug);
      const label = el("span", "profession-link-label");
      label.append(el("span", "profession-link-title", item.title));
      if (item.categories?.length) {
        label.append(el("small", "profession-link-class", item.categories.join(", ")));
      }
      link.append(renderIcon(item.icon, item.title, "profession-list-icon"), label);
      entry.append(link);
      list.append(entry);
    }
    group.append(el("h2", "faction-heading", raceName(faction ? [faction] : [])), list);
    grid.append(group);
  }
}

function renderProfession(catalogItem, exported) {
  const profession = exported.profession;
  document.title = profession.title + " — База знаний BSFG";
  app.replaceChildren(cloneTemplate("#detail-template"));
  document.querySelector("#crumb-title").textContent = profession.title;
  document.querySelector("#profession-title").textContent = profession.title;
  document.querySelector("#profession-class").textContent = raceName(profession.title_classes);
  document.querySelector("#profession-summary").textContent = profession.descriptions[0] || "";
  const avatar = renderIcon(catalogItem.icon, profession.title, "profession-avatar");
  avatar.id = "profession-avatar";
  document.querySelector("#profession-avatar").replaceWith(avatar);
  const descriptions = document.querySelector("#profession-descriptions");
  descriptions.append(el("h2", "", "Описание профессии"));
  for (const paragraph of profession.descriptions) descriptions.append(el("p", "", paragraph));

  renderSectionTabs(profession.sections);
}

function renderSectionTabs(sections) {
  const tabs = document.querySelector("#section-tabs");
  const search = document.querySelector("#skill-search");
  const activeTitle = document.querySelector("#active-section-title");
  let activeSection = 0;

  sections.forEach((section, index) => {
    const button = el("button", "section-tab");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(index === 0));
    button.append(
      el("span", "tab-index", String(index + 1).padStart(2, "0")),
      el("span", "tab-copy", section.title),
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
    activeTitle.textContent = section.title;
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
    const branchGroup = row.branch_group_id ?? (row.branch === "base" ? "" : row.selection_id.split("_")[0]);
    const sameGroup = current?.branchGroup === branchGroup && (branchGroup || current.name === row.name);
    const repeatsLevel = current?.rows.some(
      (item) => item.branch === row.branch && item.level === row.level
    );
    if (!sameGroup || repeatsLevel) {
      groups.push({ name: row.name, branchGroup, rows: [row] });
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
    .filter(({ rows }) => !query || rows.some((row) => normalize(row.name).includes(query)));
  empty.hidden = grouped.length > 0;

  grouped.forEach(({ name, rows }, index) => {
    const details = el("details", "skill-card");
    details.open = Boolean(query) || index === 0;
    const summary = el("summary", "skill-summary");
    const iconValue = rows.find((row) => row.icon)?.icon || "";
    const icon = renderIcon(localIconUrl(iconValue), name, "skill-icon");
    summary.append(icon, el("strong", "skill-heading", name), el("span", "disclosure", "+"));
    details.append(summary);

    const content = el("div", "skill-content");
    for (const [branch, branchRows] of groupBy(rows, "branch")) {
      const branchBlock = el("section", "branch-block");
      const branchHeading = el("div", "branch-heading");
      const branchName = branchRows[0].name;
      const branchLabel = BRANCH_LABELS[branch] || branch;
      branchHeading.append(
        renderIcon(localIconUrl(branchRows.find((row) => row.icon)?.icon), branchName, "branch-icon"),
        el("h3", "", branchName === name ? branchLabel : branchLabel + " · " + branchName),
      );
      branchBlock.append(branchHeading);
      const sortedRows = [...branchRows].sort((a, b) => Number(a.level) - Number(b.level));
      branchBlock.append(renderLevelSwitcher(sortedRows, branchName, branch));
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
    levelContent.replaceChildren(renderLevel(row));
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

function renderLevel(row) {
  const card = el("article", "level-card");
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
    if (row.effects_from_archive) {
      const archived = el("details", "");
      archived.append(el("summary", "", "Архивные эффекты"), effects);
      card.append(archived);
    } else {
      card.append(effects);
    }
  }
  return card;
}

function renderEnchantPage(page, data) {
  document.title = page.title + " — База знаний BSFG";
  app.replaceChildren(cloneTemplate("#enchant-template"));
  document.querySelector("#enchant-heading").textContent = page.title;
  document.querySelector("#enchant-crumb").textContent = page.title;
  document.querySelector("#enchant-intro").textContent = page.intro;
  document.querySelector("#enchant-filter-label").textContent = page.filterLabel;
  const options = document.querySelector("#enchant-options");
  const title = document.querySelector("#enchant-title");
  const results = document.querySelector("#enchant-results");
  document.querySelector("#enchant-source").href = data.source;
  const showCategory = (category) => {
    title.textContent = category.title;
    results.replaceChildren(page.renderCategory(category));
  };
  for (const [index, category] of data.categories.entries()) {
    const button = el("button", "class-option", category.title);
    button.type = "button";
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      for (const option of options.children) {
        option.setAttribute("aria-pressed", String(option === button));
      }
      showCategory(category);
    });
    options.append(button);
  }
  showCategory(data.categories[0]);
}

function createEnchantTable(title, columns) {
  const table = el("table", "enchant-table");
  table.append(el("caption", "visually-hidden", title));
  const headerRow = table.createTHead().insertRow();
  for (const label of columns) {
    const cell = el("th", "", label);
    cell.scope = "col";
    headerRow.append(cell);
  }
  return table;
}

function renderSkillEnchantments(category) {
  const grid = el("div", "enchant-grid");
  for (const skill of category.skills) {
    const card = el("article", "enchant-card");
    const heading = el("header", "enchant-heading");
    heading.append(
      renderIcon(localIconUrl(skill.icon), skill.name, "branch-icon"),
      el("h3", "", skill.name),
    );
    if (skill.description) heading.append(el("p", "", skill.description));
    const table = createEnchantTable(skill.name, ["Уровень", "Эффект"]);
    const body = table.createTBody();
    for (const row of skill.levels) {
      const entry = body.insertRow();
      const level = el("th", "", row.level);
      level.scope = "row";
      entry.append(level);
      const effects = entry.insertCell();
      if (row.description) effects.append(el("span", "enchant-description", row.description));
      for (const effect of row.effects) effects.append(el("span", "", effect));
    }
    card.append(heading, table);
    grid.append(card);
  }
  return grid;
}

function renderWeaponEnchantments(category) {
  const card = el("div", "enchant-card");
  const table = createEnchantTable("Ранг " + category.title, ["Название", "Эффект"]);
  table.classList.add("weapon-enchant-table");
  const body = table.createTBody();
  for (const skill of category.skills) {
    const entry = body.insertRow();
    const name = el("th");
    name.scope = "row";
    const label = el("span", "weapon-enchant-label");
    const weaponName = skill.name.replace(/^.*?: улучшенн\S+ /, "");
    label.append(
      renderIcon(localIconUrl(skill.icon), weaponName, "branch-icon"),
      el("span", "", skill.name),
    );
    name.append(label);
    entry.append(name);
    const effects = entry.insertCell();
    effects.append(el("span", "enchant-description", skill.description));
    for (const effect of skill.effects) effects.append(el("span", "", effect));
  }
  card.append(table);
  return card;
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.json();
}

function renderEquipment(path, catalog, category, data) {
  document.title = catalog.categories[category] + " — " + catalog.title + " BSFG";
  app.replaceChildren(cloneTemplate("#equipment-template"));
  document.querySelector("#equipment-title").textContent = catalog.title;
  document.querySelector("#equipment-intro").textContent = catalog.intro;
  document.querySelector("#equipment-release").textContent = data.client_release;
  document.querySelector("#equipment-category-title").textContent = catalog.categories[category];
  const navigation = document.querySelector("#equipment-categories");
  navigation.setAttribute("aria-label", catalog.navigationLabel);
  for (const [key, label] of Object.entries(catalog.categories)) {
    const link = el("a", "class-option", label);
    link.href = "#" + path + "/" + key;
    if (key === category) link.setAttribute("aria-current", "page");
    navigation.append(link);
  }
  for (const [relatedPath, label] of catalog.related) {
    const link = el("a", "class-option", label);
    link.href = "#" + relatedPath;
    navigation.append(link);
  }

  const items = new Map(data.items.map(item => [item.id, item]));
  const sets = (data.sets || []).filter(group => group.category === category);
  const memberIds = new Set(sets.flatMap(group => group.items));
  const entries = sets.map(group => ({set: group, items: group.items.map(id => items.get(id))}));
  for (const item of data.items) {
    if (item.category === category && !memberIds.has(item.id)) entries.push({items: [item]});
  }
  const ranks = ["BA", "EX", "EL", "MA", "GM", "LEG", ""];
  entries.sort((a, b) => ranks.indexOf(a.items[0].rank) - ranks.indexOf(b.items[0].rank)
    || a.items[0].name.localeCompare(b.items[0].name, "ru") || a.items[0].id - b.items[0].id);
  const rank = document.querySelector("#equipment-rank");
  const present = new Set(entries.map(entry => entry.items[0].rank));
  rank.append(new Option("Все ранги", "all"));
  for (const value of ranks) {
    if (present.has(value)) rank.append(new Option(value || "Без ранга", value));
  }

  const search = document.querySelector("#equipment-search");
  const results = document.querySelector("#equipment-results");
  const counter = document.querySelector("#equipment-count");
  const refresh = () => {
    const query = normalize(search.value.trim());
    const matches = entries.filter(entry => (rank.value === "all" || entry.items[0].rank === rank.value)
      && entry.items.some(item => normalize(item.name + " " + (item.label || "")).includes(query)
        || String(item.id) === query));
    results.replaceChildren(...matches.map(renderEquipmentEntry));
    counter.textContent = matches.length ? "Показано " + matches.length : "Совпадений нет.";
  };
  search.addEventListener("input", refresh);
  rank.addEventListener("change", refresh);
  refresh();
}

function renderEquipmentEntry(entry) {
  if (!entry.set) return renderEquipmentItem(entry.items[0]);
  const section = el("section", "enchant-card equipment-set");
  const heading = el("header", "equipment-set-heading");
  heading.append(el("h3", "", entry.items[0].name), el("span", "", "Комплект · " + entry.items[0].rank));
  section.append(heading);
  for (const effect of entry.set.effects) section.append(el("p", "equipment-set-note", effect));
  const pieces = el("div", "equipment-pieces");
  pieces.append(...entry.items.map(renderEquipmentItem));
  section.append(pieces);
  return section;
}

function renderEquipmentItem(item) {
  const card = el("article", "enchant-card equipment-item");
  card.dataset.itemId = item.id;
  const heading = el("header", "enchant-heading");
  heading.append(renderIcon(localIconUrl(item.icon), item.name, "branch-icon"), el("h4", "", item.name));
  heading.append(el("p", "", [item.rank || "Без ранга", item.slot, item.label, "ID " + item.id].filter(Boolean).join(" · ")));
  card.append(heading);
  const stats = el("dl", "jewelry-stats equipment-stats");
  for (const [key, value] of Object.entries(item.stats || {})) {
    stats.append(el("dt", "", EQUIPMENT_STATS[key]), el("dd", "", value.toLocaleString("ru-RU", {maximumFractionDigits: 4})));
  }
  if (stats.childElementCount) card.append(stats);
  if (item.effects?.length || item.enchant_effect) {
    const effects = el("div", "equipment-effects");
    for (const effect of item.effects || []) effects.append(el("p", "progression-effect", effect));
    if (item.enchant_effect) {
      effects.append(el("p", "progression-effect", "Эффект заточки · " + item.enchant_effect));
    }
    card.append(effects);
  }
  if (item.recipes?.length) {
    const details = el("details", "equipment-details");
    details.append(el("summary", "", "Рецепты"));
    for (const recipe of item.recipes) {
      details.append(el("p", "", "Рецепт " + recipe.id + " · уровень " + recipe.level
        + " · результат ×" + recipe.quantity + " · шанс " + recipe.success + "%"
        + (recipe.mana === undefined ? "" : " · мана " + recipe.mana.toLocaleString("ru-RU"))));
      const materials = el("ul");
      for (const [name, quantity] of recipe.materials) materials.append(el("li", "", name + " × " + quantity.toLocaleString("ru-RU")));
      details.append(materials);
    }
    card.append(details);
  }
  return card;
}

function renderProgressionPage(path, page, data) {
  document.title = page.title + " — База знаний BSFG";
  app.replaceChildren(cloneTemplate("#progression-template"));
  document.querySelector("#progression-heading").textContent = page.title;
  document.querySelector("#progression-crumb").textContent = page.title;
  document.querySelector("#progression-intro").textContent = page.intro;
  document.querySelector("#progression-release").textContent = data.client_release;
  document.querySelector("#progression-group-label").textContent = page.label;
  const military = path === MILITARY_PATH;
  if (military) renderMilitaryCalculator(data);
  const search = document.querySelector("#progression-search");
  const kind = document.querySelector("#progression-kind");
  const select = document.querySelector("#progression-group");
  const results = document.querySelector("#progression-results");
  if (page.kinds) {
    document.querySelector("#progression-kind-field").hidden = false;
    kind.replaceChildren(...Object.entries(page.kinds).map(([value, title]) => new Option(title, value)));
  }
  const groups = data.groups.map((group, index) => ({
    group, index: String(index),
    label: military
      ? (group.kind === "medal" ? "Медали" : "Награды") + " — " + group.name + " (" + group.skill_id + ")"
      : group.name,
  }));

  const showGroup = () => {
    const entry = groups.find(({index}) => index === select.value);
    if (!entry) {
      results.replaceChildren(el("p", "empty-state", "Совпадений нет."));
      return;
    }
    const {group, label} = entry;
    const idKey = group.levels[0].item_id ? "item_id" : "effect_id";
    const showId = Boolean(group.levels[0][idKey]);
    const card = el("article", "enchant-card progression-card");
    const heading = el("header", "progression-card-heading");
    if (group.icon) heading.append(renderIcon(localIconUrl(group.icon), group.name, "branch-icon"));
    heading.append(el("h3", "", label));
    const showLevel = !page.kinds || group.kind === "combined";
    const columns = showLevel ? [page.level, page.effect || "Эффект"] : [page.effect];
    if (showId) columns.push("ID");
    const table = createEnchantTable(label, columns);
    if (!showLevel) table.classList.add("progression-unleveled");
    const body = table.createTBody();
    const firstLevel = group.levels[0];
    const lastLevel = group.levels.at(-1);
    const sameEffect = page.compactLevels && !showId && group.levels.length > 1
      && group.levels.every(row => row.effect === firstLevel.effect);
    const levels = sameEffect ? [{...firstLevel, level: firstLevel.level + "–" + lastLevel.level}] : group.levels;
    for (const row of levels) {
      const entry = body.insertRow();
      if (showLevel) {
        const level = el("th", "", row.level);
        level.scope = "row";
        entry.append(level);
      }
      entry.append(el("td", "progression-effect", row.effect));
      if (showId) entry.append(el("td", "progression-id", row[idKey]));
    }
    card.append(heading, table);
    if (group.active) {
      const active = el("section", "progression-active");
      active.append(el("h4", "", "Активное умение"), el("p", "", group.active.name),
        el("p", "progression-effect", group.active.effect));
      card.append(active);
    }
    results.replaceChildren(card);
  };

  const filterGroups = () => {
    const query = normalize(search.value.trim());
    const selected = select.value;
    const matches = groups.filter(({group, label}) => (!page.kinds || group.kind === kind.value)
      && (normalize(label).includes(query) || normalize(group.active?.effect).includes(query)
        || String(group.closed_item_id ?? "").includes(query)
        || group.levels.some(row => normalize(row.effect).includes(query)
          || String(row.item_id ?? "").includes(query))));
    select.replaceChildren(...matches.map(({index, label}) => new Option(label, index)));
    select.disabled = matches.length === 0;
    if (matches.some(({index}) => index === selected)) select.value = selected;
    showGroup();
  };
  search.addEventListener("input", filterGroups);
  kind.addEventListener("change", filterGroups);
  select.addEventListener("change", showGroup);
  filterGroups();
}

function renderMilitaryCalculator(data) {
  const panel = document.querySelector("#progression-calculator");
  panel.append(cloneTemplate("#military-calculator-template"));
  const kind = panel.querySelector("#military-kind");
  const awardIcon = panel.querySelector("#military-award-icon");
  const rankInput = panel.querySelector("#military-rank");
  const budget = panel.querySelector("#military-budget");
  const progress = panel.querySelector("#military-progress");
  const list = panel.querySelector("#military-slots");
  const points = new Array(MILITARY_SLOTS.length).fill(0);
  let rank = Math.min(30, data.rank_limit);
  const used = () => points.reduce((total, value) => total + value, 0);
  rankInput.max = data.rank_limit;
  rankInput.value = rank;

  const rows = MILITARY_SLOTS.map(([slot, title], index) => {
    const row = el("li", "military-row");
    const icon = el("span", "military-icon");
    const name = el("h3", "", title);
    const controls = el("div", "military-controls");
    const input = el("input", "military-points");
    input.type = "number";
    input.min = 0;
    input.step = 1;
    input.inputMode = "numeric";
    input.setAttribute("aria-label", title + " — лычки");
    const next = el("span", "military-next");
    const effect = el("p", "military-effect");
    const adjust = (value) => {
      const limit = rank - used() + points[index];
      points[index] = Math.max(0, Math.min(limit, Math.trunc(value)));
      refresh();
    };
    const button = (glyph, action, handle) => {
      const element = el("button", "class-option", glyph);
      element.type = "button";
      element.title = action;
      element.setAttribute("aria-label", action + " — " + title);
      element.addEventListener("click", handle);
      return element;
    };
    const minus = button("−", "Убрать одну лычку", () => adjust(points[index] - 1));
    const plus = button("+", "Добавить одну лычку", () => adjust(points[index] + 1));
    const fill = button("↑", "Вложить оставшиеся лычки", () => adjust(rank));
    const clear = button("×", "Очистить ветку", () => adjust(0));
    input.addEventListener("change", () => adjust(Number(input.value)));
    controls.append(input, next, minus, plus, fill, clear);
    row.append(icon, name, controls, effect);
    list.append(row);
    return {slot, icon, input, next, effect, minus, plus, fill, clear};
  });

  function refresh() {
    const total = used();
    const free = rank - total;
    const series = kind.value === "medal" ? "medal" : "award";
    budget.textContent = "Использовано лычек: " + total + " / " + rank + " · Свободно: " + free;
    progress.max = rank;
    progress.value = total;
    rankInput.min = Math.max(1, total);
    for (const [index, row] of rows.entries()) {
      const value = points[index];
      const group = data.groups.find(group => group.kind === series && group.slot === row.slot);
      const iconPath = group?.icon || "";
      if (row.icon.dataset.path !== iconPath) {
        row.icon.replaceChildren(renderIcon(localIconUrl(iconPath), group?.name || "PvP", "branch-icon"));
        row.icon.dataset.path = iconPath;
      }
      row.input.max = value + free;
      row.input.value = value;
      row.next.textContent = free ? "→ " + (value + 1) : "→ —";
      row.next.title = free ? (group?.levels[value]?.effect ?? "Следующий уровень ветки") : "Свободных лычек нет";
      row.minus.disabled = row.clear.disabled = value === 0;
      row.plus.disabled = row.fill.disabled = free === 0;
      row.effect.textContent = value === 0 ? "Лычки не вложены."
        : group?.levels[value - 1]?.effect ?? "Числовое значение для этого уровня не подтверждено.";
    }
  }

  rankInput.addEventListener("change", () => {
    rank = Math.max(1, used(), Math.min(data.rank_limit, Math.trunc(Number(rankInput.value))));
    rankInput.value = rank;
    refresh();
  });
  function updateAward() {
    const name = kind.selectedOptions[0].textContent;
    awardIcon.replaceChildren(renderIcon(localIconUrl(data.rank_icons[kind.value]), name, "branch-icon"));
    refresh();
  }
  kind.addEventListener("change", updateAward);
  panel.querySelector("#military-reset").addEventListener("click", () => {
    points.fill(0);
    refresh();
  });
  updateAward();
}

function renderPitJewelry(data) {
  document.title = "Бижутерия Пит-боссов — База знаний BSFG";
  app.replaceChildren(cloneTemplate("#pit-jewelry-template"));
  document.querySelector("#jewelry-source").href = data.source;
  document.querySelector("#jewelry-client-release").textContent = data.client_release;
  const ranks = document.querySelector("#jewelry-ranks");
  const variants = document.querySelector("#jewelry-variant-filter");
  const variantOptions = variants.querySelector(".class-options");
  const variantLabels = {normal: "Обычная", epic: "Эпик", relic: "Реликт"};
  const search = document.querySelector("#jewelry-search");
  const results = document.querySelector("#jewelry-results");
  const empty = document.querySelector("#empty-jewelry");
  let activeRank = data.ranks[0];
  let activeVariant;

  const refresh = () => {
    const query = normalize(search.value.trim());
    const groups = document.createDocumentFragment();
    for (const boss of activeRank.bosses) {
      const bossMatches = normalize(boss.name).includes(query);
      const items = boss.items.filter((item) => item.variant === activeVariant
        && (bossMatches || normalize(item.name).includes(query) || query === String(item.item_id)));
      if (items.length === 0) continue;
      const section = el("section", "jewelry-boss");
      const grid = el("div", "enchant-grid jewelry-grid");
      grid.append(...items.map(renderJewelryItem));
      section.append(el("h2", "enchant-title", boss.name), grid);
      groups.append(section);
    }
    empty.hidden = groups.childElementCount > 0;
    results.replaceChildren(groups);
  };

  const renderVariants = () => {
    const available = new Set(activeRank.bosses.flatMap((boss) => boss.items.map((item) => item.variant)));
    const options = Object.entries(variantLabels).filter(([variant]) => available.has(variant));
    if (!available.has(activeVariant)) activeVariant = options[0][0];
    variants.hidden = options.length < 2;
    variantOptions.replaceChildren();
    for (const [variant, label] of options) {
      const button = el("button", "class-option", label);
      button.type = "button";
      button.setAttribute("aria-pressed", String(variant === activeVariant));
      button.addEventListener("click", () => {
        activeVariant = variant;
        for (const option of variantOptions.children) option.setAttribute("aria-pressed", String(option === button));
        refresh();
      });
      variantOptions.append(button);
    }
  };

  for (const rank of data.ranks) {
    const button = el("button", "class-option", rank.rank);
    button.type = "button";
    button.setAttribute("aria-pressed", String(rank === activeRank));
    button.addEventListener("click", () => {
      activeRank = rank;
      for (const option of ranks.children) option.setAttribute("aria-pressed", String(option === button));
      renderVariants();
      refresh();
    });
    ranks.append(button);
  }
  search.addEventListener("input", refresh);
  renderVariants();
  refresh();
}

function renderJewelryItem(item) {
  const card = el("article", "enchant-card jewelry-card");
  const heading = el("header", "enchant-heading");
  heading.append(renderIcon(localIconUrl(item.icon), item.name, "branch-icon"), el("h3", "", item.name));
  const stats = el("dl", "jewelry-stats");
  stats.append(el("dt", "", "Магическая защита"), el("dd", "", item.magic_defense));
  stats.append(el("dt", "", "ID предмета"), el("dd", "", item.item_id));
  if (item.gear_level != null) {
    stats.append(el("dt", "", "Уровень экипировки"), el("dd", "", item.gear_level));
  }
  card.append(heading, stats);
  if (item.effects.length > 0) {
    const effects = el("ul", "jewelry-effects");
    for (const effect of item.effects) effects.append(el("li", "", effect));
    card.append(effects);
  }
  return card;
}

async function route() {
  const version = ++routeVersion;
  disposeStream?.();
  disposeStream = undefined;
  const path = location.hash.slice(1).replace(/\/+$/, "") || "/";
  const profession = path.match(/^\/(?:profession|professions)\/([^/?#]+)$/);
  const isProfessionSection = path === "/professions" || profession !== null;
  const enchantPage = ENCHANT_PAGES.get(path);
  const progressionPage = PROGRESSION_PAGES.get(path);
  const gearMatch = path.match(/^(\/items\/(?:equipment|weapons))(?:\/([a-z-]+))?$/);
  const gearPath = gearMatch?.[1];
  const catalog = GEAR_CATALOGS.get(gearPath);
  const category = catalog && (gearMatch[2] || Object.keys(catalog.categories)[0]);
  const isGear = catalog && Object.hasOwn(catalog.categories, category);
  const isSpecifications = path === "/specifications" || enchantPage !== undefined || progressionPage !== undefined;
  let activeSection = path;
  if (isProfessionSection) activeSection = "/professions";
  else if (isSpecifications) activeSection = "/specifications";
  else if (isGear) activeSection = gearPath;
  for (const link of siteLinks) {
    const linkPath = link.hash.slice(1);
    if (linkPath === activeSection) link.setAttribute("aria-current", path === linkPath ? "page" : "location");
    else link.removeAttribute("aria-current");
  }

  window.scrollTo({ top: 0, behavior: "instant" });
  try {
    if (path === "/") {
      document.title = "База знаний BSFG";
      app.replaceChildren(cloneTemplate("#home-template"));
      disposeStream = mountStream(app.querySelector(".home-stream"));
    } else if (path === "/specifications") {
      document.title = "Характеристики — База знаний BSFG";
      app.replaceChildren(cloneTemplate("#specifications-template"));
    } else if (path === "/guides") {
      document.title = "Гайды — База знаний BSFG";
      app.replaceChildren(cloneTemplate("#guides-template"));
    } else if (path === "/map") {
      if (!worldMap) {
        app.replaceChildren(cloneTemplate("#loading-template"));
        worldMap = await loadJson("data/map/world.json");
      }
      if (version !== routeVersion) return;
      document.title = "Интерактивная карта — База знаний BSFG";
      app.replaceChildren(cloneTemplate("#world-map-template"));
      mountWorldMap(app, worldMap);
    } else if (isGear) {
      if (!gearData.has(gearPath)) {
        app.replaceChildren(cloneTemplate("#loading-template"));
        gearData.set(gearPath, await loadJson("data" + gearPath + ".json"));
      }
      if (version !== routeVersion) return;
      renderEquipment(gearPath, catalog, category, gearData.get(gearPath));
    } else if (path === "/items/pit-boss-jewelry") {
      if (!pitJewelry) {
        app.replaceChildren(cloneTemplate("#loading-template"));
        pitJewelry = await loadJson("data/items/pit-boss-jewelry.json");
      }
      if (version !== routeVersion) return;
      renderPitJewelry(pitJewelry);
    } else if (enchantPage) {
      if (!enchantData.has(path)) {
        app.replaceChildren(cloneTemplate("#loading-template"));
        enchantData.set(path, await loadJson("data" + path + ".json"));
      }
      if (version !== routeVersion) return;
      renderEnchantPage(enchantPage, enchantData.get(path));
    } else if (progressionPage) {
      app.replaceChildren(cloneTemplate("#loading-template"));
      const data = await loadJson("data" + path + ".json");
      if (version !== routeVersion) return;
      renderProgressionPage(path, progressionPage, data);
    } else if (isProfessionSection) {
      if (!archiveIndex || profession) app.replaceChildren(cloneTemplate("#loading-template"));
      archiveIndex ??= await loadJson("data/index.json");
      if (version !== routeVersion) return;
      if (profession) {
        const slug = decodeURIComponent(profession[1]);
        const catalogItem = archiveIndex.professions.find((item) => item.slug === slug);
        if (!catalogItem) showError("Такой профессии нет в базе.");
        else {
          const exported = await loadJson("data/professions/" + encodeURIComponent(slug) + ".json");
          if (version !== routeVersion) return;
          renderProfession(catalogItem, exported);
        }
      } else {
        renderCatalog();
      }
    } else {
      document.title = "Страница не найдена — База знаний BSFG";
      showError("Такой страницы нет в базе.");
    }
  } catch (error) {
    if (version !== routeVersion) return;
    showError("Данные страницы не загрузились: " + error.message);
  }
  app.focus({ preventScroll: true });
}

addEventListener("hashchange", route);
route();
