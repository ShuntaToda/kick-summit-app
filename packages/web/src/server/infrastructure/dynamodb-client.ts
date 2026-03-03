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

export const docClient = DynamoDBDocumentClient.from(client);

export const TOURNAMENT_ID = "default";

const prefix = process.env.TABLE_PREFIX ?? "kick-summit";

export const TABLE_NAMES = {
  tournaments: `${prefix}-tournaments`,
  groups: `${prefix}-groups`,
  teams: `${prefix}-teams`,
  matches: `${prefix}-matches`,
  brackets: `${prefix}-brackets`,
} as const;
