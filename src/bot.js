import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from './config/config.js';
import { ActivityTracker } from './modules/activityTracker.js';
import { WelcomeSystem } from './modules/welcomeSystem.js';
import { NewsFeeds } from './modules/newsFeeds.js';
import { CommandHandler } from './modules/commandHandler.js';
import { deployCommands } from './commands/deployCommands.js';
import { setupEventHandlers } from './events/eventHandlers.js';
import { logger } from './utils/logger.js';

class GridironBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences
      ]
    });

    this.activityTracker = new ActivityTracker(this.client);
    this.welcomeSystem = new WelcomeSystem(this.client);
    this.newsFeeds = new NewsFeeds(this.client);
    this.commandHandler = new CommandHandler(this.client);

    this.setupBot();
  }

  setupBot() {
    setupEventHandlers(this.client, {
      activityTracker: this.activityTracker,
      welcomeSystem: this.welcomeSystem,
      newsFeeds: this.newsFeeds,
      commandHandler: this.commandHandler
    });

    this.client.once('ready', async () => {
      logger.info(`🏈 ${this.client.user.tag} is ready for the season!`);
      
      // Initialize modules with persistent storage
      await this.activityTracker.initialize();
      await this.welcomeSystem.initialize();
      await this.newsFeeds.initialize();
      
      // Deploy commands and start services
      await deployCommands();
      this.newsFeeds.startNewsFeeds();
      this.activityTracker.startActivityCheck();
    });
  }

  async start() {
    try {
      await this.client.login(config.discord.token);
    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down bot...');
    await this.activityTracker.shutdown();
    await this.welcomeSystem.shutdown();
    await this.newsFeeds.shutdown();
    this.client.destroy();
  }
}

// Start the bot
const bot = new GridironBot();
bot.start();

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await bot.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await bot.shutdown();
  process.exit(0);
});