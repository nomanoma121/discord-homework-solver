import { SlashCommandBuilder } from "discord.js";
import type { CommandInteraction } from "discord.js";
import Database from "better-sqlite3";
import * as path from "path";

const DB_PATH = path.join(process.cwd(), "data", "bot.db");

export const data = new SlashCommandBuilder()
  .setName("usage")
  .setDescription("今月のトークン使用量を確認します");

export async function execute(interaction: CommandInteraction): Promise<void> {
  try {
    const db = new Database(DB_PATH);

    // 今月の現在のユーザーのused_tokensの合計を取得するクエリ
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
      content: `📊 **${interaction.user.displayName}** の今月のトークン使用量: **${totalTokens.toLocaleString()}** トークン`,
    });
  } catch (error) {
    console.error("usageコマンドでエラーが発生:", error);
    await interaction.reply({
      content: "使用統計の取得中にエラーが発生しました。",
      ephemeral: true,
    });
  }
}
