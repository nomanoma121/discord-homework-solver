import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("利用可能なコマンドと情報を表示します");

export async function execute(interaction: CommandInteraction): Promise<void> {
  try {
    const embed = new EmbedBuilder()
      .setTitle("Gemini-LaTeX Bot ヘルプ")
      .setDescription(
        "画像やテキストから問題を解き、AIを使用して美しくフォーマットされたPDF解答を提供できます。"
      )
      .setColor(0x4285f4)
      .addFields(
        {
          name: "/solve",
          value:
            "問題を解きます\n" +
            "• **image** (オプション): 問題が含まれた画像をアップロード\n" +
            "• **text** (オプション): 問題の説明をテキストで入力\n" +
            "• **output** (オプション): 出力形式を選択 (PDF, PNG, LaTeX Source)",
          inline: false,
        },
        {
          name: "/usage",
          value: "今月のトークン使用量を確認します",
          inline: true,
        },
        {
          name: "/history",
          value: "最近の10件のリクエスト履歴を表示します",
          inline: true,
        },
        {
          name: "/help",
          value: "このヘルプメッセージを表示します",
          inline: true,
        }
      )
      .setFooter({
        text: "Powered by Google Gemini AI • Docker内でLaTeXコンパイル",
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  } catch (error) {
    console.error("helpコマンドでエラーが発生:", error);
    await interaction.reply({
      content: "ヘルプ情報の表示中にエラーが発生しました。",
      ephemeral: true,
    });
  }
}
