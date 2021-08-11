import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "https://cdn.skypack.dev/@aws-sdk/client-dynamodb@3.22.0?dts#=";

const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
if (!accessKeyId || !secretAccessKey) {
  throw new Error("missing credentials");
}
const client = new DynamoDBClient({
  region: "us-east-1",
  credentials: { accessKeyId, secretAccessKey },
});

const tableName = "Denote";

export interface DenoteSchema {
  name: string;
  hashedToken: string;
  config: string;
}

export async function putItem(data: DenoteSchema) {
  try {
    const response = await client.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          // Here 'S' implies that the value is of type string
          name: { S: data.name },
          hashedToken: { S: data.hashedToken },
          config: { S: data.config },
        },
      }),
    );

    console.log(response);
    const { $metadata: { httpStatusCode } } = response;

    return httpStatusCode === 200;
  } catch (error) {
    console.log(error);
  }
  return false;
}

export async function getItem(name: string) {
  try {
    const response = await client.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          name: { S: name },
        },
      }),
    );

    console.log(response);
    const { Item } = response;

    if (Item) {
      return {
        name: Item.name.S,
        hashedToken: Item.hashedToken.S,
        config: Item.config.S,
      };
    }
  } catch (error) {
    console.log(error);
  }
  return null;
}

export async function deleteItem(name: string) {
  try {
    const response = await client.send(
      new DeleteItemCommand({
        TableName: tableName,
        Key: {
          name: { S: name },
        },
      }),
    );

    console.log(response);
    const { $metadata: { httpStatusCode } } = response;

    return httpStatusCode === 200;
  } catch (error) {
    console.log(error);
  }
  return false;
}
