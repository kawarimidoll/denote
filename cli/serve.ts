import { debounce, extname, parseYaml } from "./../deps.ts";
import { renderHtml } from "./../render_html.ts";
import { ConfigObject } from "./../types.ts";

const usage = `
denote serve <filename>

  Runs local server without creating any files.

Example:
  denote serve ./denote.yml

  The input should be YAML or JSON file.

Options:
  -p, --port <port:number>  Specifies the port to local server. Default is 8080.
  -w, --watch               Restarts the local server when the source file is updated.
  -h, --help                Shows the help message.
`.trim();

function error(str: string): void {
  console.error("\nError: " + str);
}

export async function serve({
  debug,
  help,
  port,
  filename,
  watch,
}: {
  debug: boolean;
  help: string;
  port: string;
  filename: string;
  watch: boolean;
}) {
  if (debug) {
    console.log({
      debug,
      help,
      port,
      filename,
      watch,
    });
  }

  if (help) {
    console.log(usage);
    return 0;
  }

  if (!filename) {
    console.log(usage);
    error("source file is required");
    return 1;
  }
  if (![".yaml", ".yml", ".json"].includes(extname(filename))) {
    console.log(usage);
    error("invalid file is passed as an argument");
    return 1;
  }
  if (!/^[1-9]\d*$/.test(port)) {
    console.log(usage);
    error("invalid port number is detected");
    return 1;
  }

  if (watch) {
    await runServerWithWatching(filename, Number(port), { debug });
  } else {
    await runServer(filename, Number(port), { debug });
  }
  return 0;
}

let html = "";
async function runServer(
  source: string,
  port: number,
  { debug = false } = {},
) {
  const config = parseYaml(Deno.readTextFileSync(source)) as ConfigObject;
  html = renderHtml(config, debug);
  console.log(
    `HTTP webserver running. Access it at: http://localhost:${port}/`,
  );
  const headers = new Headers({ "content-type": "text/html" });
  for await (const conn of Deno.listen({ port })) {
    (async () => {
      for await (const { respondWith } of Deno.serveHttp(conn)) {
        respondWith(new Response(html, { status: 200, headers }));
      }
    })();
  }
}

// [Build a live reloader and explore Deno! 🦕 - DEV Community](https://dev.to/otanriverdi/let-s-explore-deno-by-building-a-live-reloader-j47)
// https://github.com/denoland/deployctl/blob/main/src/subcommands/run.ts
export async function runServerWithWatching(
  source: string,
  port: number,
  { interval = 300, debug = false } = {},
) {
  runServer(source, port, { debug });

  const watcher = Deno.watchFs(source);

  const rebuild = debounce(() => {
    console.log("File change detected");
    console.log("Rebuilding...");
    const config = parseYaml(Deno.readTextFileSync(source)) as ConfigObject;
    html = renderHtml(config, debug);
    console.log("Local server is updated");
    console.log("Watching for changes...");
  }, interval);

  console.log("Watching for changes...");
  for await (const event of watcher) {
    if (event.kind !== "modify") {
      continue;
    }
    rebuild();
  }
}
