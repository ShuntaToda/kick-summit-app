import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../dynamodb-client";
import {
  courtSchema,
  type Court,
  type CourtRepository,
} from "../../domain/entities/court";

export class DynamoCourtRepository implements CourtRepository {
  async findAll(eventId: string): Promise<Court[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.courts,
        IndexName: "eventId-index",
        KeyConditionExpression: "eventId = :tid",
        ExpressionAttributeValues: { ":tid": eventId },
      }),
    );
    return (result.Items ?? []).map((item) => courtSchema.parse(item));
  }

  async findById(id: string): Promise<Court | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.courts,
        Key: { id },
      }),
    );
    if (!result.Item) return null;
    return courtSchema.parse(result.Item);
  }

  async save(court: Court): Promise<void> {
    const validated = courtSchema.parse(court);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.courts,
        Item: validated,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.courts,
        Key: { id },
      }),
    );
  }
}
