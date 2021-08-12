const usage = `
denote unregister

  Remove the page from denote.deno.dev.

Example:
  denote unregister --name your-name --token your-token

  'name' and 'token' options are both required.

  Options:
  -n, --name  [name]   Your name.
  -t, --token [token]  Your token.
  -h, --help           Shows the help message.
  `.trim();

function error(str: string): void {
  console.error("\nError: " + str);
}

export async function unregister({
  debug,
  name,
  help,
  token,
}: {
  debug: boolean;
  name: boolean;
  token: boolean;
  help: string;
}) {
  if (debug) {
    console.log({
      debug,
      name,
      token,
      help,
    });
  }

  if (help) {
    console.log(usage);
    return 0;
  }

  if (!name || !token) {
    console.log(usage);
    error("name and token are both required");
    return 1;
  }

  try {
    const result = await fetch("https://denote.deno.dev", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, token }),
    });

    const json = await result.json();
    console.log(json?.message);

    return 0;
  } catch (e) {
    error(e);
    return 1;
  }
}
