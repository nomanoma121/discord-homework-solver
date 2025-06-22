import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { init as initDatabase } from "./db";

// Load environment variables
dotenv.config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Create a collection to store commands
const commands = new Collection<string, any>();

async function loadCommands() {
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file: string) => file.endsWith(".ts") || file.endsWith(".js"));

  const commandsData = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);

    if ("data" in command && "execute" in command) {
      commands.set(command.data.name, command);
      commandsData.push(command.data.toJSON());
      console.log(`Loaded command: ${command.data.name}`);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }

  return commandsData;
}

async function registerCommands(commandsData: any[]) {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log(
      `Started refreshing ${commandsData.length} application (/) commands.`
    );

    // Register commands globally
    const data = await rest.put(Routes.applicationCommands(client.user!.id), {
      body: commandsData,
    });

    console.log(
      `Successfully reloaded ${
        (data as any[]).length
      } application (/) commands.`
    );
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}

// When the client is ready, run this code
client.once(Events.ClientReady, async (readyClient: any) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  // Load and register commands
  const commandsData = await loadCommands();
  await registerCommands(commandsData);
});

// Handle interactions
client.on(Events.InteractionCreate, async (interaction: any) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Error executing command:", error);

    const errorMessage = "❌ There was an error while executing this command!";

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Initialize database and login
async function main() {
  try {
    // Initialize database
    initDatabase();

    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Error starting bot:", error);
    process.exit(1);
  }
}

main();
