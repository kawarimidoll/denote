import {
  json,
  PathParams,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.3.5/mod.ts";
import { createHash } from "https://deno.land/std@0.103.0/hash/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.103.0/encoding/yaml.ts";
import { renderHtml } from "./render_html.ts";
import { ConfigObject } from "./types.ts";
import { deleteItem, getItem, putItem, updateConfigPath } from "./dynamodb.ts";

function applyHash(token: string) {
  return createHash("sha256").update(`${token}`).toString();
}

const NAME_REGEX = /[a-z][a-z0-9_-]{1,64}/;
const TOKEN_REGEX = /[!-~]{8,128}/;
function validateName(name: string) {
  return NAME_REGEX.test(name);
}
function validateToken(token: string) {
  return TOKEN_REGEX.test(token);
}
function validateConfigPath(path: string) {
  try {
    // simple URL validation
    new URL(path);
    return true;
  } catch (_) {
    return false;
  }
}

serve({
  "/": async (request) => {
    const { error, body } = await validateRequest(request, {
      GET: {},
      POST: {
        body: ["name", "token", "config_path"],
      },
      PUT: {
        body: ["name", "token", "config_path"],
      },
      DELETE: {
        body: ["name", "token"],
      },
    });
    if (error) {
      return json({ error: error.message }, { status: error.status });
    }
    if (body == null) {
      return json({ message: "something went wrong" }, { status: 500 });
    }

    console.log(JSON.stringify(body));

    if (request.method === "GET") {
      return json({
        message:
          "please access with POST to create new data, PUT to update the data or DELETE to delete the data.",
      });
    }

    const name = `${body.name}`;
    const token = `${body.token}`;
    const configPath = `${body.config_path}`;

    if (!validateName(name)) {
      return json({
        message: `invalid name. this must match with ${NAME_REGEX}`,
      });
    }
    if (!validateToken(token)) {
      return json({
        message: `invalid token. this must match with ${TOKEN_REGEX}`,
      });
    }
    if (!validateConfigPath(configPath)) {
      return json({
        message: "invalid config_path. this must be a valid URL.",
      });
    }
    const hashedToken = applyHash(token);

    if (request.method === "POST") {
      const item = await getItem(name);
      if (item) {
        return json({
          message:
            `the name '${name}' is already exist. if you want to update the data, please use PUT request.`,
        }, { status: 400 });
      }

      const result = await putItem({ name, hashedToken, configPath });
      if (result) {
        return json({
          message: "data saved! do not forget your token",
          ...body,
        });
      }
    }

    if (request.method === "PUT") {
      const item = await getItem(name);
      if (!item) {
        return json({
          message:
            `the name '${name}' is not exist. if you want to add a new data, please use POST request.`,
        }, { status: 400 });
      }

      if (item.hashedToken !== hashedToken) {
        return json({
          message: "invalid token.",
        }, { status: 400 });
      }

      const result = await updateConfigPath(name, configPath);
      if (result) {
        return json({
          message: "the data is updated successfully.",
          config_path: configPath,
        });
      }
    }

    if (request.method === "DELETE") {
      const item = await getItem(name);
      if (!item) {
        return json({
          message: `the name '${name}' is not exist.`,
        }, { status: 400 });
      }

      if (item.hashedToken !== hashedToken) {
        return json({
          message: "invalid token.",
        }, { status: 400 });
      }

      const result = await deleteItem(name);
      if (result) {
        return json({
          message: `the data of the name '${name}' is deleted successfully`,
        });
      }
    }
    return json({ message: "something went wrong" }, { status: 500 });
  },
  "/:slug": async (_: Request, params: PathParams) => {
    const name = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    console.log(name);

    const item = await getItem(name);

    if (!(item?.configPath)) {
      return json({ message: "not found" }, { status: 404 });
    }

    console.log({ configPath: item.configPath });
    const response = await fetch(item.configPath);

    if (response.ok) {
      const source = await response.text();
      if (source) {
        const rawConfig = parseYaml(source) as ConfigObject;
        console.log({ rawConfig });
        const html = renderHtml(rawConfig, true);
        return new Response(html, { headers: { "content-type": "text/html" } });
      }
    }
    return json({ message: "something went wrong" }, { status: 500 });
  },
  404: () => json({ message: "not found" }, { status: 404 }),
});
