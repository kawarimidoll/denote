import { parse } from "https://deno.land/std@0.103.0/flags/mod.ts";

const NAME = "denote";
const VERSION = "0.0.1";
const versionInfo = `${NAME} ${VERSION}`;

const help = `${versionInfo}

  A minimal profile page generator for Deno Deploy.

Example:
  ${NAME} build ./denote.yml

Subcommands:
  b, build       Builds the server file for Deno Deploy.
  s, serve       Runs local server without creating any files.

Options:
  -v, --version  Shows the version number.
  -h, --help     Shows the help message.
`.trim();

export function main(cliArgs: string[]) {
  const args = parse(cliArgs, {
    boolean: ["help", "version", "force"],
    string: ["port"],
    alias: {
      h: "help",
      v: "version",
      f: "force",
      p: "port",
    },
    default: {
      port: "8080",
    },
  });

  if (args.version) {
    console.log(versionInfo);
    return 0;
  }

  const build = (args: unknown) => {
    console.log("build");
    console.log(args);
    return 0;
  };
  const serve = (args: unknown) => {
    console.log("serve");
    console.log(args);
    return 0;
  };

  const subcommand = args._[0];

  if (subcommand === "build" || subcommand === "b") {
    return build(args);
  }
  if (subcommand === "serve" || subcommand === "s") {
    return serve(args);
  }
  if (args.help) {
    console.log(help);
    return 0;
  }
  console.error(help);
  return 1;
}

if (import.meta.main) {
  try {
    Deno.exit(main(Deno.args));
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
}
