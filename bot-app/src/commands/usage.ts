import { SlashCommandBuilder } from "discord.js";
import type { CommandInteraction } from "discord.js";
import Database from "better-sqlite3";
import * as path from "path";

const DB_PATH = path.join(process.cwd(), "data", "bot.db");

export const data = new SlashCommandBuilder()
  .setName("usage")
  .setDescription("Check your token usage for the current month");

export async function execute(interaction: CommandInteraction): Promise<void> {
  try {
    const db = new Database(DB_PATH);

    // Query to get the sum of used_tokens for the current user for this month
    const query = `
            SELECT SUM(used_tokens) as total_tokens
            FROM requests 
            WHERE user_id = ? 
            AND strftime('%Y-%m', timestamp) = strftime('%Y-%m', 'now')
        `;

    const result = db.prepare(query).get(interaction.user.id) as {
      total_tokens: number | null;
    };
    const totalTokens = result?.total_tokens || 0;

    db.close();

    await interaction.reply({
      content: `Your token usage for this month is **${totalTokens.toLocaleString()}** tokens.`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error in usage command:", error);
    await interaction.reply({
      content: "An error occurred while retrieving your usage statistics.",
      ephemeral: true,
    });
  }
}
