import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, pk } from "../dynamodb-client";
import {
  teamSchema,
  type Team,
  type TeamRepository,
} from "../../domain/entities/team";

export class DynamoTeamRepository implements TeamRepository {
  async findAll(): Promise<Team[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": pk(), ":sk": "TEAM#" },
      })
    );
    return (result.Items ?? []).map((item) => teamSchema.parse(item));
  }

  async findById(id: string): Promise<Team | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk(), SK: `TEAM#${id}` },
      })
    );
    if (!result.Item) return null;
    return teamSchema.parse(result.Item);
  }

  async save(team: Team): Promise<void> {
    const validated = teamSchema.parse(team);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { PK: pk(), SK: `TEAM#${validated.id}`, ...validated },
      })
    );
  }
}
