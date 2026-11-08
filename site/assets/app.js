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

const app = document.querySelector("#app");
const siteLinks = document.querySelectorAll(".site-nav a");
const enchantData = new Map();
let archiveIndex;
let pitJewelry;
let routeVersion = 0;

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

function renderPitJewelry(data) {
  document.title = "Бижутерия Пит-боссов — База знаний BSFG";
  app.replaceChildren(cloneTemplate("#pit-jewelry-template"));
  document.querySelector("#jewelry-source").href = data.source;
  const ranks = document.querySelector("#jewelry-ranks");
  const variants = document.querySelector("#jewelry-variant-filter");
  const variantButtons = variants.querySelectorAll("button");
  const search = document.querySelector("#jewelry-search");
  const results = document.querySelector("#jewelry-results");
  const empty = document.querySelector("#empty-jewelry");
  let activeRank = data.ranks[0];
  let maVariant = "normal";

  const refresh = () => {
    const isMA = activeRank.rank === "MA";
    variants.hidden = !isMA;
    const variant = isMA ? maVariant : "normal";
    const query = normalize(search.value.trim());
    const groups = document.createDocumentFragment();
    for (const boss of activeRank.bosses) {
      const bossMatches = normalize(boss.name).includes(query);
      const items = boss.items.filter((item) => item.variant === variant
        && (bossMatches || normalize(item.name).includes(query)));
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

  for (const rank of data.ranks) {
    const button = el("button", "class-option", rank.rank);
    button.type = "button";
    button.setAttribute("aria-pressed", String(rank === activeRank));
    button.addEventListener("click", () => {
      activeRank = rank;
      for (const option of ranks.children) option.setAttribute("aria-pressed", String(option === button));
      refresh();
    });
    ranks.append(button);
  }
  for (const button of variantButtons) {
    button.addEventListener("click", () => {
      maVariant = button.value;
      for (const option of variantButtons) option.setAttribute("aria-pressed", String(option === button));
      refresh();
    });
  }
  search.addEventListener("input", refresh);
  refresh();
}

function renderJewelryItem(item) {
  const card = el("article", "enchant-card jewelry-card");
  const heading = el("header", "enchant-heading");
  heading.append(renderIcon(localIconUrl(item.icon), item.name, "branch-icon"), el("h3", "", item.name));
  const stats = el("dl", "jewelry-stats");
  stats.append(el("dt", "", "Магическая защита"), el("dd", "", item.magic_defense));
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
  const path = location.hash.slice(1).replace(/\/+$/, "") || "/";
  const profession = path.match(/^\/(?:profession|professions)\/([^/?#]+)$/);
  const isProfessionSection = path === "/professions" || profession !== null;
  const enchantPage = ENCHANT_PAGES.get(path);
  const isSpecifications = path === "/specifications" || enchantPage !== undefined;
  let activeSection = path;
  if (isProfessionSection) activeSection = "/professions";
  else if (isSpecifications) activeSection = "/specifications";
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
    } else if (path === "/specifications") {
      document.title = "Характеристики — База знаний BSFG";
      app.replaceChildren(cloneTemplate("#specifications-template"));
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
