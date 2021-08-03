import { serve as localhost } from "./deps.ts";
import { parse } from "https://deno.land/std@0.103.0/flags/mod.ts";
import { createDeployServer } from "./create_deploy_server.ts";
import { renderHtml } from "./mod.ts";

const NAME = "denote";
const VERSION = "0.0.1";

const usage = `
${NAME}

  A minimal profile page generator for Deno Deploy.

Usage: ${NAME} [-h][-v][-i <filename>][-o <filename>][-f][-s][-p <port>]

  Read 'denote.yml' and build 'denote_server.js' by default.
  Upload 'denote_server.js' to Deno Deploy
  or run 'deployctl run ./denote_server.js' to show the output.

Options:
  -i, --input <filename>  Specifies the input config filename. Default is './denote.yml'.
  -o, --output <filename> Specifies the output filename. Default is './denote_server.js'.
  -f, --force             Overwrites the output file without confirmation.

  -s, --serve             Runs local server without creating any files.
  -p, --port <port>       Specifies the port to local server. Use with -s option. Default is 8080.

  -v, --version           Shows the version number.
  -h, --help              Shows the help message.
`.trim();

export async function main(cliArgs: string[]) {
  const {
    version,
    help,
    force,
    serve,
    input,
    output,
    port: portArg,
  } = parse(cliArgs, {
    boolean: ["help", "version", "force", "serve"],
    string: ["input", "output", "port"],
    alias: {
      h: "help",
      v: "version",
      f: "force",
      s: "serve",
      i: "input",
      o: "output",
      p: "port",
    },
    default: {
      input: "./denote.yml",
      output: "./denote_server.js",
      port: "8080",
    },
  });
  const port = Number(portArg);
  console.log({
    version,
    help,
    force,
    serve,
    input,
    output,
    port,
  });

  if (help) {
    console.log(usage);
    return 0;
  }

  if (version) {
    console.log(`${NAME}@${VERSION}`);
    return 0;
  }

  const html = renderHtml(input);

  if (serve) {
    const server = localhost({ port });
    console.log(
      `HTTP webserver running. Access it at: http://localhost:${port}/`,
    );
    for await (const request of server) {
      const headers = new Headers({ "content-type": "text/html" });
      request.respond({ status: 200, body: html, headers });
    }
    return 0;
  }

  try {
    const stat = await Deno.lstat(output);
    if (stat.isDirectory) {
      console.error(`Error: the output path ${output} is directory`);
      return 1;
    }
    if (
      force || confirm(
        `The output path ${output} already exists. Are you sure to overwrite this file?`,
      )
    ) {
      Deno.writeTextFileSync(output, createDeployServer(html));
      console.log(`Server file is successfully created: ${output}`);
      return 0;
    } else {
      console.warn("Aborting");
      return 1;
    }
  } catch (e) {
    if (e.name === "NotFound") {
      Deno.writeTextFileSync(output, createDeployServer(html));
      console.log(`Server file is successfully created: ${output}`);
      return 0;
    }
    throw e;
  }
}

if (import.meta.main) {
  try {
    Deno.exit(await main(Deno.args));
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
}
