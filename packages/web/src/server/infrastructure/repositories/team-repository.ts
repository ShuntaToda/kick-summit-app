import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../dynamodb-client";
import {
  teamSchema,
  type Team,
  type TeamRepository,
} from "../../domain/entities/team";

export class DynamoTeamRepository implements TeamRepository {
  async findAll(tournamentId: string): Promise<Team[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.teams,
        IndexName: "tournamentId-index",
        KeyConditionExpression: "tournamentId = :tid",
        ExpressionAttributeValues: { ":tid": tournamentId },
      }),
    );
    return (result.Items ?? []).map((item) => teamSchema.parse(item));
  }

  async findByGroupId(groupId: string): Promise<Team[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.teams,
        IndexName: "groupId-index",
        KeyConditionExpression: "groupId = :gid",
        ExpressionAttributeValues: { ":gid": groupId },
      }),
    );
    return (result.Items ?? []).map((item) => teamSchema.parse(item));
  }

  async findById(id: string): Promise<Team | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.teams,
        Key: { id },
      }),
    );
    if (!result.Item) return null;
    return teamSchema.parse(result.Item);
  }

  async save(team: Team): Promise<void> {
    const validated = teamSchema.parse(team);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.teams,
        Item: validated,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.teams,
        Key: { id },
      }),
    );
  }
}
