import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} from "discord.js";
import { getCurrentDateString } from "../utils";

export const data = new SlashCommandBuilder()
  .setName("compile")
  .setDescription("Compile an uploaded LaTeX file to PDF")
  .addAttachmentOption((option: any) =>
    option
      .setName("file")
      .setDescription("LaTeX (.tex) file to compile")
      .setRequired(true)
  )
  .addStringOption((option: any) =>
    option
      .setName("output")
      .setDescription("Output format")
      .setRequired(false)
      .addChoices(
        { name: "PDF", value: "PDF" },
        { name: "PNG", value: "PNG" }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    const file = interaction.options.getAttachment("file");
    const outputFormat = interaction.options.getString("output") || "PDF";

    // 入力検証
    if (!file) {
      await interaction.editReply({
        content:
          "❌ **ファイルが指定されていません**\n" +
          "📄 コンパイルする .tex ファイルをアップロードしてください。\n\n" +
          "💡 **使用例:**\n" +
          "• `/compile file:[your_file.tex]`\n" +
          "• `/compile file:[your_file.tex] output:PDF`",
      });
      return;
    }

    // ファイル拡張子チェック
    if (!file.name.endsWith(".tex")) {
      await interaction.editReply({
        content:
          "❌ **無効なファイル形式**\n" +
          "📄 .tex ファイルのみアップロードできます。\n\n" +
          `アップロードされたファイル: \`${file.name}\`\n\n` +
          "💡 **対応形式:** .tex",
      });
      return;
    }

    console.log(`LaTeXファイルを処理中: ${file.name}`);

    // ファイルをダウンロード
    const response = await fetch(file.url);
    if (!response.ok) {
      throw new Error("Failed to download LaTeX file");
    }

    const latexCode = await response.text();

    // LaTeXコードが空でないかチェック
    if (!latexCode.trim()) {
      await interaction.editReply({
        content:
          "❌ **空のファイル**\n" +
          "📄 アップロードされたファイルが空です。\n\n" +
          "💡 有効なLaTeXコードを含むファイルをアップロードしてください。",
      });
      return;
    }

    // LaTeXコードをコンパイラサービスに送信
    console.log("LaTeXコンパイラに送信中...");
    const compileResponse = await fetch("http://latex-compiler:8080/compile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ latex_code: latexCode }),
    });

    if (!compileResponse.ok) {
      const errorData = await compileResponse.json();
      const errorMessage = errorData.error || "不明なエラー";

      let userFriendlyError = "❌ **LaTeXコンパイルエラー**\n";

      // よくあるエラーを分かりやすく説明
      if (errorMessage.includes("Missing") || errorMessage.includes("Undefined")) {
        userFriendlyError += "📝 LaTeX構文にエラーがあります。数式の記述を確認してください。\n";
      } else if (errorMessage.includes("Emergency stop") || errorMessage.includes("Fatal error")) {
        userFriendlyError += "🚫 重大なコンパイルエラーが発生しました。\n";
      } else if (errorMessage.includes("Package")) {
        userFriendlyError += "📦 必要なパッケージが見つからない可能性があります。\n";
      } else if (errorMessage.includes("documentclass")) {
        userFriendlyError += "📋 ドキュメントクラスが正しく定義されていません。\n";
      } else {
        userFriendlyError += "⚠️ LaTeXの処理中に問題が発生しました。\n";
      }

      userFriendlyError += `\n🔍 **エラー詳細:** ${errorMessage.substring(0, 500)}${errorMessage.length > 500 ? '...' : ''}\n`;
      userFriendlyError += "\n💡 **対処方法:**\n";
      userFriendlyError += "• LaTeXファイルの構文を確認してください\n";
      userFriendlyError += "• 必要なパッケージがすべて含まれているか確認してください\n";
      userFriendlyError += "• ローカル環境でコンパイルテストを行ってください";

      throw new Error(userFriendlyError);
    }

    // コンパイルされたPDFを取得
    const pdfBuffer = Buffer.from(await compileResponse.arrayBuffer());

    // ファイル名を生成（元のファイル名から拡張子を除いたもの + 日時）
    const originalName = file.name.replace(/\.tex$/i, "");
    const dateString = getCurrentDateString();
    const extension = outputFormat === "PNG" ? "png" : "pdf";
    const filename = `${dateString}_${originalName}.${extension}`;

    // 結果をDiscordに送信
    await interaction.editReply({
      content: `✅ LaTeXファイルを正常にコンパイルしました！\n📄 元のファイル: \`${file.name}\``,
      files: [new AttachmentBuilder(pdfBuffer, { name: filename })],
    });
  } catch (error) {
    console.error("compileコマンドでエラーが発生:", error);

    let errorMessage = "";

    if (error instanceof Error) {
      // すでにユーザーフレンドリーなエラーメッセージの場合はそのまま使用
      if (error.message.includes("**LaTeXコンパイルエラー**")) {
        errorMessage = error.message;
      } else if (error.message.includes("fetch") || error.message.includes("download")) {
        errorMessage =
          "❌ **ネットワークエラー**\n" +
          "🌐 ファイルのダウンロードまたはサーバーとの通信に失敗しました。\n\n" +
          "💡 **対処方法:**\n" +
          "• しばらく待ってから再試行してください\n" +
          "• ファイルサイズが大きすぎる場合は小さくしてください";
      } else if (error.message.includes("timeout")) {
        errorMessage =
          "❌ **処理タイムアウト**\n" +
          "⏰ コンパイル処理に時間がかかりすぎています。\n\n" +
          "💡 **対処方法:**\n" +
          "• LaTeXファイルを簡素化してください\n" +
          "• 大きな画像やグラフィックを削減してください";
      } else {
        errorMessage =
          "❌ **予期しないエラー**\n" +
          "⚠️ 処理中に問題が発生しました。\n\n" +
          `🔍 **エラー詳細:** ${error.message}\n\n` +
          "💡 **対処方法:**\n" +
          "• `/help` で使用方法を確認してください\n" +
          "• 問題が続く場合は管理者にお知らせください";
      }
    } else {
      errorMessage =
        "❌ **不明なエラー**\n" +
        "⚠️ 予期しない問題が発生しました。\n\n" +
        "💡 管理者にお知らせください。";
    }

    await interaction.editReply({
      content: errorMessage,
    });
  }
}
