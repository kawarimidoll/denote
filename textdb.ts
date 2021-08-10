const TEXTDB = `https://textdb.dev/api/data/${Deno.env.get("TEXTDB_ENDPOINT")}`;

interface DenoteSchema {
  [name: string]: {
    hashedToken: string;
    configPath: string;
  };
}

// do not add charaset=utf-8 in headers
export async function getDB(): Promise<DenoteSchema | null> {
  try {
    const response = await fetch(
      TEXTDB,
      { headers: { "content-type": "application/json" } },
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn(error);
  }

  return null;
}

export async function putDB(data: DenoteSchema) {
  try {
    const response = await fetch(
      TEXTDB,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      },
    );

    return response.ok;
  } catch (error) {
    console.warn(error);
  }

  return false;
}

export async function clearDB() {
  return await putDB({});
}
