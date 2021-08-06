import { AMP, GT, LT, mapValues, parseYaml, QUOT, tag as h } from "./deps.ts";
import { getDenoteCss } from "./css_functions.ts";

import {
  ConfigObject,
  ListGroup,
  // disableFlag,
  ListItem,
} from "./types.ts";

export function sanitize(str: string): string {
  return str
    .replaceAll("&", AMP)
    .replaceAll("<", LT)
    .replaceAll(">", GT)
    .replaceAll(`"`, QUOT);
}

export function loadConfig(filename: string): ConfigObject {
  const {
    name,
    projectName,
    disable,
    title,
    description,
    mainImage,
    favicon,
    twitter,
    list,
  } = parseYaml(Deno.readTextFileSync(filename)) as ConfigObject;

  if (!name) {
    throw new Error("name is required");
  }

  if (!list || Object.keys(list).length === 0) {
    throw new Error("list is empty");
  }

  return {
    ...mapValues(
      {
        name,
        projectName: projectName || name,
        title: title || `${name} | denote`,
        description,
        twitter: (twitter || "").replace(/^([^@])/, "@$1"),
      },
      (value: string) => sanitize(value),
    ),
    mainImage: encodeURI(mainImage),
    favicon: encodeURI(favicon || mainImage),
    disable: (disable || []),
    list: mapValues(
      list,
      (group: ListGroup) => ({
        icon: group.icon || null,
        items: group.items.map((item) => ({
          icon: item.icon || null,
          text: sanitize(item.text),
          link: item.link ? encodeURI(item.link) : null,
        })),
      }),
    ),
  } as ConfigObject;
}

export function icongram(name: string, size = 20, attrs = {}) {
  const regex =
    /^(clarity|devicon|entypo|feather|fontawesome|jam|material|octicons|simple)\/[\w-]$/;
  if (!regex.test(name)) {
    throw new Error(
      `invalid icon name: ${name}, icon name should be matched with ${regex}`,
    );
  }

  return h("img", {
    src: `https://icongr.am/${name}.svg?size=${size}&color=f0ffff`,
    alt: name,
    ...attrs,
  });
}

const exLink = icongram("feather/external-link", 12, { class: "inline" });
const renderListItem = (listItem: ListItem) => {
  const { icon, text, link: href } = listItem;

  const iconText = (icon = "", text = "") =>
    h(
      "div",
      { class: "list-item" },
      icon ? icongram(icon) : "",
      h("div", text),
    );

  return href
    ? h("a", { href }, iconText(icon, text + " " + exLink))
    : iconText(icon, text);
};

const rainCount = 30;

export function renderHtmlHead(config: ConfigObject) {
  const {
    description,
    projectName,
    title,
    mainImage,
    favicon,
    twitter,
  } = config;

  return h(
    "head",
    { prefix: "og:http://ogp.me/ns#" },
    h("meta", { charset: "utf-8" }),
    h("meta", {
      name: "viewport",
      content: "width=device-width,initial-scale=1.0",
    }),
    h("meta", {
      property: "og:url",
      content: `https://${projectName}.deno.dev`,
    }),
    h("meta", { property: "og:type", content: "website" }),
    h("meta", { property: "og:title", content: title }),
    description
      ? h("meta", { property: "og:description", content: description })
      : "",
    h("meta", { property: "og:site_name", content: title }),
    h("meta", { property: "og:image", content: mainImage }),
    h("meta", { name: "twitter:card", content: "summary" }),
    twitter
      ? h("meta", {
        name: "twitter:site",
        content: twitter.replace(/^([^@])/, "@$1"),
      })
      : "",
    h("title", title),
    h("style", getDenoteCss(rainCount)),
    favicon ? h("link", { rel: "icon", href: favicon }) : "",
  );
}

export function renderHtmlBody(config: ConfigObject) {
  const {
    name,
    description,
    mainImage,
    list: listInConfig,
  } = config;
  const list = Object.entries(listInConfig);

  return h(
    "body",
    h("div", { class: "rain" }, h("div", { class: "drop" }).repeat(rainCount)),
    h(
      "div",
      { id: "main" },
      h("img", { alt: "main-image", class: "main-image", src: mainImage }),
      h("h1", name),
      description ? h("div", { class: "description" }, description) : "",
      h("div", "Click to jump..."),
      h(
        "div",
        { class: "nav-box" },
        h(
          "div",
          { class: "nav" },
          ...list.map(([id, listGroup]) =>
            h("a", { href: `#${id}` }, icongram(listGroup.icon, 26))
          ),
        ),
      ),
      h(
        "div",
        { class: "list-group" },
        ...list.map(([id, listGroup]) => {
          const { icon, items } = listGroup;
          return h("h2", { id }, icongram(icon, 40)) +
            items.map((listItem) => renderListItem(listItem)).join("");
        }),
      ),
      h(
        "div",
        "Powered by ",
        h("a", {
          href: "https://deno.com/deploy",
        }, "Deno Deploy"),
        " ",
        exLink,
      ),
    ),
  );
}

export function renderHtml(filename: string) {
  const config = loadConfig(filename);
  return "<!DOCTYPE html>" +
    h("html", renderHtmlHead(config), renderHtmlBody(config));
}
