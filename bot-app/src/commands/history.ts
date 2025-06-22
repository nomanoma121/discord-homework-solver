import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandInteraction } from "discord.js";
import Database from "better-sqlite3";
import * as path from "path";

const DB_PATH = path.join(process.cwd(), "data", "bot.db");

export const data = new SlashCommandBuilder()
  .setName("history")
  .setDescription("View your 10 most recent requests");

export async function execute(interaction: CommandInteraction): Promise<void> {
  try {
    const db = new Database(DB_PATH);

    // Query to get the 10 most recent requests for the current user
    const query = `
            SELECT timestamp, used_tokens
            FROM requests 
            WHERE user_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 10
        `;

    const records = db.prepare(query).all(interaction.user.id) as Array<{
      timestamp: string;
      used_tokens: number;
    }>;

    db.close();

    if (records.length === 0) {
      await interaction.reply({
        content: "You have no request history.",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Your 10 Most Recent Requests")
      .setColor(0x00ae86);

    for (const record of records) {
      const timestampUnix = Math.floor(
        new Date(record.timestamp).getTime() / 1000
      );
      embed.addFields({
        name: `<t:${timestampUnix}:F>`,
        value: `${record.used_tokens.toLocaleString()} tokens`,
        inline: true,
      });
    }

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error in history command:", error);
    await interaction.reply({
      content: "An error occurred while retrieving your request history.",
      ephemeral: true,
    });
  }
}
