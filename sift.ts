import {
  createHash,
  decode,
  encode,
  gunzip,
  gzip,
  json,
  sift,
  validateRequest,
} from "./deps.ts";
import { renderHtml } from "./render_html.ts";
import { ConfigObject } from "./types.ts";
import { deleteItem, getItem, putItem } from "./dynamodb.ts";

function applyHash(token: string) {
  return createHash("sha256").update(`${token}`).toString();
}

const NAME_REGEX = /[a-z][a-z0-9_-]{2,64}/;
const TOKEN_REGEX = /[!-~]{8,128}/;
function validateName(name: string) {
  return NAME_REGEX.test(name);
}
function validateToken(token: string) {
  return TOKEN_REGEX.test(token);
}
function validateConfig(config: string) {
  try {
    const { list } = JSON.parse(config);
    return !!(list);
  } catch (_) {
    return false;
  }
}

sift({
  "/": async (request) => {
    const { error, body } = await validateRequest(request, {
      GET: {},
      POST: {
        body: ["name", "token", "config"],
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
          "please access with POST to create new data or DELETE to delete the data.",
      });
    }

    const name = `${body.name}`;
    const token = `${body.token}`;
    const rawConfig = `${body.config}`;

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
    if (!validateConfig(rawConfig)) {
      return json({
        message:
          "invalid config. this must be a valid JSON which contains 'list' key.",
      });
    }

    const hashedToken = applyHash(name + token);
    const config = JSON.stringify(JSON.parse(rawConfig));

    if (request.method === "POST") {
      const item = await getItem(name);
      if (item && item.hashedToken !== hashedToken) {
        return json({
          message:
            `the token is incorrect. use correct token to update the record or use other name to create new one.`,
        }, { status: 401 });
      }

      const result = await putItem({ name, hashedToken, config });
      if (result) {
        return json({
          message: "data is saved successfully. do not forget your token",
        });
      }
    }

    if (request.method === "DELETE") {
      const item = await getItem(name);
      if (!item) {
        return json({
          message: `the name '${name}' is not exist.`,
        }, { status: 404 });
      }

      if (item.hashedToken !== hashedToken) {
        return json({
          message:
            `the name '${name}' is already exist but the token is incorrect. use correct token to delete the record.`,
        }, { status: 401 });
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

    if (!(item?.config)) {
      return json({ message: "not found" }, { status: 404 });
    }

    try {
      const rawConfig = JSON.parse(item.config) as ConfigObject;
      console.log({ rawConfig });
      const html = renderHtml(rawConfig, true);
      return new Response(html, { headers: { "content-type": "text/html" } });
    } catch (error) {
      console.warn(error);
    }
    return json({ message: "something went wrong" }, { status: 500 });
  },
  404: () => json({ message: "not found" }, { status: 404 }),
});
