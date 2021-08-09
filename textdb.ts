import {
  json,
  PathParams,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.3.5/mod.ts";

const TEXTDB = `https://textdb.dev/api/data/${Deno.env.get("TEXTDB_ENDPOINT")}`;

interface DenoteSchema {
  [name: string]: {
    hashedToken: string;
    configPath: string;
  };
}

// do not add charaset=utf-8 in headers
async function getDB(): Promise<DenoteSchema | null> {
  try {
    const response = await fetch(
      TEXTDB,
      { headers: { "content-type": "application/json" } },
    );

    if (response.ok) {
      const json = await response.json();
      console.log(json);
      return json;
    }
  } catch (error) {
    console.warn(error);
  }

  return null;
}

async function putDB(data: DenoteSchema) {
  try {
    const response = await fetch(
      TEXTDB,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      },
    );

    return response.ok;
  } catch (error) {
    console.warn(error);
  }

  return false;
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
    const hashedToken = `###${body.token}###`;
    const configPath = `${body.config_path}`;

    if (!db) {
      return json({ message: "failed to access database" }, { status: 500 });
    }

    if (request.method === "GET") {
      return json({ message: "current db", db });
    }

    if (request.method === "POST") {
      if (db[name]) {
        return json({
          message:
            "the name is already exist. if you update the data, please use PUT request.",
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
            "the name is not exist. if you add the data, please use POST request.",
        }, { status: 400 });
      }

      db[name] = { hashedToken, configPath };

      if (putDB(db)) {
        return json({
          message: "data updated!",
          config_path: configPath,
        });
      }
    }

    if (request.method === "DELETE") {
      if (!db[name]) {
        return json({
          message: "the name is not exist.",
        }, { status: 400 });
      }

      delete db[name];

      if (putDB(db)) {
        return json({
          message: "data deleted!",
        });
      }
    }
    return json({ message: "something went wrong" }, { status: 500 });
  },
  "/:slug": async (_: Request, params: PathParams) => {
    const name = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    console.log(name);

    const db = await getDB();

    if (db) {
      const data = db[name];

      if (data) {
        return json({ data });
      }
      return json({ message: "not found" }, { status: 404 });
    }

    return json({ message: "couldn't get db" }, { status: 500 });
  },
  404: () => new Response("not found"),
});
