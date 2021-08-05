import { parseYaml, range, shuffle } from "./deps.ts";
import { CssObject } from "./types.ts";

export function objectToCss(cssObject: CssObject) {
  return Object.entries(cssObject).map(([selector, attributes]) =>
    selector + "{" +
    Object.entries(attributes).map(([k, v]) => `${k}:${v}`).join(";") +
    "}"
  ).join("");
}

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function getDenoteCss(rainCount: number) {
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
.main-image:
  border-radius: 50%
  width: 260px
  height: 260px
  object-fit: cover
.description:
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
` + shuffle([...range(rainCount)]).map((num, idx) => `
.drop:nth-child(${idx}):
  animation-delay: ${num * 50}ms
  animation-duration: ${getRandomInt(300) + 350}ms
  opacity: 0.${getRandomInt(3) + 2}`).join("");

  return objectToCss(parseYaml(cssYml) as CssObject) +
    `@keyframes falldown{to{margin-top:120vh}}`;
}
