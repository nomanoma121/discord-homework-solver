import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandInteraction } from "discord.js";
import Database from "better-sqlite3";
import * as path from "path";

const DB_PATH = path.join(process.cwd(), "data", "bot.db");

export const data = new SlashCommandBuilder()
  .setName("history")
  .setDescription("最近の10件のリクエスト履歴を表示します");

export async function execute(interaction: CommandInteraction): Promise<void> {
  try {
    const db = new Database(DB_PATH);

    // 現在のユーザーの最新10件のリクエストを取得するクエリ
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
        content: "リクエスト履歴がありません。",
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.displayName} の最新10件のリクエスト`)
      .setColor(0x00ae86);

    for (const record of records) {
      const timestampUnix = Math.floor(
        new Date(record.timestamp).getTime() / 1000
      );
      embed.addFields({
        name: `<t:${timestampUnix}:F>`,
        value: `${record.used_tokens.toLocaleString()} トークン`,
        inline: true,
      });
    }

    await interaction.reply({
      embeds: [embed],
    });
  } catch (error) {
    console.error("historyコマンドでエラーが発生:", error);
    await interaction.reply({
      content: "リクエスト履歴の取得中にエラーが発生しました。",
      ephemeral: true,
    });
  }
}
