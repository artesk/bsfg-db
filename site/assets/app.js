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
const SKILL_LEVEL_KEY = "bsfg-skill-level";

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
    title: "Карты Сивиллы", label: "Карта",
    intro: "Пассивные бонусы и условия срабатывания карт. Числовые параметры приведены в объёме клиентских подсказок.",
    catalog: {heading: "Каталог карт", all: "Все карты"},
  }],
  ["/specifications/artifacts", {
    title: "Артефакты", label: "Эффект",
    intro: "Расовые бонусы за владение артефактами и победу в войне в пустыне муравьёв. Числа приведены там, где их указывает клиент.",
    catalog: {heading: "Эффекты артефактов", all: "Все эффекты"},
  }],
  ["/specifications/guild-skills", {
    title: "Умения гильдии", label: "Умение", level: "Уровень", effect: "Бонус по слепку",
    intro: "Умения и механизмы гильдии, требования к изучению и бонусы по уровням.",
    iconPicker: true,
    archiveSource: "https://web.archive.org/web/20250327233923/https://db.bsfg.ru/specifications/guild_skill/",
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
    featuredCategories: ["heavy", "light", "robe", "robe-legion", "form", "shields", "jewelry", "bracelets", "talismans"],
    related: [["/items/pit-boss-jewelry", "Бижутерия Пит-боссов"], ["/specifications/boss-trophies", "Трофеи боссов"]],
  }],
  ["/items/weapons", {
    title: "Оружие", navigationLabel: "Типы оружия", categories: WEAPON_CATEGORIES,
    intro: "Базовые характеристики, эффекты оружия и заточки, рецепты из клиента BSFG.",
    categoryGroups: [
      ["Ближний бой", [
        "two-handed-swords", "one-handed-swords", "daggers", "two-handed-hammers",
        "twin-swords", "ancient-swords", "paired-daggers", "one-handed-hammers", "steam-hammers", "sharp-axes",
        "halberds", "knuckles", "claw", "rapier", "rapier-with-symbol", "paired-rapiers",
      ], 4],
      ["Дальний бой", ["crossbows", "warp-crossbows", "long-bows", "short-bows", "shotguns"]],
      ["Магическое оружие", ["rod", "rod-symbol", "stick"]],
    ],
    previewStats: ["pAttack", "mAttack", "pAttackSpeed", "pCritical"],
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
const EQUIPMENT_STAT_FORMAT = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 4 });
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
let disposeMap;
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
  const avatar = renderIcon(catalogItem.icon, profession.title, "profession-avatar");
  avatar.id = "profession-avatar";
  document.querySelector("#profession-avatar").replaceWith(avatar);
  const descriptions = document.querySelector("#profession-descriptions");
  for (const paragraph of profession.descriptions) descriptions.append(el("p", "", paragraph));
  descriptions.parentElement.hidden = !profession.descriptions.length;

  renderSectionTabs(profession.sections);
}

function renderSectionTabs(sections) {
  const tabs = document.querySelector("#section-tabs");
  const search = document.querySelector("#skill-search");
  const activeTitle = document.querySelector("#active-section-title");
  const skillLevel = document.querySelector("#profession-skill-level");
  const levels = new Set(sections.flatMap(({ entries }) => entries.map(({ level }) => level)));
  let savedLevel = "";
  try {
    const value = localStorage.getItem(SKILL_LEVEL_KEY);
    if (/^[1-9]\d*$/.test(value)) savedLevel = value;
  } catch { /* The selector also works when browser storage is unavailable. */ }
  if (savedLevel) levels.add(savedLevel);
  for (const level of [...levels].sort((a, b) => Number(a) - Number(b))) {
    skillLevel.add(new Option(level, level));
  }
  skillLevel.value = savedLevel;
  let activeSection = 0;
  let applyLevel;

  sections.forEach((section, index) => {
    const button = el("button", "section-tab", section.title);
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(index === 0));
    button.addEventListener("click", () => {
      activeSection = index;
      for (const tab of tabs.children) {
        tab.setAttribute("aria-selected", String(tab === button));
      }
      refresh();
    });
    tabs.append(button);
  });

  const refresh = () => {
    const section = sections[activeSection];
    activeTitle.textContent = section.title;
    applyLevel = renderSkills(section, search.value);
    applyLevel(skillLevel.value);
  };
  search.addEventListener("input", refresh);
  skillLevel.addEventListener("change", () => {
    applyLevel(skillLevel.value);
    try {
      localStorage.setItem(SKILL_LEVEL_KEY, skillLevel.value);
    } catch { /* Keep the selection for the current page. */ }
  });
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
  const levelSwitchers = [];
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
    const branches = [...groupBy(rows, "branch").values()];
    for (const branchRows of branches) branchRows.sort((a, b) => Number(a.level) - Number(b.level));
    const levels = [...new Set(rows.map((row) => row.level))].sort((a, b) => Number(a) - Number(b));
    const { panel, setLevel } = renderLevelSwitcher(levels, name, (level) => {
      const selected = branches.map((branchRows) => branchRows.findLast((row) =>
        Number(row.level) <= Number(level)
      ) || branchRows[0]);
      if (selected.length > 1) return renderBranchComparison(name, selected, level);
      const [row] = selected;
      return row.branch === "base" ? renderLevel(row) : renderBranch(name, row, level);
    });
    content.append(panel);
    levelSwitchers.push(setLevel);
    details.append(content);
    list.append(details);
  });
  return (level) => { for (const setLevel of levelSwitchers) setLevel(level); };
}

function renderLevelSwitcher(levels, skillName, renderSelection) {
  const panel = el("div", "level-panel");
  const switcher = el("div", "level-switcher");
  const options = el("div", "level-options");
  options.setAttribute("role", "group");
  options.setAttribute("aria-label", "Уровень умения «" + skillName + "»");
  const levelContent = el("div", "level-detail");
  const buttons = [];
  let selectedIndex = -1;

  const selectLevel = (index) => {
    if (index === selectedIndex) return;
    selectedIndex = index;
    for (const button of buttons) {
      const selected = button === buttons[index];
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("is-selected", selected);
    }
    levelContent.replaceChildren(renderSelection(levels[index]));
  };

  for (const [index, level] of levels.entries()) {
    const button = el("button", "level-option", level);
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.title = "Показать уровень " + level;
    button.addEventListener("click", () => selectLevel(index));
    buttons.push(button);
    options.append(button);
  }

  switcher.append(el("span", "level-switcher-label", "Уровень умения"), options);
  panel.append(switcher, levelContent);
  return {
    panel,
    setLevel(level) {
      const index = level ? levels.findLastIndex((value) => Number(value) <= Number(level)) : levels.length - 1;
      selectLevel(Math.max(0, index));
    },
  };
}

function renderBranch(skillName, row, level, metrics) {
  const block = el("section", "branch-block");
  const heading = el("div", "branch-heading");
  const label = BRANCH_LABELS[row.branch] || row.branch;
  heading.append(
    renderIcon(localIconUrl(row.icon), row.name, "branch-icon"),
    el("h4", "", row.name === skillName ? label : label + " · " + row.name),
  );
  if (row.level !== level) heading.append(el("span", "branch-level", "Уровень " + row.level));
  block.append(heading, renderLevel(row));
  if (metrics) {
    const list = el("dl", "branch-metrics");
    list.append(
      el("dt", "", "Фиксированный урон"), el("dd", "", metrics.damage),
      el("dt", "", "Отравление"), el("dd", "", metrics.poison),
    );
    block.append(list);
  }
  return block;
}

function parseRetaliation(description) {
  // These three source descriptions explicitly enumerate every extra effect.
  const prefix = "Увеличивает критические повреждения магией. Когда повреждения нанесенные адепту превысили половину жизненных сил его магические атаки будут ";
  if (!description?.startsWith(prefix)) return null;
  const effect = description.slice(prefix.length);
  const damageOnly = effect.match(/^наносить дополнительно (\d+) фиксированного урона противникам\.$/);
  const poison = effect.match(/^дополнительно отравлять противников(?: и наносить им (\d+) фиксированного урона)?\. Сила отравления (\d+(?:[.,]\d+)?)%\.$/);
  if (!damageOnly && !poison) return null;
  const damage = damageOnly?.[1] || poison?.[1];
  return {
    damage: damage ? Number(damage).toLocaleString("ru-RU") : "—",
    poison: poison ? poison[2].replace(".", ",") + "%" : "—",
  };
}

function renderBranchComparison(skillName, rows, level) {
  const [first] = rows;
  const specifications = (first.specifications || []).filter((value) =>
    rows.every((row) => row.specifications?.includes(value))
  );
  const hasGroupedEffects = rows.some((row) =>
    row.effects_from_archive || row.effects?.some((effect) => effect.kind === "group")
  );
  const effects = hasGroupedEffects ? [] : (first.effects || []).filter((effect) =>
    rows.every((row) => row.effects?.some((item) => item.kind === effect.kind && item.text === effect.text))
  );
  const metrics = rows.map((row) => parseRetaliation(row.description));
  const hasRetaliationMetrics = metrics.every(Boolean);
  const sharedDescription = hasRetaliationMetrics
    ? "Когда полученный адептом урон превышает половину его запаса здоровья, его магические атаки получают дополнительный эффект."
    : "";
  const comparison = el("div", "branch-comparison");
  if (specifications.length || effects.length || sharedDescription) {
    const shared = el("div", "branch-common");
    shared.append(el("h3", "", "Общее для веток"), renderLevel({ description: sharedDescription, specifications, effects }));
    comparison.append(shared);
  }
  const grid = el("div", "branch-grid");
  for (const [index, row] of rows.entries()) {
    grid.append(renderBranch(skillName, {
      ...row,
      specifications: row.specifications?.filter((value) => !specifications.includes(value)),
      effects: row.effects?.filter((effect) => !effects.some((item) => item.kind === effect.kind && item.text === effect.text)),
    }, level, hasRetaliationMetrics ? metrics[index] : null));
  }
  comparison.append(el("h3", "branch-comparison-title", "Сравнение веток"), grid);
  return comparison;
}

function renderEffectList(effects) {
  const list = el("dl", "effect-list");
  for (const effect of effects) {
    const parts = effect.text.split(":");
    const label = parts.shift();
    const className = effect.kind === "group" ? "effect-group" : "";
    list.append(el("dt", className, label), el("dd", className, parts.join(":").trim() || "—"));
  }
  return list;
}

function renderLevel(row) {
  const card = el("article", "level-card");
  if (row.description) card.append(el("p", "level-description", row.description));

  if (row.specifications && row.specifications.length) {
    const specifications = el("ul", "spec-list");
    for (const value of row.specifications) specifications.append(el("li", "", value));
    card.append(specifications);
  }

  if (row.effects?.length && !row.effects_from_archive) card.append(renderEffectList(row.effects));
  const archive = row.effects_from_archive ? row.effects : row.archived_effects;
  if (archive?.length) {
    const details = el("details", "");
    details.append(el("summary", "", "Архивные эффекты"), renderEffectList(archive));
    card.append(details);
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
  const dialog = document.querySelector("#equipment-dialog");
  const search = document.querySelector("#equipment-search");
  renderEquipmentNavigation(navigation, path, catalog, category, data.items);

  const items = new Map(data.items.map(item => [item.id, item]));
  const sets = (data.sets || []).filter(group => group.category === category);
  const memberIds = new Set(sets.flatMap(group => group.items));
  const entries = groupEquipmentSets(sets, items);
  for (const item of data.items) {
    if (item.category === category && !memberIds.has(item.id)) entries.push([{items: [item]}]);
  }
  const ranks = ["BA", "EX", "EL", "MA", "GM", "LEG", ""];
  entries.sort(([a], [b]) => ranks.indexOf(a.items[0].rank) - ranks.indexOf(b.items[0].rank)
    || a.items[0].name.localeCompare(b.items[0].name, "ru") || a.items[0].id - b.items[0].id);
  const rank = document.querySelector("#equipment-rank");
  const present = new Set(entries.map(([entry]) => entry.items[0].rank));
  rank.append(new Option("Все ранги", "all"));
  for (const value of ranks) {
    if (present.has(value)) rank.append(new Option(value || "Без ранга", value));
  }

  const results = document.querySelector("#equipment-results");
  const counter = document.querySelector("#equipment-count");
  const selectedParameters = new Set();
  const parameters = ["talismans", "jewelry"].includes(category)
    ? new Map(entries.flatMap(variants => variants.flatMap(variant =>
      variant.items.map(item => [item.id, equipmentParameters(item)]))))
    : null;
  const refresh = () => {
    const query = normalize(search.value.trim());
    const matches = [];
    for (const variants of entries) {
      if (rank.value !== "all" && variants[0].items[0].rank !== rank.value) continue;
      const match = variants.find(variant => variant.items.some(item =>
        (normalize(item.name + " " + (item.label || "")).includes(query) || String(item.id) === query)
        && (!selectedParameters.size || [...selectedParameters].some(parameter => parameters.get(item.id).has(parameter)))));
      if (match) matches.push(renderEquipmentPreview(variants, match, dialog, catalog.previewStats));
    }
    results.replaceChildren(...matches);
    counter.textContent = matches.length ? "Показано " + matches.length : "Совпадений нет.";
  };
  search.addEventListener("input", refresh);
  rank.addEventListener("change", refresh);
  if (parameters) {
    const filter = renderEquipmentParameterFilter(parameters, selectedParameters, refresh);
    document.querySelector(".equipment-toolbar").after(filter);
  }
  refresh();
}

function equipmentParameters(item) {
  const parameters = new Set(Object.keys(item.stats || {}).map(key =>
    equipmentParameterLabel(key)));
  for (const effect of item.effects || []) {
    for (const line of effect.split("\n")) {
      const match = line.trim().match(/^(.+?)(?:\s+[+−-]|:\s*)\d/);
      if (match) parameters.add(match[1] === "Увеличивает сопротивление фиксированным повреждениям на"
        ? "Сопротивление фиксированным повреждениям" : match[1]);
    }
    // This description lists three bonuses in prose instead of separate numeric lines.
    if (effect.includes("Увеличивает урон по монстрам на")) {
      parameters.add("Повреждения по монстрам");
      parameters.add("Атака по вражеским игрокам");
      parameters.add("Защита от вражеских игроков");
    }
    if (/^Увеличивает физическую защиту на [\d.,]+% и магическую защиту на [\d.,]+%\.$/.test(effect)) {
      parameters.add("Физическая защита");
      parameters.add("Магическая защита");
    }
  }
  return parameters;
}

function equipmentParameterLabel(key) {
  return key === "mDefense" ? "Магическая защита" : (key === "pDefense" ? "Физическая защита" : EQUIPMENT_STATS[key]);
}

function renderEquipmentParameterFilter(parameters, selected, onChange) {
  const details = el("details", "equipment-parameter-filter");
  const summary = el("summary", "", "Параметры: все");
  const fields = el("fieldset");
  fields.append(el("legend", "visually-hidden", "Параметры предметов"));
  const hint = el("p", "equipment-parameter-filter-hint", "Показаны предметы, у которых есть хотя бы один из выбранных параметров.");
  hint.id = "equipment-parameter-filter-hint";
  fields.setAttribute("aria-describedby", hint.id);
  const options = el("div", "equipment-parameter-filter-options");
  const reset = el("button", "class-option", "Сбросить параметры");
  reset.type = "button";
  reset.disabled = true;
  const update = () => {
    summary.textContent = selected.size ? "Параметры: выбрано " + selected.size : "Параметры: все";
    reset.disabled = !selected.size;
    onChange();
  };
  const labels = [...new Set([...parameters.values()].flatMap(values => [...values]))].sort((a, b) => a.localeCompare(b, "ru"));
  for (const label of labels) {
    const field = el("label", "equipment-parameter-filter-option");
    const input = el("input");
    input.type = "checkbox";
    input.value = label;
    input.addEventListener("change", () => {
      if (input.checked) selected.add(label);
      else selected.delete(label);
      update();
    });
    field.append(input, el("span", "", label));
    options.append(field);
  }
  reset.addEventListener("click", () => {
    selected.clear();
    for (const input of options.querySelectorAll("input")) input.checked = false;
    update();
  });
  fields.append(hint, options, reset);
  details.append(summary, fields);
  return details;
}

function renderEquipmentNavigation(navigation, path, catalog, category, items) {
  navigation.setAttribute("aria-label", catalog.navigationLabel);
  const links = new Map();
  for (const [key, label] of Object.entries(catalog.categories)) {
    const link = el("a", "class-option");
    link.href = "#" + path + "/" + key;
    if (key === category) link.setAttribute("aria-current", "page");
    const icon = items.find(item => item.category === key && item.icon)?.icon;
    link.append(renderIcon(localIconUrl(icon), label, "branch-icon equipment-category-icon"));
    link.append(label);
    links.set(key, link);
  }
  navigation.append(el("h2", "", catalog.categoryGroups ? catalog.navigationLabel : "Категории"));
  const groups = catalog.categoryGroups || [["", catalog.featuredCategories]];
  const picker = el("label", "progression-field equipment-category-picker");
  const select = el("select");
  for (const [name, keys, visibleCount = keys.length] of groups) {
    const list = el("div", "equipment-category-links");
    const additional = el("div", "equipment-category-links");
    const options = name ? el("optgroup") : select;
    if (name) {
      options.label = name;
      select.append(options);
      const group = el("div", "equipment-category-group");
      group.append(el("h3", "", name), list);
      if (keys.length > visibleCount) {
        const more = el("details", "equipment-group-more");
        more.open = keys.indexOf(category) >= visibleCount;
        more.append(el("summary", "", "Другие типы"), additional);
        group.append(more);
      }
      navigation.append(group);
    } else {
      navigation.append(list);
    }
    for (const [index, key] of keys.entries()) {
      const destination = index < visibleCount ? list : additional;
      destination.append(links.get(key));
      options.append(new Option(catalog.categories[key], path + "/" + key));
      links.delete(key);
    }
  }

  const extra = el("div", "equipment-category-links");
  for (const [key, link] of links) {
    extra.append(link);
    select.add(new Option(catalog.categories[key], path + "/" + key));
  }
  for (const [relatedPath, label] of catalog.related) {
    const link = el("a", "class-option", label);
    link.href = "#" + relatedPath;
    extra.append(link);
    select.add(new Option(label, relatedPath));
  }
  if (extra.childElementCount) {
    if (catalog.categoryGroups) navigation.append(extra);
    else navigation.querySelector(".equipment-category-links").append(...extra.children);
  }
  select.value = path + "/" + category;
  select.addEventListener("change", () => { location.hash = select.value; });
  picker.append(el("span", "", catalog.categoryGroups ? "Тип оружия" : "Категория"), select);
  navigation.append(picker);
}

function groupEquipmentSets(sets, itemsById) {
  const groups = new Map();
  for (const set of sets) {
    const items = set.items.map(id => itemsById.get(id));
    const [first] = items;
    const pieces = items.map(item => JSON.stringify([item.slot, item.name])).sort();
    const key = JSON.stringify([first.rank, first.name, pieces]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({set, items});
  }
  return [...groups.values()];
}

function renderEquipmentPreview(variants, entry, dialog, statKeys) {
  const [first] = entry.items;
  if (["talismans", "jewelry", "bracelets", "hunter-bracelets"].includes(first.category)) return renderAccessoryPreview(first);
  const card = el("article", "enchant-card equipment-preview");
  const header = el("header");
  const identity = el("div");
  const heading = el("div", "equipment-preview-heading");
  heading.append(el("h3", "", first.name), el("span", "equipment-rank", first.rank || "Без ранга"));
  const subtitle = el("p", "equipment-preview-meta");
  const icons = el("ul", "equipment-preview-icons");
  const defense = entry.set ? el("dl", "equipment-preview-defense") : null;
  const defenseValue = defense && el("dd");
  if (defense) defense.append(el("dt", "", "Физ. защита комплекта"), defenseValue);
  const actions = el("div", "equipment-preview-actions");
  const viewLabel = statKeys ? "Подробнее" : (entry.set ? "Смотреть комплект" : "Смотреть предмет");
  const view = el("button", "class-option equipment-preview-view", viewLabel);
  const recipes = statKeys && first.recipes?.length
    ? el("button", "class-option equipment-preview-recipes", first.recipes.length === 1 ? "Рецепт" : "Рецепты")
    : null;
  let active = entry;
  const updatePreview = (variant) => {
    active = variant;
    const item = variant.items[0];
    subtitle.textContent = (variant.set ? ["Комплект", item.label] : [item.slot, item.label, "ID " + item.id])
      .filter(Boolean).join(" · ");
    icons.replaceChildren(...variant.items.map(piece => {
      const icon = el("li");
      icon.title = piece.name;
      icon.append(
        renderIcon(localIconUrl(piece.icon), piece.name, "branch-icon equipment-preview-icon"),
        el("span", "visually-hidden", piece.name),
      );
      return icon;
    }));
    if (defenseValue) {
      const total = variant.items.reduce((sum, piece) => sum + (piece.stats?.pDefense ?? 0), 0);
      defenseValue.textContent = EQUIPMENT_STAT_FORMAT.format(total);
    }
  };
  const open = (showRecipes, trigger) => {
    dialog.querySelector("#equipment-dialog-title").textContent = first.name;
    const details = active.set
      ? renderEquipmentSet(variants, active, showRecipes, updatePreview)
      : renderEquipmentItem(active.items[0], showRecipes);
    dialog.querySelector(".equipment-dialog-content").replaceChildren(details);
    dialog.addEventListener("close", () => {
      trigger.focus({ preventScroll: true });
    }, { once: true });
    dialog.showModal();
    dialog.scrollTop = 0;
  };
  for (const button of recipes ? [view, recipes] : [view]) {
    button.type = "button";
    button.setAttribute("aria-label", button.textContent + " — " + first.name);
    button.setAttribute("aria-haspopup", "dialog");
    button.addEventListener("click", () => open(button === recipes, button));
    actions.append(button);
  }
  identity.append(heading, subtitle);
  if (statKeys) {
    card.classList.add("weapon-preview");
    icons.setAttribute("aria-hidden", "true");
    header.append(icons, identity);
    card.append(header, renderWeaponPreviewStats(first, statKeys), actions);
  } else {
    header.append(identity);
    card.append(header, icons);
    if (defense) card.append(defense);
    card.append(actions);
  }
  updatePreview(entry);
  return card;
}

function renderAccessoryPreview(item) {
  const card = el("article", "enchant-card equipment-preview accessory-preview");
  card.dataset.itemId = item.id;
  const header = el("header");
  const identity = el("div");
  const heading = el("div", "equipment-preview-heading");
  heading.append(el("h3", "", item.name), el("span", "equipment-rank", item.rank || "Без ранга"));
  identity.append(heading, el("p", "equipment-preview-meta", [item.slot, item.label, "ID " + item.id].filter(Boolean).join(" · ")));
  header.append(renderIcon(localIconUrl(item.icon), item.name, "branch-icon equipment-preview-icon"), identity);
  const stats = el("dl", "jewelry-stats accessory-stats");
  for (const [key, value] of Object.entries(item.stats || {})) {
    stats.append(el("dt", "", equipmentParameterLabel(key)), el("dd", "", EQUIPMENT_STAT_FORMAT.format(value)));
  }
  card.append(header);
  if (stats.childElementCount) card.append(stats);
  if (item.effects?.length || item.enchant_effect) {
    const effects = el("div", "accessory-effects");
    for (const effect of item.effects || []) effects.append(el("p", "progression-effect", effect));
    if (item.enchant_effect) effects.append(el("p", "progression-effect", "Эффект заточки · " + item.enchant_effect));
    card.append(effects);
  }
  if (item.recipes?.length) card.append(renderEquipmentRecipes(item));
  return card;
}

function renderWeaponPreviewStats(item, statKeys) {
  const stats = el("dl", "weapon-preview-stats");
  for (const key of statKeys) {
    const value = item.stats?.[key];
    if (value === undefined) continue;
    const metric = el("div");
    metric.append(
      el("dt", "", EQUIPMENT_STATS[key]),
      el("dd", "", EQUIPMENT_STAT_FORMAT.format(value)),
    );
    stats.append(metric);
  }
  stats.hidden = !stats.childElementCount;
  return stats;
}

function renderEquipmentSet(variants, entry, showRecipes, onVariantChange) {
  const section = el("div", "equipment-set");
  const content = el("div");
  const showVariant = (variant) => {
    const notes = variant.set.effects.map(effect => el("p", "equipment-set-note", effect));
    const pieces = el("div", "equipment-pieces");
    pieces.append(...variant.items.map(item => renderEquipmentItem(item, showRecipes)));
    content.replaceChildren(...notes, pieces);
  };
  if (variants.length > 1) {
    const field = el("label", "progression-field equipment-set-variant");
    const select = el("select");
    const labels = variants.map(variant => variant.items[0].label);
    variants.forEach((variant, index) => {
      const item = variant.items[0];
      const label = item.label && labels.filter(value => value === item.label).length === 1
        ? item.label : [item.label, "ID " + item.id].filter(Boolean).join(" · ");
      select.add(new Option(label, index));
    });
    select.selectedIndex = variants.indexOf(entry);
    select.addEventListener("change", () => {
      const variant = variants[select.selectedIndex];
      showVariant(variant);
      onVariantChange(variant);
    });
    field.append(el("span", "", "Вариант комплекта"), select);
    section.append(field);
  }
  section.append(content);
  showVariant(entry);
  return section;
}

function renderEquipmentItem(item, showRecipes = false) {
  const card = el("article", "enchant-card equipment-item");
  card.dataset.itemId = item.id;
  const heading = el("header", "enchant-heading");
  heading.append(renderIcon(localIconUrl(item.icon), item.name, "branch-icon"), el("h4", "", item.name));
  heading.append(el("p", "", [item.rank || "Без ранга", item.slot, item.label, "ID " + item.id].filter(Boolean).join(" · ")));
  card.append(heading);
  const stats = el("dl", "jewelry-stats equipment-stats");
  for (const [key, value] of Object.entries(item.stats || {})) {
    stats.append(el("dt", "", EQUIPMENT_STATS[key]), el("dd", "", EQUIPMENT_STAT_FORMAT.format(value)));
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
  if (item.recipes?.length) card.append(renderEquipmentRecipes(item, showRecipes));
  return card;
}

function renderEquipmentRecipes(item, open = false) {
  const details = el("details", "equipment-details");
  details.open = open;
  details.append(el("summary", "", "Рецепты"));
  for (const recipe of item.recipes) {
    details.append(el("p", "", "Рецепт " + recipe.id + " · уровень " + recipe.level
      + " · результат ×" + recipe.quantity + " · шанс " + recipe.success + "%"
      + (recipe.mana === undefined ? "" : " · мана " + recipe.mana.toLocaleString("ru-RU"))));
    const materials = el("ul");
    for (const [name, quantity] of recipe.materials) materials.append(el("li", "", name + " × " + quantity.toLocaleString("ru-RU")));
    details.append(materials);
  }
  return details;
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
  const iconPicker = page.iconPicker ? el("div", "guild-skill-picker") : null;
  if (iconPicker) {
    iconPicker.setAttribute("role", "group");
    iconPicker.setAttribute("aria-label", "Умения и механизмы гильдии");
    select.closest("label").classList.add("guild-skill-select");
    results.before(iconPicker);
  }
  if (page.archiveSource) {
    const link = el("a", "", "слепка от 27 марта 2025 года");
    link.href = page.archiveSource;
    document.querySelector("#progression-release").parentElement.append(
      ". Числовые бонусы взяты из ", link, ".");
  }
  const {catalog} = page;
  if (catalog) {
    document.querySelector("#progression-table-heading").textContent = catalog.heading;
    results.classList.add("progression-catalog-grid");
  }
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
  let matches = groups;

  const showGroup = () => {
    if (iconPicker) {
      for (const button of iconPicker.children) {
        button.setAttribute("aria-pressed", String(button.value === select.value));
      }
    }
    if (select.value === "all") {
      results.replaceChildren(...matches.map(({group}) => renderProgressionCatalogCard(group)));
      return;
    }
    const entry = matches.find(({index}) => index === select.value);
    if (!entry) {
      results.replaceChildren(el("p", "empty-state", "Совпадений нет."));
      return;
    }
    const {group, label} = entry;
    if (catalog) {
      results.replaceChildren(renderProgressionCatalogCard(group));
      return;
    }
    const idKey = group.levels[0].item_id ? "item_id" : "effect_id";
    const showId = Boolean(group.levels[0][idKey]);
    const card = el("article", "enchant-card progression-card");
    const heading = el("header", "progression-card-heading");
    if (group.icon) heading.append(renderIcon(localIconUrl(group.icon), group.name, "branch-icon"));
    heading.append(el("h3", "", label));
    const showLevel = !page.kinds || group.kind === "combined";
    const columns = showLevel ? [page.level, page.effect || "Эффект"] : [page.effect];
    const showBuilding = group.levels.some(row => row.building_level);
    if (showBuilding) columns.splice(1, 0, "Уровень строения");
    if (showId) columns.push("ID");
    const table = createEnchantTable(label, columns);
    if (!showLevel) table.classList.add("progression-unleveled");
    const body = table.createTBody();
    for (const row of group.levels) {
      const entry = body.insertRow();
      if (showLevel) {
        const level = el("th", "", row.level);
        level.scope = "row";
        entry.append(level);
      }
      if (showBuilding) entry.append(el("td", "", row.building_level ?? "—"));
      entry.append(el("td", "progression-effect", row.effect));
      if (showId) entry.append(el("td", "progression-id", row[idKey]));
    }
    card.append(heading);
    if (group.description) {
      const description = el("div", "guild-skill-description");
      description.append(el("p", "", group.description));
      if (showBuilding) description.append(el("p", "", "Строения для изучения: " + data.study_buildings + "."));
      if (group.note) description.append(el("p", "", group.note));
      card.append(description);
    }
    card.append(table);
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
    matches = groups.filter(({group, label}) => (!page.kinds || group.kind === kind.value)
      && (normalize(label).includes(query) || normalize(group.active?.effect).includes(query)
        || normalize(group.description).includes(query)
        || String(group.closed_item_id ?? "").includes(query)
        || group.levels.some(row => normalize(row.effect).includes(query)
          || String(row.item_id ?? "").includes(query))));
    const options = matches.map(({index, label}) => new Option(label, index));
    if (catalog && options.length) options.unshift(new Option(catalog.all, "all"));
    select.replaceChildren(...options);
    select.disabled = matches.length === 0;
    if (matches.some(({index}) => index === selected)) select.value = selected;
    if (iconPicker) {
      iconPicker.replaceChildren(...matches.map(({group, index, label}) => {
        const button = el("button", "class-option guild-skill-option");
        button.type = "button";
        button.value = index;
        button.append(renderIcon(localIconUrl(group.icon), "", "branch-icon"), el("span", "", label));
        button.addEventListener("click", () => {
          select.value = index;
          showGroup();
        });
        return button;
      }));
    }
    showGroup();
  };
  search.addEventListener("input", filterGroups);
  kind.addEventListener("change", filterGroups);
  select.addEventListener("change", showGroup);
  filterGroups();
}

function renderProgressionCatalogCard(group) {
  const card = el("article", "enchant-card progression-card progression-catalog-card");
  const heading = el("header", "progression-card-heading");
  const [first] = group.levels;
  const title = el("div");
  title.append(el("h3", "", group.name));
  if (group.closed_item_id) {
    const last = group.levels.at(-1);
    const levelRange = first.level === last.level ? "Уровень " + first.level : "Уровни " + first.level + "–" + last.level;
    const meta = el("div", "sibyl-card-meta");
    meta.append(el("span", "", levelRange), el("span", "", "ID карты " + group.closed_item_id));
    title.append(meta);
  }
  heading.append(renderIcon(localIconUrl(group.icon), group.name, "branch-icon"), title);
  card.append(heading);

  if (group.levels.every(row => row.effect === first.effect)) {
    card.append(el("p", "progression-catalog-effect progression-effect", first.effect));
  } else {
    const effects = el("dl", "progression-catalog-effect sibyl-card-levels");
    for (const row of group.levels) {
      effects.append(el("dt", "", "Уровень " + row.level), el("dd", "progression-effect", row.effect));
    }
    card.append(effects);
  }
  return card;
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
  const counter = el("p", "equipment-count");
  counter.setAttribute("role", "status");
  results.before(counter);
  const selectedParameters = new Set();
  const parameters = new Map(data.ranks.flatMap(rank => rank.bosses.flatMap(boss =>
    boss.items.map(item => [item, equipmentParameters({...item, stats: {mDefense: item.magic_defense}})]))));
  let activeRank = data.ranks[0];
  let activeVariant;

  const refresh = () => {
    const query = normalize(search.value.trim());
    const groups = document.createDocumentFragment();
    let count = 0;
    for (const boss of activeRank.bosses) {
      const bossMatches = normalize(boss.name).includes(query);
      const items = boss.items.filter((item) => item.variant === activeVariant
        && (bossMatches || normalize(item.name).includes(query) || query === String(item.item_id))
        && (!selectedParameters.size || [...selectedParameters].some(parameter => parameters.get(item).has(parameter))));
      if (items.length === 0) continue;
      count += items.length;
      const section = el("section", "jewelry-boss");
      const grid = el("div", "enchant-grid jewelry-grid");
      grid.append(...items.map(renderJewelryItem));
      section.append(el("h2", "enchant-title", boss.name), grid);
      groups.append(section);
    }
    empty.hidden = groups.childElementCount > 0;
    results.replaceChildren(groups);
    counter.textContent = count ? "Показано " + count : "Совпадений нет.";
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
  document.querySelector(".jewelry-toolbar").after(renderEquipmentParameterFilter(parameters, selectedParameters, refresh));
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
  disposeMap?.();
  disposeMap = undefined;
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
    } else if (path === "/map-v2") {
      document.title = "Интерактивная карта 2.0 — База знаний BSFG";
      app.replaceChildren(cloneTemplate("#embedded-map-template"));
    } else if (path === "/map") {
      if (!worldMap) {
        app.replaceChildren(cloneTemplate("#loading-template"));
        worldMap = await loadJson("data/map/world.json");
      }
      if (version !== routeVersion) return;
      document.title = "Интерактивная карта — База знаний BSFG";
      app.replaceChildren(cloneTemplate("#world-map-template"));
      disposeMap = mountWorldMap(app, worldMap);
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
