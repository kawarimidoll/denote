import {
  json,
  PathParams,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.3.5/mod.ts";
// import { createHash } from "https://deno.land/std@0.103.0/hash/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.103.0/encoding/yaml.ts";
import { renderHtml } from "./render_html.ts";
import { ConfigObject } from "./types.ts";
import { getDB, putDB } from "./textdb.ts";

function applyHash(token: string) {
  return `###${token}###`;
  // return createHash("sha256").update(`${token}`).toString();
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

    const db = await getDB();
    const name = `${body.name}`;
    const hashedToken = applyHash(`${body.token}`);
    const configPath = `${body.config_path}`;

    if (!db) {
      return json({ message: "failed to access database" }, { status: 500 });
    }

    if (request.method === "GET") {
      console.log(db);
      return json({
        message:
          "please access with POST to create new data, PUT to update the data or DELETE to delete the data.",
      });
    }

    if (request.method === "POST") {
      if (db[name]) {
        return json({
          message:
            `the name '${name}' is already exist. if you want to update the data, please use PUT request.`,
        }, { status: 400 });
      }

      db[name] = { hashedToken, configPath };

      if (putDB(db)) {
        return json({
          message: "data saved! do not forget your token",
          ...body,
        });
      }
    }

    if (request.method === "PUT") {
      if (!db[name]) {
        return json({
          message:
            `the name '${name}' is not exist. if you want to add a new data, please use POST request.`,
        }, { status: 400 });
      }

      if (db[name].hashedToken !== hashedToken) {
        return json({
          message: "invalid token.",
        }, { status: 400 });
      }

      db[name].configPath = configPath;

      if (putDB(db)) {
        return json({
          message: "the data is updated successfully.",
          config_path: configPath,
        });
      }
    }

    if (request.method === "DELETE") {
      if (!db[name]) {
        return json({
          message: `the name '${name}' is not exist.`,
        }, { status: 400 });
      }

      if (db[name].hashedToken !== hashedToken) {
        return json({
          message: "invalid token.",
        }, { status: 400 });
      }

      delete db[name];

      if (putDB(db)) {
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

    const db = await getDB();

    if (!db) {
      return json({ message: "failed to access database" }, { status: 500 });
    }

    const data = db[name];

    if (!data || !data.configPath) {
      return json({ message: "not found" }, { status: 404 });
    }

    console.log({ configPath: data.configPath });
    const response = await fetch(data.configPath);

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
