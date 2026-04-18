import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "ap-northeast-1",
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "dummy",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "dummy",
    },
  }),
});

const rawDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

type CommandInput = {
  TableName?: string;
  Key?: unknown;
  IndexName?: string;
};

export const docClient = new Proxy(rawDocClient, {
  get(target, prop, receiver) {
    if (prop === "send") {
      return async (command: { constructor: { name: string }; input: CommandInput }) => {
        const start = Date.now();
        const op = command.constructor.name;
        const table = command.input?.TableName ?? "-";
        try {
          const result = await target.send(command as Parameters<typeof target.send>[0]);
          const ms = Date.now() - start;
          console.log(
            JSON.stringify({
              level: "info",
              scope: "db",
              op,
              table,
              index: command.input?.IndexName,
              ms,
            }),
          );
          return result;
        } catch (err) {
          const ms = Date.now() - start;
          console.error(
            JSON.stringify({
              level: "error",
              scope: "db",
              op,
              table,
              index: command.input?.IndexName,
              ms,
              err: err instanceof Error ? err.message : String(err),
            }),
          );
          throw err;
        }
      };
    }
    return Reflect.get(target, prop, receiver);
  },
}) as typeof rawDocClient;

export const DEFAULT_EVENT_ID = "default";

const prefix = process.env.TABLE_PREFIX ?? "kick-summit";

export const TABLE_NAMES = {
  events: `${prefix}-events`,
  groups: `${prefix}-groups`,
  teams: `${prefix}-teams`,
  matches: `${prefix}-matches`,
  brackets: `${prefix}-brackets`,
  courts: `${prefix}-courts`,
  customLeagues: `${prefix}-custom-leagues`,
} as const;
