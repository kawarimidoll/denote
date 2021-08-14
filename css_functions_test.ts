import { assert, assertEquals } from "./deps.ts";
import { getRandomInt, objectToCss } from "./css_functions.ts";
import { CssObject } from "./types.ts";

Deno.test("objectToCss", () => {
  const cssObject: CssObject = {
    "#main": {
      width: "100%",
      padding: "1rem 0.5rem",
    },
    ".nav": {
      display: "flex",
      "justify-content": "space-around",
      margin: "0 auto",
      padding: "0.5rem",
      width: "100%",
    },
    ".nav>a": {
      display: "block",
    },
  };
  const css =
    "#main{width:100%;padding:1rem 0.5rem}.nav{display:flex;justify-content:space-around;margin:0 auto;padding:0.5rem;width:100%}.nav>a{display:block}";

  assertEquals(objectToCss(cssObject), css);
});

Deno.test("getRandomInt", () => {
  // test 10 times
  for (let i = 0; i < 10; i++) {
    const num = getRandomInt(10);
    assert(0 <= num && num <= 9);
  }
});
