import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../dynamodb-client";
import {
  bracketSchema,
  type TournamentBracket,
  type BracketRepository,
} from "../../domain/entities/bracket";

export class DynamoBracketRepository implements BracketRepository {
  async findAll(tournamentId: string): Promise<TournamentBracket[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.brackets,
        IndexName: "tournamentId-index",
        KeyConditionExpression: "tournamentId = :tid",
        ExpressionAttributeValues: { ":tid": tournamentId },
      }),
    );
    return (result.Items ?? []).map((item) => bracketSchema.parse(item));
  }

  async save(bracket: TournamentBracket): Promise<void> {
    const validated = bracketSchema.parse(bracket);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.brackets,
        Item: validated,
      }),
    );
  }
}
