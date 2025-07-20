import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

export function setupEventHandlers(client, modules) {
  const { activityTracker, welcomeSystem, newsFeeds, commandHandler } = modules;

  // Handle slash commands
  client.on('interactionCreate', async (interaction) => {
    await commandHandler.handleInteraction(interaction);
  });

  // Track user activity on messages
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Only track users with Madden League role
    if (message.member && message.member.roles.cache.has(config.roles.maddenLeague)) {
      await activityTracker.updateUserActivity(message.author.id, message.guild.id);
    }
  });

  // Handle new members joining
  client.on('guildMemberAdd', async (member) => {
    await welcomeSystem.handleMemberJoin(member);
  });

  // Handle role updates (for welcome system)
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Check if Madden League role was added
    const hadMaddenRole = oldMember.roles.cache.has(config.roles.maddenLeague);
    const hasMaddenRole = newMember.roles.cache.has(config.roles.maddenLeague);
    
    if (!hadMaddenRole && hasMaddenRole && config.welcome.embedsEnabled) {
      await welcomeSystem.sendWelcomeMessage(newMember);
    }
  });

  // Error handling
  client.on('error', (error) => {
    logger.error('Discord client error:', error);
  });

  client.on('warn', (warning) => {
    logger.warn('Discord client warning:', warning);
  });

  // Graceful shutdown handling
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}