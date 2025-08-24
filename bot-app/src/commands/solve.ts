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
          "❌ 画像または問題のテキスト説明のいずれかを提供してください。",
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
    const response = await result.response;
    const latexCode = response.text();
    
    // LaTeXコードを前処理（Markdownクリーンアップなど）
    const cleanedLatexCode = parseFullLatexCode(latexCode);
    
    // 科目に応じたテンプレートでラップ
    const contentOnly = cleanedLatexCode.replace(/\\documentclass[\s\S]*?\\begin\{document\}/, '').replace(/\\end\{document\}/, '').trim();
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
      addRequest(interaction.user.id, tokenCount);

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
      throw new Error(`LaTeXコンパイルに失敗しました: ${errorData.error}`);
    }

    // コンパイルされたPDFを取得
    const pdfBuffer = Buffer.from(await compileResponse.arrayBuffer());

    // データベースにトークン使用量をログ記録
    const tokenCount =
      (result as any)?.response?.usageMetadata?.totalTokenCount || 0;
    addRequest(interaction.user.id, tokenCount);

    // 結果をDiscordに送信
    const extension = outputFormat === "PNG" ? "png" : "pdf";
    const filename = `${baseFilename}.${extension}`;
    await interaction.editReply({
      content: `✅ 問題を正常に解決しました！ 使用トークン数: ${tokenCount}`,
      files: [new AttachmentBuilder(pdfBuffer, { name: filename })],
    });
  } catch (error) {
    console.error("solveコマンドでエラーが発生:", error);

    let errorMessage = "❌ リクエストの処理中にエラーが発生しました。";
    if (error instanceof Error) {
      errorMessage += ` エラー: ${error.message}`;
    }

    await interaction.editReply({
      content: errorMessage,
    });
  }
}
