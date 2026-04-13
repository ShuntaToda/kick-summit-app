import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../dynamodb-client";
import {
  customLeagueSchema,
  type CustomLeague,
  type CustomLeagueRepository,
} from "../../domain/entities/custom-league";

export class DynamoCustomLeagueRepository implements CustomLeagueRepository {
  async findAll(eventId: string): Promise<CustomLeague[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.customLeagues,
        IndexName: "eventId-index",
        KeyConditionExpression: "eventId = :eid",
        ExpressionAttributeValues: { ":eid": eventId },
      }),
    );
    return (result.Items ?? []).map((item) => customLeagueSchema.parse(item));
  }

  async findById(id: string): Promise<CustomLeague | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.customLeagues,
        Key: { id },
      }),
    );
    if (!result.Item) return null;
    return customLeagueSchema.parse(result.Item);
  }

  async save(customLeague: CustomLeague): Promise<void> {
    const validated = customLeagueSchema.parse(customLeague);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.customLeagues,
        Item: validated,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.customLeagues,
        Key: { id },
      }),
    );
  }
}
