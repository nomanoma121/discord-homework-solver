import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getTotalStats } from "../db";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Show bot usage statistics");

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const stats = getTotalStats();

    if (!stats) {
      await interaction.reply({
        content: "❌ 統計情報を取得できませんでした。",
        ephemeral: true,
      });
      return;
    }

    // 数値をカンマ区切りでフォーマット
    const formatNumber = (num: number): string => {
      return num.toLocaleString('ja-JP');
    };

    // 最後更新日時をフォーマット
    const lastUpdated = new Date(stats.lastUpdated).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    });

    const embed = new EmbedBuilder()
      .setTitle("📊 Bot使用統計")
      .setColor(0x00AE86)
      .addFields(
        {
          name: "🔢 総リクエスト数",
          value: `${formatNumber(stats.totalRequests)}件`,
          inline: true,
        },
        {
          name: "🎯 総使用トークン数",
          value: `${formatNumber(stats.totalTokens)}トークン`,
          inline: true,
        },
        {
          name: "📊 平均トークン/リクエスト",
          value: stats.totalRequests > 0 
            ? `${formatNumber(Math.round(stats.totalTokens / stats.totalRequests))}トークン`
            : "0トークン",
          inline: true,
        }
      )
      .setFooter({
        text: `最終更新: ${lastUpdated}`,
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("statsコマンドでエラーが発生:", error);

    await interaction.reply({
      content: "❌ 統計情報の取得中にエラーが発生しました。",
      ephemeral: true,
    });
  }
}