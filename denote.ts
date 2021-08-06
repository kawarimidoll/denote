import { parseCli } from "./deps.ts";
import { build } from "./build.ts";
import { init } from "./init.ts";
import { serve } from "./serve.ts";

const NAME = "denote";
const VERSION = "0.0.1";
const versionInfo = `${NAME} ${VERSION}`;

const helpMsg = `
${versionInfo}

  A minimal profile page generator for Deno Deploy.

Example:
  denote build ./denote.yml

  The source should be '.yml' file.

Subcommands:
  i, init <name>     Generates sample 'denote.yml' file with given name.
  b, build <source>  Builds the server file for Deno Deploy.
  s, serve <source>  Runs local server without creating any files.

Options:
  -v, --version      Shows the version number.
  -h, --help         Shows the help message.
`.trim();

export async function main(cliArgs: string[]) {
  const {
    "_": args,
    debug,
    force,
    help,
    output,
    port,
    version,
    watch,
  } = parseCli(
    cliArgs,
    {
      boolean: [
        "debug",
        "force",
        "help",
        "version",
        "watch",
      ],
      string: [
        "output",
        "port",
      ],
      alias: {
        d: "debug",
        f: "force",
        h: "help",
        o: "output",
        p: "port",
        v: "version",
        w: "watch",
      },
      default: {
        port: "8080",
      },
    },
  );

  if (version) {
    console.log(versionInfo);
    return 0;
  }

  const [subcommand, source] = args;

  if (subcommand === "init" || subcommand === "i") {
    return await init({
      debug,
      force,
      help,
      output,
      name: source,
    });
  }
  if (subcommand === "build" || subcommand === "b") {
    return await build({
      debug,
      force,
      help,
      output,
      source,
    });
  }
  if (subcommand === "serve" || subcommand === "s") {
    return await serve({
      debug,
      help,
      port,
      source,
      watch,
    });
  }
  if (help) {
    console.log(helpMsg);
    return 0;
  }
  console.log(helpMsg);
  return 1;
}

if (import.meta.main) {
  try {
    Deno.exit(await main(Deno.args));
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
}
