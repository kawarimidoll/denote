import { extname, parseYaml } from "./../deps.ts";

const usage = `
denote register <filename>

  Publish the page on denote.deno.dev with given config file.

Example:
  denote register profile.yml --name your-name --token your-token

  The input should be YAML or JSON file.
  You can use URL when the config file is published on the web.
  'name' and 'token' options are both required.

Options:
  -n, --name  [name]   Your name. Use as https://denote.deno.dev/[name]
  -t, --token [token]  Your token. It hashed and saved.
  -h, --help           Shows the help message.
`.trim();

function isURL(str: string) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}
async function getText(url: string): Promise<string> {
  const response = await fetch(url);
  if (response.ok) {
    return await response.text();
  }
  return "";
}

function error(str: string): void {
  console.error("\nError: " + str);
}

export async function register({
  debug,
  name,
  help,
  token,
  filename,
}: {
  debug: boolean;
  name: boolean;
  token: boolean;
  help: string;
  filename: string;
}) {
  if (debug) {
    console.log({
      debug,
      name,
      token,
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

  if (!name || !token) {
    console.log(usage);
    error("name and token are both required");
    return 1;
  }
  console.log({ name, token });

  try {
    const contents = isURL(filename)
      ? await getText(filename)
      : await Deno.readTextFile(filename);

    // validate and minify
    const config = JSON.stringify(parseYaml(contents));

    const result = await fetch("https://denote.deno.dev", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, token, config }),
    });

    const json = await result.json();
    console.log(json?.message);

    return 0;
  } catch (e) {
    error(e);
    return 1;
  }
}
