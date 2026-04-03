import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../dynamodb-client";
import {
  eventSchema,
  type Event,
  type EventRepository,
} from "../../domain/entities/event";

export class DynamoEventRepository implements EventRepository {
  async findById(id: string): Promise<Event | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.events,
        Key: { id },
      }),
    );
    if (!result.Item) return null;
    return eventSchema.parse(result.Item);
  }

  async save(event: Event): Promise<void> {
    const validated = eventSchema.parse(event);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.events,
        Item: validated,
      }),
    );
  }
}
