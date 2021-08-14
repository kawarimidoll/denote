import { AMP, assertEquals, assertThrows, GT, LT, QUOT } from "./deps.ts";
import { DENOTE_LOGO, icongram, loadConfig, sanitize } from "./render_html.ts";
import { ConfigObject } from "./types.ts";

Deno.test("sanitize", () => {
  assertEquals(sanitize(""), "");
  assertEquals(sanitize("normal text"), "normal text");
  assertEquals(sanitize("<chevron>"), LT + "chevron" + GT);
  assertEquals(
    sanitize(`and & "quotes"`),
    "and " + AMP + " " + QUOT + "quotes" + QUOT,
  );
});

Deno.test("loadConfig", () => {
  const config: Partial<ConfigObject> = {
    description: "<description>",
    twitter: "twitter",
    list: {
      id1: {
        icon: "feather/github",
        items: [
          {
            icon: "feather/github",
            link: "http://github.com",
          },
        ],
      },
      id2: {
        icon: "devicons/gitlab",
        items: [
          {
            text: "gitlab",
          },
        ],
      },
    },
  };

  const processed: ConfigObject = {
    name: "Your name will be here",
    disable: [],
    description: "&lt;description&gt;",
    image: "",
    favicon: DENOTE_LOGO,
    twitter: "@twitter",
    list: {
      id1: {
        icon: "feather/github",
        items: [
          {
            icon: "feather/github",
            text: "",
            link: "http://github.com",
          },
        ],
      },
      id2: {
        icon: "devicons/gitlab",
        items: [
          {
            icon: undefined,
            text: "gitlab",
            link: "",
          },
        ],
      },
    },
  };
  assertEquals(loadConfig(config), processed);

  assertThrows(() => {
    loadConfig({
      name: "",
      disable: [],
      twitter: "",
      description: "",
      image: "",
      favicon: "",
      list: {},
    });
  });
});

Deno.test("icongram", () => {
  assertEquals(
    icongram("clarity/github"),
    `<img src="https://icongr.am/clarity/github.svg?size=20&color=f0ffff" alt="clarity/github">`,
  );

  assertEquals(
    icongram("jam/flower", 30),
    `<img src="https://icongr.am/jam/flower.svg?size=30&color=f0ffff" alt="jam/flower">`,
  );

  assertEquals(
    icongram("feather/external-link", 12, { class: "ex-link" }),
    `<img src="https://icongr.am/feather/external-link.svg?size=12&color=f0ffff" alt="feather/external-link" class="ex-link">`,
  );

  assertThrows(() => {
    icongram("foo");
  });
});
