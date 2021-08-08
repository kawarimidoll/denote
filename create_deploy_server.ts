import { createHash, encode, gzip } from "./deps.ts";

// Awesome prior art: https://deno.land/x/deploy_dir

/**
* Reads the contents and creates the source code for Deno Deploy,
*/
export function createDeployServer(
  contents: string,
  opts: { cache?: string } = {},
): string {
  const base64 = encode(
    gzip(new TextEncoder().encode(contents), { timestamp: 0 }),
  );
  const hash = createHash("md5");
  hash.update(base64);
  const etag = hash.toString();
  const cacheControl = opts.cache || "private";

  return `import { decode } from "https://deno.land/std@0.103.0/encoding/base64.ts";
import { gunzip } from "https://raw.githubusercontent.com/kt3k/compress/bbe0a818d2acd399350b30036ff8772354b1c2df/gzip/gzip.ts";
const pageData = [decode("${base64}"), '"${etag}"', "${cacheControl}"];
addEventListener("fetch", (e) => {
  const { pathname, origin } = new URL(e.request.url);
  if (pathname !== "/") {
    e.respondWith(Response.redirect(origin));
    return;
  }
  const [bytes, etag, cacheControl] = pageData;
  if (e.request.headers.get("if-none-match") === etag) {
    e.respondWith(
      new Response(null, { status: 304, statusText: "Not Modified" })
    );
    return;
  }
  const headers = {
    etag,
    "cache-control": cacheControl,
    "content-type": "text/html",
  };
  if (
    e.request.headers
      .get("accept-encoding")
      ?.split(/[,;]s*/)
      .includes("gzip")
  ) {
    e.respondWith(
      new Response(bytes, {
        headers: { ...headers, "content-encoding": "gzip" },
      })
    );
  } else {
    e.respondWith(new Response(gunzip(bytes), { headers }));
  }
  return;
});`.replace(/\s*\n\s*/mg, "");
}
