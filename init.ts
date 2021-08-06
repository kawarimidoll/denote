import { extname } from "./deps.ts";

const usage = `
denote init <name>

  Generates sample 'denote.yml' file with given name.

Example:
  denote init octcat

  The output file is './denote.yml' by default.

Options:
  -o, --output <filename> Specifies the output filename.
                          The output should be '.yml' file.
  -f, --force             Overwrites the output file without confirmation.
  -h, --help              Shows the help message.
`.trim();

export async function init({
  debug,
  force,
  help,
  output = "./denote.yml",
  name,
}: {
  debug: boolean;
  force: boolean;
  help: string;
  output: string;
  name: string | number;
}) {
  if (debug) {
    console.log({
      debug,
      force,
      help,
      output,
      name,
    });
  }

  if (help) {
    console.log(usage);
    return 0;
  }

  if (!name) {
    console.log(usage);
    console.error("name is required");
    return 1;
  }

  const ext = extname(output);
  if (![".yml"].includes(ext)) {
    console.log(usage);
    console.error("invalid output file is passed");
    return 1;
  }
  const config = `
name: ${name}
#   The name shown on the top of the page.
#   This value is required.
#
# project: ${name}_project
#   The project name of the Deno Deploy(???.deno.dev).
#   This is used in 'og:url'.
#   When this is left blank, 'name' value is used.
#
# title: ${name}'s page
#   The title of the page.
#   This is also used in 'og:title' and 'og:site_name'.
#   When this is left blank, '<name> | denote' is used.
#
# image: https://${name}.com/image.png
#   The URL of the main image of the page.
#   This is also used in 'og:image'.
#
# favicon: https://${name}.com/favicon.png
#   The URL of the favicon of the page.
#   When this is left blank, 'image' value is used.
#
# description: ${name}'s profile
#   The comments shown under the page name.
#   This is also used in 'og:description'.
#   When this is left blank, the tag is just skipped.
#
# twitter: @${name}
#   Your twitter username.
#   This is used in 'twitter:site'.
#   When this is left blank, the tag is just skipped.
#
list:
  id-1:
    icon: fontawesome/font-awesome
    items:
      - icon: jam/info
        text: this is a text with an icon
      - text: this is a just text
      - icon: octicons/octoface
        text: this is a link to GitHub
        link: https://github.com
      - text: this is a link to Twitter
        link: https://twitter.com
  id-2:
    icon: feather/anchor
    items:
      - icon: clarity/block
        text: this is the second block
      - icon: simple/deno
`.trim();

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
      Deno.writeTextFileSync(output, config);
      console.log(`Server file is successfully created: ${output}`);
      return 0;
    } else {
      console.warn("Aborting");
      return 1;
    }
  } catch (e) {
    if (e.name === "NotFound") {
      Deno.writeTextFileSync(output, config);
      console.log(`Server file is successfully created: ${output}`);
      return 0;
    }
    console.error(e);
    return 1;
  }
}
