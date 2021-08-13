import { extname, parseYaml } from "./../deps.ts";

const usage = `
denote init <filename>

  Generates sample config file with given name.

Example:
  denote init profile.yml

  The output should be YAML or JSON file.

Options:
  -f, --force             Overwrites the output file without confirmation.
  -h, --help              Shows the help message.
`.trim();

function error(str: string): void {
  console.error("\nError: " + str);
}

export async function init({
  debug,
  force,
  help,
  filename,
}: {
  debug: boolean;
  force: boolean;
  help: string;
  filename: string;
}) {
  if (debug) {
    console.log({
      debug,
      force,
      help,
      filename,
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

  const ext = extname(filename);
  if (![".yml", ".yaml", ".json"].includes(ext)) {
    console.log(usage);
    error("invalid file is passed as an argument");
    return 1;
  }

  let config = "";
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/kawarimidoll/denote/main/example.yml",
    );
    config = await response.text();

    if (ext == ".json") {
      config = JSON.stringify(parseYaml(config), null, 2);
    }

    const stat = await Deno.lstat(filename);
    if (stat.isDirectory) {
      error(`the output path ${filename} is directory`);
      return 1;
    }
    if (
      force || confirm(
        `The output path ${filename} already exists. Are you sure to overwrite this file?`,
      )
    ) {
      Deno.writeTextFileSync(filename, config);
      console.log(`Server file is successfully created: ${filename}`);
      return 0;
    } else {
      console.warn("Aborting");
      return 1;
    }
  } catch (e) {
    if (e.name === "NotFound") {
      Deno.writeTextFileSync(filename, config);
      console.log(`Server file is successfully created: ${filename}`);
      return 0;
    }
    error(e);
    return 1;
  }
}
