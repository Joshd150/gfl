import { REST, Routes } from 'discord.js';
import { config } from '../config/config.js';
import { leagueCommands } from './leagueCommands.js';
import { logger } from '../utils/logger.js';

const commands = leagueCommands.map(command => command.data.toJSON());

const rest = new REST().setToken(config.discord.token);

export async function deployCommands() {
  try {
    logger.info('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
      { body: commands },
    );

    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error('Error deploying commands:', error);
  }
}