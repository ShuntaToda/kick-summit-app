import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, pk } from "../dynamodb-client";
import {
  bracketSchema,
  type TournamentBracket,
  type BracketRepository,
} from "../../domain/entities/bracket";

export class DynamoBracketRepository implements BracketRepository {
  async findAll(): Promise<TournamentBracket[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": pk(), ":sk": "BRACKET#" },
      })
    );
    return (result.Items ?? []).map((item) => bracketSchema.parse(item));
  }

  async save(bracket: TournamentBracket): Promise<void> {
    const validated = bracketSchema.parse(bracket);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: pk(),
          SK: `BRACKET#${validated.round}#${validated.slot}`,
          ...validated,
        },
      })
    );
  }
}
