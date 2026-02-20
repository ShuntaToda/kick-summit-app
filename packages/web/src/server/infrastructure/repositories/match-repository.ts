import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, pk } from "../dynamodb-client";
import {
  matchSchema,
  matchStatusSchema,
  type Match,
  type MatchRepository,
  type MatchStatus,
} from "../../domain/entities/match";

export class DynamoMatchRepository implements MatchRepository {
  async findAll(): Promise<Match[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": pk(), ":sk": "MATCH#" },
      })
    );
    return (result.Items ?? []).map((item) => matchSchema.parse(item));
  }

  async findById(id: string): Promise<Match | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk(), SK: `MATCH#${id}` },
      })
    );
    if (!result.Item) return null;
    return matchSchema.parse(result.Item);
  }

  async save(match: Match): Promise<void> {
    const validated = matchSchema.parse(match);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...validated,
          PK: pk(),
          SK: `MATCH#${validated.id}`,
        },
      })
    );
  }

  async updateScore(
    matchId: string,
    scoreA: number,
    scoreB: number,
    halfScoreA: number | null,
    halfScoreB: number | null,
    status: MatchStatus
  ): Promise<void> {
    matchStatusSchema.parse(status);

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk(), SK: `MATCH#${matchId}` },
        UpdateExpression:
          "SET scoreA = :sa, scoreB = :sb, halfScoreA = :ha, halfScoreB = :hb, #st = :st",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: {
          ":sa": scoreA,
          ":sb": scoreB,
          ":ha": halfScoreA,
          ":hb": halfScoreB,
          ":st": status,
        },
      })
    );
  }

  async updateStatus(matchId: string, status: MatchStatus): Promise<void> {
    matchStatusSchema.parse(status);

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk(), SK: `MATCH#${matchId}` },
        UpdateExpression: "SET #st = :st",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: { ":st": status },
      })
    );
  }
}
