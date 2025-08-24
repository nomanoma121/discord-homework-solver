import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Bot usage guide and commands");

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle("📚 宿題解決Bot - 使用ガイド")
      .setDescription("AI を使って宿題や問題を解決するBotです！")
      .setColor(0x3498DB)
      .addFields(
        {
          name: "🎯 メインコマンド",
          value: "`/solve` - 問題を解く",
          inline: false,
        },
        {
          name: "📸 基本的な使い方",
          value: 
            "• **画像で問題を送る**\n" +
            "`/solve image:[画像ファイル]`\n\n" +
            "• **テキストで問題を入力**\n" +
            "`/solve text:問題文`\n\n" +
            "• **両方を組み合わせ**\n" +
            "`/solve image:[画像] text:追加説明`",
          inline: false,
        },
        {
          name: "🎓 科目選択",
          value:
            "専門的な解答が欲しい場合は `subject` を指定:\n" +
            "• `general` - 一般（デフォルト）\n" +
            "• `mathematics` - 数学\n" +
            "• `physics` - 物理学\n" +
            "• `chemistry` - 化学\n" +
            "• `biology` - 生物学\n" +
            "• `engineering` - 工学\n" +
            "• `statistics` - 統計学",
          inline: false,
        },
        {
          name: "📄 出力形式",
          value:
            "`output` オプションで形式を選択:\n" +
            "• `PDF` - PDFファイル（デフォルト）\n" +
            "• `PNG` - 画像ファイル\n" +
            "• `LaTeX Source` - LaTeXソースコード",
          inline: false,
        },
        {
          name: "💡 使用例",
          value:
            "```\n" +
            "/solve text:二次方程式 x²-5x+6=0 を解け subject:mathematics\n" +
            "/solve image:[物理の図] subject:physics output:PDF\n" +
            "/solve text:化学反応式をバランスさせて subject:chemistry\n" +
            "```",
          inline: false,
        },
        {
          name: "📊 その他のコマンド",
          value:
            "• `/stats` - Bot使用統計を表示\n" +
            "• `/help` - このヘルプを表示",
          inline: false,
        },
        {
          name: "⚠️ 注意事項",
          value:
            "• 画像は鮮明で読みやすいものをアップロードしてください\n" +
            "• 複雑な問題は部分的に分けて質問すると良い結果が得られます\n" +
            "• エラーが発生した場合は別の科目や出力形式を試してください",
          inline: false,
        },
        {
          name: "🔧 トラブルシューティング",
          value:
            "**よくある問題:**\n" +
            "• **LaTeX エラー** → `LaTeX Source` で内容確認\n" +
            "• **画像が読めない** → より鮮明な画像を使用\n" +
            "• **処理が遅い** → 問題を簡単な部分に分割\n" +
            "• **エラーが続く** → しばらく待ってから再試行",
          inline: false,
        }
      )
      .setFooter({
        text: "問題解決をお手伝いします！ 何かお困りのことがあればお気軽にどうぞ。",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("helpコマンドでエラーが発生:", error);

    await interaction.reply({
      content: 
        "❌ ヘルプの表示中にエラーが発生しました。\n\n" +
        "**基本的な使い方:**\n" +
        "• `/solve image:[画像]` - 画像の問題を解く\n" +
        "• `/solve text:[問題文]` - テキストの問題を解く\n" +
        "• `/stats` - 使用統計を表示",
      ephemeral: true,
    });
  }
}
