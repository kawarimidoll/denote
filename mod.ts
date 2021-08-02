import { parseYaml, serve, tag as h } from "./deps.ts";
import { createDeployServer } from "./create_deploy_server.ts";
import { getDenoteCss } from "./css_functions.ts";

import {
  // disableFlag,
  ListItem,
  ProfileConfiguration,
} from "./types.ts";

const {
  name,
  projectName,
  title: titleInConfig,
  bio,
  // TODO: use disableFlags
  // disable,
  avatar,
  favicon,
  twitter: twitterInConfig,
  list: listInConfig,
} = parseYaml(Deno.readTextFileSync("./denote.yml")) as ProfileConfiguration;

// TODO: validate with custom schema
if (!name || !projectName || !avatar || !listInConfig) {
  throw new Error("missing required data");
}

const title = titleInConfig || `${name} profile`;
const twitter = (twitterInConfig || "").replace(/^([^@])/, "@$1");
const list = Object.entries(listInConfig);
if (list.length === 0) {
  throw new Error("list item is empty");
}

// TODO: add validation
const icongram = (name: string, size = 20, attrs = {}) =>
  h("img", {
    src: `https://icongr.am/${
      name.replace(/(^[^\/]*$)/, "feather/$1")
    }.svg?size=${size}&color=f0ffff`,
    alt: name,
    ...attrs,
  });

const exLink = icongram("external-link", 12, { class: "inline" });
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

const htmlHead = h(
  "head",
  { prefix: "og:http://ogp.me/ns#" },
  h("meta", { charset: "utf-8" }),
  h("meta", {
    name: "viewport",
    content: "width=device-width,initial-scale=1.0",
  }),
  h("meta", { property: "og:url", content: `https://${projectName}.deno.dev` }),
  h("meta", { property: "og:type", content: "website" }),
  h("meta", { property: "og:title", content: title }),
  h("meta", { property: "og:description", content: `About ${name}` }),
  h("meta", { property: "og:site_name", content: title }),
  h("meta", { property: "og:image", content: avatar }),
  h("meta", { name: "twitter:card", content: "summary" }),
  twitter ? h("meta", { name: "twitter:site", content: twitter }) : "",
  h("title", title),
  h("style", getDenoteCss(rainCount)),
  favicon ? h("link", { rel: "icon", href: favicon }) : "",
);

const htmlBody = h(
  "body",
  h("div", { class: "rain" }, h("div", { class: "drop" }).repeat(rainCount)),
  h(
    "div",
    { id: "main" },
    h("img", { alt: "avatar", class: "avatar", src: avatar }),
    h("h1", name),
    bio ? h("div", { class: "bio" }, bio) : "",
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

const html = "<!DOCTYPE html>" + h("html", htmlHead, htmlBody);

if (Deno.args.includes("--build") || Deno.args.includes("-b")) {
  Deno.writeTextFileSync("./server.js", createDeployServer(html));
  Deno.exit(0);
}

const port = 8080;
const server = serve({ port });
console.log(`HTTP webserver running. Access it at: http://localhost:${port}/`);
for await (const request of server) {
  const headers = new Headers({ "content-type": "text/html" });
  request.respond({ status: 200, body: html, headers });
}
