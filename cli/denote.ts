import { parseCli } from "./../deps.ts";
import { init } from "./init.ts";
import { serve } from "./serve.ts";
import { register } from "./register.ts";
import { unregister } from "./unregister.ts";

const NAME = "denote";
const VERSION = "0.1.0";
const versionInfo = `${NAME} ${VERSION}`;

const helpMsg = `
${versionInfo}

  A minimal profile page generator for Deno Deploy.

Subcommands:
  i, init  <filename>     Generates sample config file with given name.
  s, serve <filename>     Runs local server with given config file.
  r, register <filename>  Publish the page on denote.deno.dev with given config file.
  u, unregister           Remove the page from denote.deno.dev.

Options:
  -v, --version           Shows the version number.
  -h, --help              Shows the help message.
  -d, --debug             Reveals the given arguments.
`.trim();

export async function main(cliArgs: string[]) {
  const {
    "_": args,
    debug,
    force,
    help,
    name,
    port,
    token,
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
        "name",
        "output",
        "port",
        "token",
      ],
      alias: {
        d: "debug",
        f: "force",
        h: "help",
        n: "name",
        p: "port",
        t: "token",
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

  const [subcommand, filename] = args.map((arg) => `${arg}`);

  if (subcommand === "init" || subcommand === "i") {
    return await init({
      debug,
      force,
      help,
      filename,
    });
  }
  if (subcommand === "serve" || subcommand === "s") {
    return await serve({
      debug,
      help,
      port,
      filename,
      watch,
    });
  }
  if (subcommand === "register" || subcommand === "r") {
    return await register({
      debug,
      help,
      name,
      token,
      filename,
    });
  }
  if (subcommand === "unregister" || subcommand === "u") {
    return await unregister({
      debug,
      help,
      name,
      token,
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
