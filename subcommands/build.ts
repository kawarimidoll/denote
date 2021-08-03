import { createDeployServer } from "./../create_deploy_server.ts";
import { renderHtml } from "./../mod.ts";
import { basename, extname } from "https://deno.land/std@0.103.0/path/mod.ts";

const usage = `denote build <source>

  Builds the server file for Deno Deploy.

Example:
  denote build ./denote.yml

Options:
  -o, --output <filename> Specifies the output filename. Default is './denote_server.js'.
  -f, --force             Overwrites the output file without confirmation.
  -h, --help              Shows the help message.
`.trim();

export async function build({
  help,
  force,
  output = "./denote_server.js",
  source,
}: { help: string; force: boolean; output: string; source: string | number }) {
  console.log({
    source,
    help,
    force,
    output,
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

  const html = renderHtml(`${source}`);

  // const ext = extname(source);
  // const outPath = source.replace(ext, "_server.js");
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
    console.error(e);
    return 1;
  }
}
