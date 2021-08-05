import { basename, parseCli, stringifyYaml } from "./deps.ts";
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
  -i, --init         Generates minimal 'denote.yml' file.
  -v, --version      Shows the version number.
  -h, --help         Shows the help message.
`.trim();

export async function main(cliArgs: string[]) {
  const {
    "_": args,
    debug,
    force,
    help,
    init,
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
        "init",
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
        i: "init",
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

  if (init) {
    const name = basename(Deno.cwd());
    const config = stringifyYaml({
      name,
      projectName: name,
      // bio,
      // avatar: logoURL,
      // favicon: logoURL,
    });
    console.log(config);
    const outPath = "./denote.yml";
    try {
      await Deno.lstat(outPath);
      if (
        force || confirm(
          `The output path ${outPath} already exists. Are you sure to overwrite this file?`,
        )
      ) {
        Deno.writeTextFileSync(outPath, config);
        console.log(`Denote config file is successfully created: ${outPath}`);
        return 0;
      } else {
        console.warn("Aborting");
        return 1;
      }
    } catch (e) {
      if (e.name === "NotFound") {
        Deno.writeTextFileSync(outPath, config);
        console.log(`Denote config file is successfully created: ${outPath}`);
        return 0;
      }
      console.error(e);
      return 1;
    }
  }

  const [subcommand, source] = args;

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
