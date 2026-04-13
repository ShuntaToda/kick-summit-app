import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../dynamodb-client";
import {
  matchSchema,
  matchStatusSchema,
  type Match,
  type MatchRepository,
  type MatchStatus,
} from "../../domain/entities/match";

export class DynamoMatchRepository implements MatchRepository {
  async findAll(eventId: string): Promise<Match[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.matches,
        IndexName: "schedule-index",
        KeyConditionExpression: "eventId = :tid",
        ExpressionAttributeValues: { ":tid": eventId },
      }),
    );
    return (result.Items ?? []).map((item) => matchSchema.parse(item));
  }

  async findByGroupId(groupId: string): Promise<Match[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.matches,
        IndexName: "group-index",
        KeyConditionExpression: "groupId = :gid",
        ExpressionAttributeValues: { ":gid": groupId },
      }),
    );
    return (result.Items ?? []).map((item) => matchSchema.parse(item));
  }

  async findByCustomLeagueId(customLeagueId: string): Promise<Match[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.matches,
        IndexName: "custom-league-index",
        KeyConditionExpression: "customLeagueId = :clid",
        ExpressionAttributeValues: { ":clid": customLeagueId },
      }),
    );
    return (result.Items ?? []).map((item) => matchSchema.parse(item));
  }

  async findById(id: string): Promise<Match | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.matches,
        Key: { id },
      }),
    );
    if (!result.Item) return null;
    return matchSchema.parse(result.Item);
  }

  async save(match: Match): Promise<void> {
    const validated = matchSchema.parse(match);
    // DynamoDB GSI キーに null は使えないため除去
    const item = Object.fromEntries(
      Object.entries(validated).filter(([, v]) => v !== null),
    );
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.matches,
        Item: item,
      }),
    );
  }

  async updateScore(
    matchId: string,
    scoreA: number,
    scoreB: number,
    halfScoreA: number | null,
    halfScoreB: number | null,
    status: MatchStatus,
  ): Promise<void> {
    matchStatusSchema.parse(status);
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.matches,
        Key: { id: matchId },
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
      }),
    );
  }

  async updateStatus(matchId: string, status: MatchStatus): Promise<void> {
    matchStatusSchema.parse(status);
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.matches,
        Key: { id: matchId },
        UpdateExpression: "SET #st = :st",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: { ":st": status },
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.matches,
        Key: { id },
      }),
    );
  }
}
