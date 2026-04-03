import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../dynamodb-client";
import {
  bracketSchema,
  type Bracket,
  type BracketRepository,
} from "../../domain/entities/bracket";

export class DynamoBracketRepository implements BracketRepository {
  async findAll(eventId: string): Promise<Bracket[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.brackets,
        IndexName: "eventId-index",
        KeyConditionExpression: "eventId = :tid",
        ExpressionAttributeValues: { ":tid": eventId },
      }),
    );
    return (result.Items ?? []).map((item) => bracketSchema.parse(item));
  }

  async save(bracket: Bracket): Promise<void> {
    const validated = bracketSchema.parse(bracket);
    // DynamoDB は null 属性値を拒否するため除去
    const item = Object.fromEntries(
      Object.entries(validated).filter(([, v]) => v !== null),
    );
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.brackets,
        Item: item,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.brackets,
        Key: { id },
      }),
    );
  }
}
