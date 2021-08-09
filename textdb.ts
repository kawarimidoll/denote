import {
  json,
  PathParams,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.3.5/mod.ts";

const TEXTDB = `https://textdb.dev/api/data/${Deno.env.get("TEXTDB_ENDPOINT")}`;

// do not add charaset=utf-8 in headers

serve({
  "/": async (request) => {
    const { error, body } = await validateRequest(request, {
      POST: {
        body: ["name", "token", "yaml_path"],
      },
    });
    if (error) {
      return json({ error: error.message }, { status: error.status });
    }
    if (body == null) {
      return json({ message: "something went wrong" }, { status: 500 });
    }

    // console.log(JSON.stringify(body));
    if (request.method === "POST") {
      const response = await fetch(
        TEXTDB,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        return json({
          message: "data saved!",
          name: body.name,
          yaml_path: body["yaml_path"],
        });
      } else {
        return json({ message: "something went wrong" }, { status: 500 });
      }
    }

    return new Response("hello world");
  },
  "/:slug": async (_: Request, params: PathParams) => {
    const name = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    console.log(name);
    const response = await fetch(
      TEXTDB,
      {
        headers: { "content-type": "application/json" },
      },
    );

    if (response.ok) {
      const db = await response.json();
      const data = JSON.parse(db)[name];

      if (data) {
        return json({ data });
      }
      return json({ message: "not found" }, { status: 404 });
    }

    return json({ message: "couldn't get db" }, { status: 500 });
  },
  404: () => new Response("not found"),
});
