import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addRequest } from "../db";
import { parseFullLatexCode, extractLatexTitle, getCurrentDateString, getSubjectPrompt, generateSubjectSpecificLatex } from "../utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const data = new SlashCommandBuilder()
  .setName("solve")
  .setDescription("Solve a problem using Gemini AI and generate LaTeX output")
  .addAttachmentOption((option: any) =>
    option
      .setName("image")
      .setDescription("Image containing the problem to solve")
      .setRequired(false)
  )
  .addStringOption((option: any) =>
    option
      .setName("text")
      .setDescription("Text description of the problem to solve")
      .setRequired(false)
  )
  .addStringOption((option: any) =>
    option
      .setName("output")
      .setDescription("Output format")
      .setRequired(false)
      .addChoices(
        { name: "PDF", value: "PDF" },
        { name: "PNG", value: "PNG" },
        { name: "LaTeX Source", value: "LaTeX Source" }
      )
  )
  .addStringOption((option: any) =>
    option
      .setName("subject")
      .setDescription("Subject area for specialized solving approach")
      .setRequired(false)
      .addChoices(
        { name: "一般 (General)", value: "general" },
        { name: "数学 (Mathematics)", value: "mathematics" },
        { name: "物理学 (Physics)", value: "physics" },
        { name: "化学 (Chemistry)", value: "chemistry" },
        { name: "生物学 (Biology)", value: "biology" },
        { name: "工学 (Engineering)", value: "engineering" },
        { name: "統計学 (Statistics)", value: "statistics" }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    const image = interaction.options.getAttachment("image");
    const text = interaction.options.getString("text");
    const outputFormat = interaction.options.getString("output") || "PDF";
    const subject = interaction.options.getString("subject") || "general";

    // 入力検証
    if (!image && !text) {
      await interaction.editReply({
        content:
          "❌ **入力が不足しています**\n" +
          "📸 問題の画像をアップロードするか、\n" +
          "📝 `text` オプションで問題文を入力してください。\n\n" +
          "💡 **使用例:**\n" +
          "• `/solve image:[画像ファイル]`\n" +
          "• `/solve text:二次方程式 x²-5x+6=0 を解け`\n" +
          "• `/solve image:[画像] subject:mathematics output:PDF`",
      });
      return;
    }

    // Gemini APIリクエストの準備
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 科目に応じたプロンプトを取得
    let prompt = getSubjectPrompt(subject);

    if (text) {
      prompt += `\n\n問題: ${text}`;
    }

    let parts: any[] = [prompt];

    // 画像が提供された場合、取得してリクエストに追加
    if (image) {
      console.log(`画像を処理中: ${image.name}`);
      const response = await fetch(image.url);
      const imageBuffer = Buffer.from(await response.arrayBuffer());

      parts.push({
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: image.contentType || "image/png",
        },
      });
    }

    // Gemini API呼び出し
    console.log("Gemini APIを呼び出し中...");
    const result = await model.generateContent(parts);
    const response = result.response;
    const latexCode = response.text();
    
    // LaTeXコードを前処理（Markdownクリーンアップなど）
    const cleanedLatexCode = parseFullLatexCode(latexCode);

    // 科目に応じたテンプレートでラップ
    // documentclassから\begin{document}まで、および\end{document}以降を削除
    let contentOnly = cleanedLatexCode
      .replace(/\\documentclass[\s\S]*?\\begin\{document\}/s, '')
      .replace(/\\end\{document\}[\s\S]*/s, '')
      .trim();

    // プリアンブルに含まれるべきでない定義を削除
    contentOnly = contentOnly
      // \fancypagestyle{plain}{...} の定義を削除（テンプレートに含まれるため）
      .replace(/\\fancypagestyle\{plain\}\{[\s\S]*?\}/g, '')
      // \usetikzlibrary{...} の定義を削除（テンプレートに含まれるため）
      .replace(/\\usetikzlibrary\{[^}]*\}/g, '')
      // \usepackage{...} の定義を削除（テンプレートに含まれるため）
      .replace(/\\usepackage(?:\[[^\]]*\])?\{[^}]*\}/g, '')
      // \pgfplotsset{...} の定義を削除（テンプレートに含まれるため）
      .replace(/\\pgfplotsset\{[^}]*\}/g, '')
      // \usepgfplotslibrary{...} の定義を削除（テンプレートに含まれるため）
      .replace(/\\usepgfplotslibrary\{[^}]*\}/g, '');

    const fullLatexCode = generateSubjectSpecificLatex(subject, contentOnly);

    console.log("LaTeXコードを生成しました");

    // タイトルと日時を使ってファイル名を生成
    const title = extractLatexTitle(latexCode);
    const dateString = getCurrentDateString();
    const baseFilename = `${dateString}_${title}`;

    // ユーザーがLaTeXソースを要求した場合、直接返す
    if (outputFormat === "LaTeX Source") {
      // トークン使用量をログに記録
      const tokenCount =
        (result as any)?.response?.usageMetadata?.totalTokenCount || 0;
      addRequest(tokenCount, subject);

      await interaction.editReply({
        content: `✅ LaTeX解答を生成しました！ 使用トークン数: ${tokenCount}`,
        files: [
          new AttachmentBuilder(Buffer.from(fullLatexCode), {
            name: `${baseFilename}.tex`,
          }),
        ],
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
      body: JSON.stringify({ latex_code: fullLatexCode }),
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
      } else {
        userFriendlyError += "⚠️ LaTeXの処理中に問題が発生しました。\n";
      }
      
      userFriendlyError += `\n🔍 **エラー詳細:** ${errorMessage}\n`;
      userFriendlyError += "\n💡 **対処方法:**\n";
      userFriendlyError += "• 別の科目を選択してみてください\n";
      userFriendlyError += "• 問題文をより詳しく入力してください\n";
      userFriendlyError += "• LaTeX Source出力で内容を確認してください";
      
      throw new Error(userFriendlyError);
    }

    // コンパイルされたPDFを取得
    const pdfBuffer = Buffer.from(await compileResponse.arrayBuffer());

    // データベースにトークン使用量をログ記録
    const tokenCount =
      (result as any)?.response?.usageMetadata?.totalTokenCount || 0;
    addRequest(tokenCount, subject);

    // 結果をDiscordに送信
    const extension = outputFormat === "PNG" ? "png" : "pdf";
    const filename = `${baseFilename}.${extension}`;
    await interaction.editReply({
      content: `✅ 問題を正常に解決しました！ 使用トークン数: ${tokenCount}`,
      files: [new AttachmentBuilder(pdfBuffer, { name: filename })],
    });
  } catch (error) {
    console.error("solveコマンドでエラーが発生:", error);

    let errorMessage = "";
    
    if (error instanceof Error) {
      // すでにユーザーフレンドリーなエラーメッセージの場合はそのまま使用
      if (error.message.includes("**LaTeXコンパイルエラー**")) {
        errorMessage = error.message;
      } else if (error.message.includes("LaTeXコンパイルに失敗")) {
        errorMessage = error.message; // 上で処理されたエラー
      } else if (error.message.includes("fetch")) {
        errorMessage = "❌ **ネットワークエラー**\n" +
          "🌐 サーバーとの通信に失敗しました。\n\n" +
          "💡 **対処方法:**\n" +
          "• しばらく待ってから再試行してください\n" +
          "• 画像サイズが大きすぎる場合は小さくしてください";
      } else if (error.message.includes("timeout")) {
        errorMessage = "❌ **処理タイムアウト**\n" +
          "⏰ 処理に時間がかかりすぎています。\n\n" +
          "💡 **対処方法:**\n" +
          "• 問題をより簡単な部分に分けて試してください\n" +
          "• 画像の解像度を下げてください";
      } else if (error.message.includes("API")) {
        errorMessage = "❌ **API エラー**\n" +
          "🤖 AI サービスで問題が発生しました。\n\n" +
          "💡 **対処方法:**\n" +
          "• しばらく待ってから再試行してください\n" +
          "• 問題文をより明確に記述してください";
      } else {
        errorMessage = "❌ **予期しないエラー**\n" +
          "⚠️ 処理中に問題が発生しました。\n\n" +
          `🔍 **エラー詳細:** ${error.message}\n\n` +
          "💡 **対処方法:**\n" +
          "• `/help` で使用方法を確認してください\n" +
          "• 問題が続く場合は管理者にお知らせください";
      }
    } else {
      errorMessage = "❌ **不明なエラー**\n" +
        "⚠️ 予期しない問題が発生しました。\n\n" +
        "💡 管理者にお知らせください。";
    }

    await interaction.editReply({
      content: errorMessage,
    });
  }
}
