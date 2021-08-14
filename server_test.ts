import { assert, assertEquals } from "./deps.ts";
Deno.env.set("AWS_ACCESS_KEY_ID", "dummy-id");
Deno.env.set("AWS_SECRET_ACCESS_KEY", "dummy-key");
import {
  decodeConfig,
  encodeConfig,
  validateConfig,
  validateName,
  validateToken,
} from "./server.ts";

Deno.test("encode and decode", () => {
  const config = {
    description: "<description>",
    twitter: "twitter",
    list: {
      id1: {
        icon: "feather/github",
        items: [{ icon: "feather/github" }],
      },
    },
  };
  const configStr = JSON.stringify(config);
  assertEquals(decodeConfig(encodeConfig(configStr)), config);
});

Deno.test("validateConfig", () => {
  assert(
    validateConfig(
      `{"list":{"id1":{"icon":"devicons/github","items":[{"text":"github","link":"https://github.com/"}]}}}`,
    ),
  );
  assert(!validateConfig("{}"));
  assert(!validateConfig(""));
});

Deno.test("validateName", () => {
  assert(validateName("this-is-valid_123"));
  assert(!validateName("invalid name"));
  assert(!validateName(""));
  assert(!validateName("o"));
  assert(!validateName("_no"));
  assert(!validateName("名前"));
});

Deno.test("validateToken", () => {
  assert(validateToken("this-is-valid_123"));
  assert(!validateToken("invalid token"));
  assert(!validateToken(""));
  assert(!validateToken("short"));
  assert(!validateToken("秘密"));
});
