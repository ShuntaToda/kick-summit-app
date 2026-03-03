import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../dynamodb-client";
import {
  tournamentSchema,
  type Tournament,
  type TournamentRepository,
} from "../../domain/entities/tournament";

export class DynamoTournamentRepository implements TournamentRepository {
  async findById(id: string): Promise<Tournament | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.tournaments,
        Key: { id },
      }),
    );
    if (!result.Item) return null;
    return tournamentSchema.parse(result.Item);
  }

  async save(tournament: Tournament): Promise<void> {
    const validated = tournamentSchema.parse(tournament);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.tournaments,
        Item: validated,
      }),
    );
  }
}
