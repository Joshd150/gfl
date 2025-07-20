import Parser from 'rss-parser';
import cron from 'node-cron';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class NewsFeeds {
  constructor(client) {
    this.client = client;
    this.parser = new Parser();
    this.nflInterval = null;
    this.maddenInterval = null;
    this.postedArticles = new Set(); // Track posted articles to avoid duplicates
    this.startTime = Date.now(); // Track when bot started to prevent spam on restart
  }

  async initialize() {
    logger.info('News feeds system initialized - will only post articles published after bot start');
  }

  async fetchAndPostNFLNews() {
    try {
      if (!config.channels.nflNews || !config.rss.nflUrl) {
        logger.warn('NFL news channel or RSS URL not configured');
        return;
      }

      const guild = this.client.guilds.cache.get(config.discord.guildId);
      if (!guild) return;

      const channel = guild.channels.cache.get(config.channels.nflNews);
      if (!channel) {
        logger.warn('NFL news channel not found');
        return;
      }

      const feed = await this.parser.parseURL(config.rss.nflUrl);
      
      // Only process articles published after bot started
      const newArticles = feed.items.filter(article => {
        const articleTime = new Date(article.pubDate).getTime();
        const articleId = `nfl-${article.link}`;
        return articleTime > this.startTime && !this.postedArticles.has(articleId);
      });

      for (const article of newArticles) {
        const articleId = `nfl-${article.link}`;
        
        const embed = {
          color: 0x013369,
          title: article.title.substring(0, 256),
          url: article.link,
          description: article.contentSnippet ? article.contentSnippet.substring(0, 300) + '...' : '',
          fields: [
            {
              name: '📰 Source',
              value: 'ESPN NFL',
              inline: true
            },
            {
              name: '📅 Published',
              value: new Date(article.pubDate).toLocaleDateString(),
              inline: true
            }
          ],
          footer: {
            text: 'NFL News Feed',
            icon_url: 'https://i.imgur.com/hU7ulOM.png'
          },
          timestamp: new Date(article.pubDate).toISOString()
        };

        await channel.send({ embeds: [embed] });
        this.postedArticles.add(articleId);
        logger.info('Posted new NFL news article');
      }

    } catch (error) {
      logger.error('Error fetching NFL news:', error);
    }
  }

  async fetchAndPostMaddenNews() {
    try {
      if (!config.channels.maddenNews || !config.rss.maddenUrl) {
        logger.warn('Madden news channel or RSS URL not configured');
        return;
      }

      const guild = this.client.guilds.cache.get(config.discord.guildId);
      if (!guild) return;

      const channel = guild.channels.cache.get(config.channels.maddenNews);
      if (!channel) {
        logger.warn('Madden news channel not found');
        return;
      }

      const feed = await this.parser.parseURL(config.rss.maddenUrl);
      
      // Only process articles published after bot started
      const newArticles = feed.items.filter(article => {
        const articleTime = new Date(article.pubDate).getTime();
        const articleId = `madden-${article.link}`;
        return articleTime > this.startTime && !this.postedArticles.has(articleId);
      });

      for (const article of newArticles) {
        const articleId = `madden-${article.link}`;
        
        const embed = {
          color: 0xea580c,
          title: article.title.substring(0, 256),
          url: article.link,
          description: article.contentSnippet ? article.contentSnippet.substring(0, 300) + '...' : '',
          fields: [
            {
              name: '📰 Source',
              value: 'EA Sports',
              inline: true
            },
            {
              name: '📅 Published',
              value: new Date(article.pubDate).toLocaleDateString(),
              inline: true
            }
          ],
          footer: {
            text: 'Madden News Feed',
            icon_url: 'https://i.imgur.com/hU7ulOM.png'
          },
          timestamp: new Date(article.pubDate).toISOString()
        };

        await channel.send({ embeds: [embed] });
        this.postedArticles.add(articleId);
        logger.info('Posted new Madden news article');
      }

    } catch (error) {
      logger.error('Error fetching Madden news:', error);
    }
  }

  startNewsFeeds() {
    // Check for news every 10 minutes
    this.nflInterval = cron.schedule('*/10 * * * *', () => {
      this.fetchAndPostNFLNews();
    });

    this.maddenInterval = cron.schedule('*/10 * * * *', () => {
      this.fetchAndPostMaddenNews();
    });

    logger.info('News feeds started (every 10 minutes) - only posting articles published after bot start');
  }

  async shutdown() {
    if (this.nflInterval) {
      this.nflInterval.destroy();
    }
    if (this.maddenInterval) {
      this.maddenInterval.destroy();
    }
    logger.info('News feeds shutdown complete');
  }
}