import { serve as localhost } from "./../deps.ts";
import { renderHtml } from "./../mod.ts";
import { extname } from "https://deno.land/std@0.103.0/path/mod.ts";

const usage = `denote serve <source>

  Runs local server without creating any files.

Example:
  denote serve ./denote.yml

Options:
  -p, --port <port:number>  Specifies the port to local server. Default is 8080.
  -w, --watch               Restarts the local server when the source file is updated.
  -h, --help                Shows the help message.
`.trim();

function error(str: string): void {
  console.error("\nError: " + str);
}
export async function serve({
  help,
  port,
  source,
  watch,
}: { help: string; port: string; watch: boolean; source: string | number }) {
  console.log({
    source,
    help,
    port,
    watch,
  });

  if (help) {
    console.log(usage);
    return 0;
  }

  if (!source) {
    console.log(usage);
    error("source file is required");
    return 1;
  }
  if (
    typeof source !== "string" ||
    ![".yaml", ".yml", ".json"].includes(extname(source))
  ) {
    console.log(usage);
    error("invalid source file is passed");
    return 1;
  }
  if (!/^[1-9]\d*$/.test(port)) {
    console.log(usage);
    error("invalid port number is detected");
    return 1;
  }

  if (watch) {
    await runServerWithWatching(source, Number(port));
  } else {
    await runServer(source, Number(port));
  }
  return 0;
}

let html = "";
async function runServer(source: string, port: number) {
  html = renderHtml(source);
  const server = localhost({ port });
  console.log(
    `HTTP webserver running. Access it at: http://localhost:${port}/`,
  );
  for await (const request of server) {
    const headers = new Headers({ "content-type": "text/html" });
    request.respond({ status: 200, body: html, headers });
  }
}

// [Build a live reloader and explore Deno! 🦕 - DEV Community](https://dev.to/otanriverdi/let-s-explore-deno-by-building-a-live-reloader-j47)
// https://github.com/denoland/deployctl/blob/main/src/subcommands/run.ts
export async function runServerWithWatching(
  source: string,
  port: number,
  { interval } = { interval: 300 },
) {
  runServer(source, port);

  const watcher = Deno.watchFs(source);
  let debouncer: number | null = null;
  console.log("Watching for changes...");

  for await (const event of watcher) {
    if (event.kind !== "modify") {
      continue;
    }
    if (typeof debouncer == "number") clearTimeout(debouncer);
    debouncer = setTimeout(() => {
      console.log("File change detected");
      console.log("Rebuilding...");
      html = renderHtml(source);
      console.log("Local server is updated");
      console.log("Watching for changes...");
    }, interval);
  }
}
