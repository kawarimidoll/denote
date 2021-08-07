import { createDeployServer } from "./../create_deploy_server.ts";
import { renderHtml } from "./../render_html.ts";
import { basename, extname } from "./../deps.ts";

const usage = `
denote build <source>

  Builds the server file for Deno Deploy.

Example:
  denote build ./denote.yml

  The output file is './<source without extension>_server.js' by default.
  For example, when source is './denote.yml', output is './denote_server.js'

Options:
  -o, --output <filename> Specifies the output filename.
                          The output should be '.js' file.
  -f, --force             Overwrites the output file without confirmation.
  -h, --help              Shows the help message.
`.trim();

export async function build({
  debug,
  force,
  help,
  output,
  source,
}: {
  debug: boolean;
  force: boolean;
  help: string;
  output: string;
  source: string | number;
}) {
  if (debug) {
    console.log({
      debug,
      force,
      help,
      output,
      source,
    });
  }

  if (help) {
    console.log(usage);
    return 0;
  }

  if (!source) {
    console.log(usage);
    console.error("source file is required");
    return 1;
  }
  const ext = extname(`${source}`);
  if (
    typeof source !== "string" ||
    ![".yaml", ".yml", ".json"].includes(ext)
  ) {
    console.log(usage);
    console.error("invalid source file is passed");
    return 1;
  }

  const html = renderHtml(source, debug);
  const outPath = output || basename(source).replace(ext, "_server.js");
  if (![".js"].includes(extname(outPath))) {
    console.log(usage);
    console.error("invalid output file is passed");
    return 1;
  }

  try {
    const stat = await Deno.lstat(outPath);
    if (stat.isDirectory) {
      console.error(`Error: the output path ${outPath} is directory`);
      return 1;
    }
    if (
      force || confirm(
        `The output path ${outPath} already exists. Are you sure to overwrite this file?`,
      )
    ) {
      Deno.writeTextFileSync(outPath, createDeployServer(html));
      console.log(`Server file is successfully created: ${outPath}`);
      return 0;
    } else {
      console.warn("Aborting");
      return 1;
    }
  } catch (e) {
    if (e.name === "NotFound") {
      Deno.writeTextFileSync(outPath, createDeployServer(html));
      console.log(`Server file is successfully created: ${outPath}`);
      return 0;
    }
    console.error(e);
    return 1;
  }
}
