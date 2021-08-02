import { parseYaml, range, serve, shuffle, tag as h } from "./deps.ts";
import { createDeployServer } from "./create_deploy_server.ts";

import {
  CssObject,
  // disableFlag,
  // ListGroup,
  ListItem,
  ProfileConfiguration,
} from "./types.ts";

const css = (cssObject: CssObject) =>
  Object.entries(cssObject).map(([selector, attributes]) =>
    selector + "{" +
    Object.entries(attributes).map(([k, v]) => `${k}:${v}`).join(";") +
    "}"
  ).join("");

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
} = parseYaml(Deno.readTextFileSync("./config.yml")) as ProfileConfiguration;

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
const getRandomInt = (max: number) => Math.floor(Math.random() * max);

const cssYml = `
body:
  display: flex
  justify-content: center
  margin: 0
  text-align: center
  scroll-behavior: smooth
  font-family: "sans-serif,monospace"
  background-color: "#111"
  color: azure
a:
  # text-decoration: none
  color: inherit
h2:
  margin: "-2rem auto 0"
  padding-top: 4rem
img:
  display: block
  margin: 0 auto
"#main":
  width: 100%
  max-width: 800px
  padding: 1rem 0.5rem
.avatar:
  border-radius: 50%
  width: 260px
  height: 260px
  object-fit: cover
.bio:
  margin-bottom: 2rem
.list-group:
  max-width: 500px
  margin: 0 auto
  margin-bottom: 2rem
.list-item:
  border-radius: 5px
  border: "thin solid azure"
  margin: 0.5rem auto
  padding: 0.5rem 2rem
.nav-box:
  background-color: "#111"
  position: sticky
  top: 0
  border-bottom: "thin solid azure"
.nav:
  display: flex
  justify-content: space-around
  margin: 0 auto
  padding: 0.5rem
  width: 100%
  max-width: 300px
.nav>a:
  display: block
.inline:
  display: inline
.rain:
  user-select: none
  pointer-events: none
  z-index: 1
  position: fixed
  width: 120%
  height: 100%
  display: flex
  justify-content: space-around
  transform: rotate(10deg)
.drop:
  width: 1px
  height: 10vh
  background: '#fff'
  animation-name: falldown
  animation-iteration-count: infinite
  margin-top: '-20vh'
  animation-timing-function: linear
` + shuffle([...range(rainCount)]).map((num: number, idx) => `
.drop:nth-child(${idx}):
  animation-delay: ${num * 50}ms
  animation-duration: ${getRandomInt(300) + 350}ms
  opacity: 0.${getRandomInt(3) + 2}`).join("");

const styles = css(parseYaml(cssYml) as CssObject) +
  `@keyframes falldown{to{margin-top:120vh}}`;

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
  h("style", styles),
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
