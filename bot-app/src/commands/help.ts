import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Displays information and available commands");

export async function execute(interaction: CommandInteraction): Promise<void> {
  try {
    const embed = new EmbedBuilder()
      .setTitle("Gemini-LaTeX Bot Help")
      .setDescription(
        "I can solve problems from images or text and provide a beautifully formatted PDF solution using AI."
      )
      .setColor(0x4285f4)
      .addFields(
        {
          name: "/solve",
          value:
            "Solve a mathematical problem\n" +
            "• **image** (optional): Upload an image containing the problem\n" +
            "• **text** (optional): Type the problem description\n" +
            "• **output** (optional): Choose output format (PDF, PNG, or LaTeX Source)",
          inline: false,
        },
        {
          name: "/usage",
          value: "Check your token usage for the current month",
          inline: true,
        },
        {
          name: "/history",
          value: "View your 10 most recent requests",
          inline: true,
        },
        {
          name: "/help",
          value: "Display this help message",
          inline: true,
        }
      )
      .setFooter({
        text: "Powered by Google Gemini AI • LaTeX compilation in Docker",
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error in help command:", error);
    await interaction.reply({
      content: "An error occurred while displaying the help information.",
      ephemeral: true,
    });
  }
}
