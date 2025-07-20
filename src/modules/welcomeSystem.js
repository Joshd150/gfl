import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class WelcomeSystem {
  constructor(client) {
    this.client = client;
  }

  async initialize() {
    logger.info(`Welcome system initialized - notifications ${config.welcome.embedsEnabled ? 'enabled' : 'disabled'}`);
  }

  async sendWelcomeMessage(member) {
    try {
      const guild = member.guild;
      const welcomeChannel = guild.channels.cache.get(config.channels.welcome);
      
      if (!welcomeChannel) {
        logger.error('Welcome channel not found');
        return;
      }

      const embed = {
        color: 0x1e40af,
        title: '🏈 Welcome to the Gridiron Fantasy League!',
        description: `Hey ${member.user.username}! Welcome to the most competitive Madden league on Discord!`,
        thumbnail: {
          url: member.user.displayAvatarURL({ dynamic: true })
        },
        fields: [
          {
            name: '📋 Get Started',
            value: `• Check out <#${config.channels.rules}> for league rules\n• Browse <#${config.channels.teams}> to see available teams\n• Visit <#${config.channels.league}> for league updates`,
            inline: false
          },
          {
            name: '🎮 Ready to Play?',
            value: 'React to this message with 🏈 if you\'re ready to dominate the gridiron!',
            inline: false
          },
          {
            name: '🆘 Need Help?',
            value: 'Feel free to ask questions or DM the commissioners!',
            inline: false
          }
        ],
        image: {
          url: 'https://i.imgur.com/hU7ulOM.png'
        },
        footer: {
          text: 'Gridiron Fantasy League',
          icon_url: guild.iconURL({ dynamic: true })
        },
        timestamp: new Date().toISOString()
      };

      const welcomeMessage = await welcomeChannel.send({ 
        content: `🎉 Everyone welcome ${member} to the league!`,
        embeds: [embed] 
      });
      
      await welcomeMessage.react('🏈');
      
      // Send welcome DM
      await this.sendWelcomeDM(member);
      
      logger.info(`Sent welcome message for ${member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to send welcome message for ${member.user.tag}:`, error);
    }
  }

  async sendWelcomeDM(member) {
    try {
      const embed = {
        color: 0x10b981,
        title: '🏈 Welcome to Gridiron Fantasy League!',
        description: `Thanks for joining our Madden league, ${member.user.username}!`,
        fields: [
          {
            name: '🎯 What\'s Next?',
            value: '• Complete your team selection\n• Review league rules and settings\n• Join the draft when announced\n• Connect with other league members',
            inline: false
          },
          {
            name: '📱 Stay Connected',
            value: 'Make sure to enable notifications for important league updates and game reminders.',
            inline: false
          },
          {
            name: '🏆 Season Goals',
            value: 'Championship spots are limited - bring your A-game and may the best manager win!',
            inline: false
          }
        ],
        footer: {
          text: 'Good luck this season!',
          icon_url: 'https://i.imgur.com/hU7ulOM.png'
        }
      };

      await member.send({ embeds: [embed] });
    } catch (error) {
      logger.error(`Failed to send welcome DM to ${member.user.tag}:`, error);
    }
  }

  async handleMemberJoin(member) {
    try {
      // Auto-assign role if configured
      if (config.roles.autoAssign) {
        const autoRole = member.guild.roles.cache.get(config.roles.autoAssign);
        if (autoRole) {
          await member.roles.add(autoRole);
          logger.info(`Auto-assigned role to ${member.user.tag}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to auto-assign role to ${member.user.tag}:`, error);
    }
  }

  async shutdown() {
    logger.info('Welcome system shutdown complete');
  }
}