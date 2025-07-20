import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { DataStore } from '../utils/dataStore.js';
import cron from 'node-cron';

export class ActivityTracker {
  constructor(client) {
    this.client = client;
    this.dataStore = new DataStore();
    this.activityData = {};
    this.checkInterval = null;
  }

  async initialize() {
    try {
      // Load existing activity data
      this.activityData = await this.dataStore.load();
      
      // Start auto-save
      this.dataStore.startAutoSave(this.activityData);
      
      logger.info(`Activity tracker initialized with ${Object.keys(this.activityData.userActivity || {}).length} tracked users`);
    } catch (error) {
      logger.error('Failed to initialize activity tracker:', error);
      this.activityData = { userActivity: {}, lastSave: Date.now() };
    }
  }

  async updateUserActivity(userId, guildId) {
    try {
      if (!this.activityData.userActivity) {
        this.activityData.userActivity = {};
      }

      const key = `${guildId}-${userId}`;
      this.activityData.userActivity[key] = {
        userId,
        guildId,
        lastActivity: Date.now(),
        lastUpdated: new Date().toISOString()
      };

      // Reduced logging - only log 1% of updates for performance
      if (Math.random() < 0.01) {
        logger.debug(`Activity tracking working - ${userId} updated`);
      }
    } catch (error) {
      logger.error('Error updating user activity:', error);
    }
  }

  async checkInactiveUsers() {
    try {
      const guild = this.client.guilds.cache.get(config.discord.guildId);
      if (!guild) return;

      const maddenRole = guild.roles.cache.get(config.roles.maddenLeague);
      const activeRole = guild.roles.cache.get(config.roles.active);
      const inactiveRole = guild.roles.cache.get(config.roles.inactive);

      if (!maddenRole || !activeRole || !inactiveRole) {
        logger.warn('Required roles not found for activity check');
        return;
      }

      const now = Date.now();
      const inactiveThreshold = config.activity.inactiveHours * 60 * 60 * 1000; // 26 hours in milliseconds
      let changesCount = 0;

      // Check all members with Madden League role
      const leagueMembers = guild.members.cache.filter(member => 
        member.roles.cache.has(config.roles.maddenLeague) && !member.user.bot
      );

      for (const [memberId, member] of leagueMembers) {
        const key = `${guild.id}-${memberId}`;
        const userData = this.activityData.userActivity[key];
        
        // If no activity data, consider them as needing active role (new member)
        if (!userData) {
          if (!member.roles.cache.has(config.roles.active)) {
            await member.roles.add(activeRole);
            logger.info(`Added active role to new member: ${member.user.tag}`);
            changesCount++;
          }
          continue;
        }

        const timeSinceLastActivity = now - userData.lastActivity;
        const isCurrentlyActive = member.roles.cache.has(config.roles.active);
        const isCurrentlyInactive = member.roles.cache.has(config.roles.inactive);

        // User should be inactive (26+ hours since last message)
        if (timeSinceLastActivity >= inactiveThreshold) {
          if (isCurrentlyActive) {
            await member.roles.remove(activeRole);
            await member.roles.add(inactiveRole);
            await this.sendInactiveDM(member);
            logger.info(`Moved ${member.user.tag} to inactive (${Math.round(timeSinceLastActivity / (60 * 60 * 1000))}h since last activity)`);
            changesCount++;
          }
        } 
        // User should be active (less than 26 hours since last message)
        else {
          if (isCurrentlyInactive) {
            await member.roles.remove(inactiveRole);
            await member.roles.add(activeRole);
            await this.sendActiveDM(member);
            logger.info(`Moved ${member.user.tag} back to active`);
            changesCount++;
          } else if (!isCurrentlyActive && !isCurrentlyInactive) {
            // Member has no active/inactive role, give them active
            await member.roles.add(activeRole);
            logger.info(`Added active role to ${member.user.tag}`);
            changesCount++;
          }
        }
      }

      if (changesCount > 0) {
        logger.info(`Activity check complete: ${changesCount} role changes made`);
      }

    } catch (error) {
      logger.error('Error during activity check:', error);
    }
  }

  async sendInactiveDM(member) {
    try {
      const embed = {
        color: 0xff6b35,
        title: '😴 You\'ve Been Marked as Inactive',
        description: `Hey ${member.user.username}, you haven't been active in the Gridiron Fantasy League server for over 26 hours.`,
        fields: [
          {
            name: '🔄 How to Get Back to Active',
            value: 'Simply send a message in any channel and you\'ll automatically be marked as active again!',
            inline: false
          },
          {
            name: '🏈 Stay Engaged',
            value: 'Keep participating in league discussions to maintain your active status.',
            inline: false
          }
        ],
        footer: {
          text: 'Gridiron Fantasy League Bot',
          icon_url: 'https://i.imgur.com/hU7ulOM.png'
        },
        timestamp: new Date().toISOString()
      };

      await member.send({ embeds: [embed] });
    } catch (error) {
      logger.debug(`Could not send inactive DM to ${member.user.tag}: ${error.message}`);
    }
  }

  async sendActiveDM(member) {
    try {
      const embed = {
        color: 0x10b981,
        title: '🎉 Welcome Back to Active Status!',
        description: `Great to see you back, ${member.user.username}! You've been marked as active again.`,
        fields: [
          {
            name: '🏈 You\'re Back in the Game',
            value: 'Your active participation keeps our league strong and competitive!',
            inline: false
          },
          {
            name: '💪 Keep It Up',
            value: 'Stay engaged to maintain your active status in the league.',
            inline: false
          }
        ],
        footer: {
          text: 'Gridiron Fantasy League Bot',
          icon_url: 'https://i.imgur.com/hU7ulOM.png'
        },
        timestamp: new Date().toISOString()
      };

      await member.send({ embeds: [embed] });
    } catch (error) {
      logger.debug(`Could not send active DM to ${member.user.tag}: ${error.message}`);
    }
  }

  startActivityCheck() {
    // Check every 30 minutes for better responsiveness while staying lightweight
    this.checkInterval = cron.schedule('*/30 * * * *', () => {
      this.checkInactiveUsers();
    });
    
    logger.info('Activity checker started (every 30 minutes)');
  }

  async cleanupOldData() {
    try {
      if (!this.activityData.userActivity) return;

      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;

      for (const [key, userData] of Object.entries(this.activityData.userActivity)) {
        if (userData.lastActivity < thirtyDaysAgo) {
          delete this.activityData.userActivity[key];
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await this.dataStore.save(this.activityData);
        logger.info(`Cleaned up ${cleanedCount} old activity records`);
      }
    } catch (error) {
      logger.error('Error cleaning up old data:', error);
    }
  }

  async shutdown() {
    if (this.checkInterval) {
      this.checkInterval.destroy();
    }
    this.dataStore.stopAutoSave();
    await this.dataStore.save(this.activityData);
    logger.info('Activity tracker shutdown complete');
  }
}