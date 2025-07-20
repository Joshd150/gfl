import { Collection } from 'discord.js';
import { leagueCommands } from '../commands/leagueCommands.js';
import { logger } from '../utils/logger.js';

export class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Collection();
    this.loadCommands();
  }

  loadCommands() {
    for (const command of leagueCommands) {
      this.commands.set(command.data.name, command);
    }
    logger.info(`Loaded ${this.commands.size} slash commands`);
  }

  async handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
      logger.debug(`Executed command: ${interaction.commandName} by ${interaction.user.tag}`);
    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}:`, error);
      
      const errorMessage = {
        content: '❌ There was an error while executing this command!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
}