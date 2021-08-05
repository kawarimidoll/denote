import { parse } from "https://deno.land/std@0.103.0/flags/mod.ts";
import { build } from "./build.ts";
import { serve } from "./serve.ts";

const NAME = "denote";
const VERSION = "0.0.1";
const versionInfo = `${NAME} ${VERSION}`;

const helpMsg = `${versionInfo}

  A minimal profile page generator for Deno Deploy.

Example:
  ${NAME} build ./denote.yml

  The source should be '.yml', '.yaml' or '.json' file.

Subcommands:
  b, build <source>  Builds the server file for Deno Deploy.
  s, serve <source>  Runs local server without creating any files.

Options:
  -v, --version      Shows the version number.
  -h, --help         Shows the help message.
`.trim();

export async function main(cliArgs: string[]) {
  const { help, version, force, output, port, watch, debug, "_": args } = parse(
    cliArgs,
    {
      boolean: ["help", "version", "force", "watch", "debug"],
      string: ["output", "port"],
      alias: {
        h: "help",
        v: "version",
        d: "debug",
        f: "force",
        o: "output",
        w: "watch",
        p: "port",
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

  if (subcommand === "build" || subcommand === "b") {
    return await build({ help, force, output, source, debug });
  }
  if (subcommand === "serve" || subcommand === "s") {
    return await serve({ help, port, source, watch, debug });
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
