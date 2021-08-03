import { serve as localhost } from "./../deps.ts";
import { renderHtml } from "./../mod.ts";

const usage = `denote serve <source>

  Runs local server without creating any files.

Example:
  denote serve ./denote.yml

Options:
  -p, --port <port:number>  Specifies the port to local server. Default is 8080.
  -h, --help                Shows the help message.
`.trim();

export async function serve({
  help,
  port,
  source,
}: { help: string; port: string; source: string|number }) {
  console.log({
    source,
    help,
    port,
  });

  if (help) {
    console.log(usage);
    return 0;
  }

  if (!source) {
    console.log(usage);
    console.error("source file is required");
    return 1;
  }
  if (!/^[1-9]\d*$/.test(port)) {
    console.log(usage);
    console.error("invalid port number is detected");
    return 1;
  }

  const portNumber = Number(port);

  const html = renderHtml(`${source}`);

  const server = localhost({ port: portNumber });
  console.log(
    `HTTP webserver running. Access it at: http://localhost:${port}/`,
  );
  for await (const request of server) {
    const headers = new Headers({ "content-type": "text/html" });
    request.respond({ status: 200, body: html, headers });
  }
  return 0;
}
