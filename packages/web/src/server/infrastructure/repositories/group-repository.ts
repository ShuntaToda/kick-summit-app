import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../dynamodb-client";
import {
  groupSchema,
  type Group,
  type GroupRepository,
} from "../../domain/entities/group";

export class DynamoGroupRepository implements GroupRepository {
  async findAll(tournamentId: string): Promise<Group[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.groups,
        IndexName: "tournamentId-index",
        KeyConditionExpression: "tournamentId = :tid",
        ExpressionAttributeValues: { ":tid": tournamentId },
      }),
    );
    return (result.Items ?? []).map((item) => groupSchema.parse(item));
  }

  async findById(id: string): Promise<Group | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.groups,
        Key: { id },
      }),
    );
    if (!result.Item) return null;
    return groupSchema.parse(result.Item);
  }

  async save(group: Group): Promise<void> {
    const validated = groupSchema.parse(group);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.groups,
        Item: validated,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.groups,
        Key: { id },
      }),
    );
  }
}
