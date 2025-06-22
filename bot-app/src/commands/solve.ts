import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addRequest } from "../db";

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
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    const image = interaction.options.getAttachment("image");
    const text = interaction.options.getString("text");
    const outputFormat = interaction.options.getString("output") || "PDF";

    // Input validation
    if (!image && !text) {
      await interaction.editReply({
        content:
          "❌ Please provide either an image or text description of the problem to solve.",
      });
      return;
    }

    // Prepare Gemini API request
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = `Solve this mathematical problem and provide the solution in LaTeX format. 
        Wrap the entire solution in a complete LaTeX document structure with \\documentclass{article}, \\begin{document}, and \\end{document}.
        Use appropriate math environments and formatting. Be thorough in your explanation.`;

    if (text) {
      prompt += `\n\nProblem: ${text}`;
    }

    let parts: any[] = [prompt];

    // If image is provided, fetch and add it to the request
    if (image) {
      console.log(`Processing image: ${image.name}`);
      const response = await fetch(image.url);
      const imageBuffer = Buffer.from(await response.arrayBuffer());

      parts.push({
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: image.contentType || "image/png",
        },
      });
    }

    // Call Gemini API
    console.log("Calling Gemini API...");
    const result = await model.generateContent(parts);
    const response = await result.response;
    const latexCode = response.text();

    console.log("Generated LaTeX code");

    // If user wants LaTeX source, return it directly
    if (outputFormat === "LaTeX Source") {
      // Log token usage
      const tokenCount =
        (result as any)?.response?.usageMetadata?.totalTokenCount || 0;
      addRequest(interaction.user.id, tokenCount);

      await interaction.editReply({
        content: `✅ LaTeX solution generated! Tokens used: ${tokenCount}`,
        files: [
          new AttachmentBuilder(Buffer.from(latexCode), {
            name: "solution.tex",
          }),
        ],
      });
      return;
    }

    // Send LaTeX code to compiler service
    console.log("Sending to LaTeX compiler...");
    const compileResponse = await fetch("http://latex-compiler:8080/compile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ latex_code: latexCode }),
    });

    if (!compileResponse.ok) {
      const errorData = await compileResponse.json();
      throw new Error(`LaTeX compilation failed: ${errorData.error}`);
    }

    // Get the compiled PDF
    const pdfBuffer = Buffer.from(await compileResponse.arrayBuffer());

    // Log token usage to database
    const tokenCount =
      (result as any)?.response?.usageMetadata?.totalTokenCount || 0;
    addRequest(interaction.user.id, tokenCount);

    // Send the result back to Discord
    const filename = outputFormat === "PNG" ? "solution.png" : "solution.pdf";
    await interaction.editReply({
      content: `✅ Problem solved successfully! Tokens used: ${tokenCount}`,
      files: [new AttachmentBuilder(pdfBuffer, { name: filename })],
    });
  } catch (error) {
    console.error("Error in solve command:", error);

    let errorMessage = "❌ An error occurred while processing your request.";
    if (error instanceof Error) {
      errorMessage += ` Error: ${error.message}`;
    }

    await interaction.editReply({
      content: errorMessage,
    });
  }
}
