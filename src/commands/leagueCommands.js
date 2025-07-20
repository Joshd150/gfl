import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import Parser from 'rss-parser';

export const leagueCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('inactive')
      .setDescription('Show all inactive league members'),
    async execute(interaction) {
      try {
        const guild = interaction.guild;
        
        // Ensure we have all members cached
        await guild.members.fetch();
        
        const inactiveRole = guild.roles.cache.get(config.roles.inactive);
        const maddenRole = guild.roles.cache.get(config.roles.maddenLeague);
        const activeRole = guild.roles.cache.get(config.roles.active);

        if (!inactiveRole || !maddenRole || !activeRole) {
          return await interaction.reply({
            content: '❌ Required roles not found. Please check bot configuration.',
            ephemeral: true
          });
        }

        // Debug logging
        logger.info(`Checking roles - Madden: ${maddenRole ? maddenRole.name : 'NOT FOUND'}, Active: ${activeRole ? activeRole.name : 'NOT FOUND'}, Inactive: ${inactiveRole ? inactiveRole.name : 'NOT FOUND'}`);
        logger.info(`Role IDs from config - Madden: ${config.roles.maddenLeague}, Active: ${config.roles.active}, Inactive: ${config.roles.inactive}`);
        logger.info(`Total guild members: ${guild.memberCount}, Non-bot members: ${guild.members.cache.filter(m => !m.user.bot).size}`);
        
        const inactiveMembers = guild.members.cache.filter(member => 
          member.roles.cache.has(config.roles.maddenLeague) && 
          member.roles.cache.has(config.roles.inactive) &&
          !member.user.bot
        );

        // Also check for members with Madden role but no active/inactive role
        const unassignedMembers = guild.members.cache.filter(member => 
          member.roles.cache.has(config.roles.maddenLeague) && 
          !member.roles.cache.has(config.roles.active) && 
          !member.roles.cache.has(config.roles.inactive) &&
          !member.user.bot
        );

        logger.info(`Found ${inactiveMembers.size} inactive members and ${unassignedMembers.size} unassigned members`);

        const embed = new EmbedBuilder()
          .setColor(0xff6b35)
          .setTitle('📋 Inactive League Members')
          .setDescription(`**Debug Info:**\n• Madden Role: ${maddenRole ? maddenRole.name : 'NOT FOUND'} (${maddenRole ? maddenRole.members.size : 0} members)\n• Active Role: ${activeRole ? activeRole.name : 'NOT FOUND'} (${activeRole ? activeRole.members.size : 0} members)\n• Inactive Role: ${inactiveRole ? inactiveRole.name : 'NOT FOUND'} (${inactiveRole ? inactiveRole.members.size : 0} members)\n\n` +
            (inactiveMembers.size === 0 && unassignedMembers.size === 0 ? 
            '🎉 All league members are currently active!' : 
            `Found ${inactiveMembers.size} inactive member(s) and ${unassignedMembers.size} unassigned member(s):`))
          .setFooter({ 
            text: 'Gridiron Fantasy League Bot',
            iconURL: 'https://i.imgur.com/hU7ulOM.png'
          })
          .setTimestamp();

        if (inactiveMembers.size > 0) {
          const memberList = inactiveMembers
            .map(member => `• **${member.user.username}** (${member.user.tag})`)
            .join('\n');

          embed.addFields({
            name: `😴 Inactive Members (${inactiveMembers.size})`,
            value: memberList.length > 1024 ? memberList.substring(0, 1021) + '...' : memberList,
            inline: false
          });
        }

        if (unassignedMembers.size > 0) {
          const unassignedList = unassignedMembers
            .map(member => `• **${member.user.username}** (${member.user.tag})`)
            .join('\n');

          embed.addFields({
            name: `❓ Unassigned Members (${unassignedMembers.size})`,
            value: unassignedList.length > 1024 ? unassignedList.substring(0, 1021) + '...' : unassignedList,
            inline: false
          });
        }

        if (inactiveMembers.size > 0 || unassignedMembers.size > 0) {
          embed.addFields({
            name: '💡 Note',
            value: `Members become inactive after ${config.activity.inactiveHours} hours of no activity. Unassigned members need active/inactive role assignment.`,
            inline: false
          });
        }

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        logger.error('Error in inactive command:', error);
        await interaction.reply({
          content: '❌ An error occurred while fetching inactive members.',
          ephemeral: true
        });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('active')
      .setDescription('Show all active league members'),
    async execute(interaction) {
      try {
        const guild = interaction.guild;
        
        // Ensure we have all members cached
        await guild.members.fetch();
        
        const activeRole = guild.roles.cache.get(config.roles.active);
        const maddenRole = guild.roles.cache.get(config.roles.maddenLeague);

        if (!maddenRole || !activeRole) {
          return await interaction.reply({
            content: '❌ Required roles not found. Please check bot configuration.',
            ephemeral: true
          });
        }

        // Get all members with Madden League role first
        const leagueMembers = guild.members.cache.filter(member => 
          member.roles.cache.has(config.roles.maddenLeague) && !member.user.bot
        );

        // Filter league members who also have active role
        const activeMembers = leagueMembers.filter(member => 
          member.roles.cache.has(config.roles.active)
        );
        
        logger.info(`Found ${activeMembers.size} active members out of ${leagueMembers.size} total league members`);

        const embed = new EmbedBuilder()
          .setColor(0x10b981)
          .setTitle('✅ Active League Members')
          .setDescription(`**Debug Info:**\n• Madden Role: ${maddenRole ? maddenRole.name : 'NOT FOUND'} (${maddenRole ? maddenRole.members.size : 0} members)\n• Active Role: ${activeRole ? activeRole.name : 'NOT FOUND'} (${activeRole ? activeRole.members.size : 0} members)\n\nFound ${activeMembers.size} active member(s):`)
          .setFooter({ 
            text: 'Gridiron Fantasy League Bot',
            iconURL: 'https://i.imgur.com/hU7ulOM.png'
          })
          .setTimestamp();

        if (activeMembers.size > 0) {
          const memberList = activeMembers
            .map(member => `• **${member.user.username}** (${member.user.tag})`)
            .join('\n');

          embed.addFields({
            name: `👥 Active Members (${activeMembers.size})`,
            value: memberList.length > 1024 ? memberList.substring(0, 1021) + '...' : memberList,
            inline: false
          });
        } else {
          embed.addFields({
            name: '👥 Active Members (0)',
            value: 'No active members found. Check role assignments.',
            inline: false
          });
        }

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        logger.error('Error in active command:', error);
        await interaction.reply({
          content: '❌ An error occurred while fetching active members.',
          ephemeral: true
        });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('league-stats')
      .setDescription('Show league member statistics'),
    async execute(interaction) {
      try {
        const guild = interaction.guild;
        
        // Ensure we have all members cached
        await guild.members.fetch();
        
        const maddenRole = guild.roles.cache.get(config.roles.maddenLeague);
        const activeRole = guild.roles.cache.get(config.roles.active);
        const inactiveRole = guild.roles.cache.get(config.roles.inactive);

        if (!maddenRole || !activeRole || !inactiveRole) {
          return await interaction.reply({
            content: '❌ Required roles not found. Please check bot configuration.',
            ephemeral: true
          });
        }

        // Get all league members first
        const leagueMembers = guild.members.cache.filter(member => 
          member.roles.cache.has(config.roles.maddenLeague) && 
          !member.user.bot
        );
        const totalMembers = leagueMembers.size;
        
        // Debug logging with role ID verification
        logger.info(`Checking for Madden League role ID: ${config.roles.maddenLeague}`);
        logger.info(`Madden League role found: ${maddenRole ? maddenRole.name : 'NOT FOUND'}`);
        logger.info(`Total guild members: ${guild.memberCount}`);
        logger.info(`Cached guild members: ${guild.members.cache.size}`);
        logger.info(`Non-bot cached members: ${guild.members.cache.filter(m => !m.user.bot).size}`);
        logger.info(`League members found: ${leagueMembers.size}`);
        logger.info(`Active role: ${activeRole.name} (${activeRole.members.size} total members)`);
        
        // Filter league members by their activity roles
        const activeMembers = leagueMembers.filter(member => 
          member.roles.cache.has(config.roles.active)
        );
        const activeMembersCount = activeMembers.size;
        
        logger.info(`Active league members: ${activeMembersCount}`);

        const inactiveMembers = leagueMembers.filter(member => 
          member.roles.cache.has(config.roles.inactive)
        ).size;

        const unassignedMembers = leagueMembers.filter(member => 
          !member.roles.cache.has(config.roles.active) && 
          !member.roles.cache.has(config.roles.inactive)
        ).size;
        
        const activityRate = totalMembers > 0 ? Math.round((activeMembersCount / totalMembers) * 100) : 0;

        // Additional Discord stats
        const totalServerMembers = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(member => 
          member.presence?.status === 'online' && !member.user.bot
        ).size;
        const serverBoosts = guild.premiumSubscriptionCount || 0;
        const serverLevel = guild.premiumTier;
        const channelCount = guild.channels.cache.size;
        const roleCount = guild.roles.cache.size;
        const emojiCount = guild.emojis.cache.size;
        
        // Voice channel stats
        const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2);
        const membersInVoice = voiceChannels.reduce((total, channel) => total + channel.members.size, 0);
        
        // Recent activity (last 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentJoins = guild.members.cache.filter(member => 
          member.joinedTimestamp > sevenDaysAgo && !member.user.bot
        ).size;

        // Bot uptime
        const uptime = process.uptime();
        const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;

        const embed = new EmbedBuilder()
          .setColor(0x1e40af)
          .setTitle('📊 League Statistics')
          .setDescription('Current league member activity overview')
          .addFields(
            {
              name: '👥 Total League Members',
              value: totalMembers.toString(),
              inline: true
            },
            {
              name: '✅ Active Members',
              value: activeMembersCount.toString(),
              inline: true
            },
            {
              name: '😴 Inactive Members',
              value: inactiveMembers.toString(),
              inline: true
            },
            {
              name: '❓ Unassigned Members',
              value: unassignedMembers.toString(),
              inline: true
            },
            {
              name: '📊 Activity Rate',
              value: `${activityRate}%`,
              inline: true
            },
            {
              name: '⏰ Activity Threshold',
              value: `${config.activity.inactiveHours} hours`,
              inline: true
            },
            {
              name: '💾 Data Persistence',
              value: 'Activity data is automatically saved and restored on bot restart',
              inline: false
            }
          )
          .setFooter({ 
            text: 'Gridiron Fantasy League Bot',
            iconURL: 'https://i.imgur.com/hU7ulOM.png'
          })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        logger.error('Error in league-stats command:', error);
        await interaction.reply({
          content: '❌ An error occurred while fetching league statistics.',
          ephemeral: true
        });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('bot-info')
      .setDescription('Show bot information and status'),
    async execute(interaction) {
      try {
        // Check if user has admin permissions
        if (!interaction.member.permissions.has('Administrator')) {
          return await interaction.reply({
            content: '❌ You need Administrator permissions to use this command.',
            ephemeral: true
          });
        }

        const guild = interaction.guild;
        
        // Ensure we have all members cached
        await guild.members.fetch();
        
        // Debug: Check if guild members are cached
        logger.info(`Guild member cache size: ${guild.members.cache.size}`);
        
        const uptime = process.uptime();
        const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
        
        const leagueMembers = guild.members.cache.filter(m => 
          m.roles.cache.has(config.roles.maddenLeague) && !m.user.bot
        );
        
        logger.info(`Bot-info command - League members found: ${leagueMembers.size}`);

        const embed = new EmbedBuilder()
          .setColor(0x1e40af)
          .setTitle('🤖 Bot Information')
          .setDescription('Gridiron Fantasy League Discord Bot Status')
          .addFields(
            {
              name: '⏱️ Uptime',
              value: uptimeString,
              inline: true
            },
            {
              name: '📊 Server',
              value: guild.name,
              inline: true
            },
            {
              name: '👥 Members Monitored',
              value: leagueMembers.size.toString(),
              inline: true
            },
            {
              name: '🔧 Features',
              value: '• Activity Tracking\n• Welcome System\n• News Feeds\n• Role Management\n• League Statistics',
              inline: false
            }
          )
          .setThumbnail('https://i.imgur.com/hU7ulOM.png')
          .setFooter({ 
            text: 'Gridiron Fantasy League Bot',
            iconURL: 'https://i.imgur.com/hU7ulOM.png'
          })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        logger.error('Error in bot-info command:', error);
        await interaction.reply({
          content: '❌ An error occurred while fetching bot information.',
          ephemeral: true
        });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('force-active')
      .setDescription('Force a user to be active (Admin only)')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to mark as active')
          .setRequired(true)
      ),
    async execute(interaction) {
      try {
        // Check if user has admin permissions
        if (!interaction.member.permissions.has('Administrator')) {
          return await interaction.reply({
            content: '❌ You need Administrator permissions to use this command.',
            ephemeral: true
          });
        }

        const targetUser = interaction.options.getUser('user');
        const targetMember = interaction.guild.members.cache.get(targetUser.id);

        if (!targetMember) {
          return await interaction.reply({
            content: '❌ User not found in this server.',
            ephemeral: true
          });
        }

        const activeRole = interaction.guild.roles.cache.get(config.roles.active);
        const inactiveRole = interaction.guild.roles.cache.get(config.roles.inactive);

        if (!targetMember.roles.cache.has(config.roles.maddenLeague)) {
          return await interaction.reply({
            content: '❌ User is not a league member.',
            ephemeral: true
          });
        }

        // Remove inactive role and add active role
        if (targetMember.roles.cache.has(config.roles.inactive)) {
          await targetMember.roles.remove(inactiveRole);
        }
        if (!targetMember.roles.cache.has(config.roles.active)) {
          await targetMember.roles.add(activeRole);
        }

        const embed = new EmbedBuilder()
          .setColor(0x10b981)
          .setTitle('✅ User Activated')
          .setDescription(`**Debug Info:**\n• Total League Members: ${leagueMembers.size}\n• Active Role Members: ${activeRole.members.size}\n• Active League Members: ${activeMembers.size}\n\nFound ${activeMembers.size} active member(s):`)
          .setFooter({ 
            text: `Action performed by ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        logger.info(`${interaction.user.tag} forced ${targetUser.tag} to active status`);
      } catch (error) {
        logger.error('Error in force-active command:', error);
        await interaction.reply({
          content: '❌ An error occurred while updating user status.',
          ephemeral: true
        });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('test-rss')
      .setDescription('Test RSS feeds and show latest articles (Admin only)')
      .addStringOption(option =>
        option.setName('feed')
          .setDescription('Which feed to test')
          .setRequired(true)
          .addChoices(
            { name: 'NFL News', value: 'nfl' },
            { name: 'Madden News', value: 'madden' },
            { name: 'Both', value: 'both' }
          )
      ),
    async execute(interaction) {
      try {
        // Check if user has admin permissions
        if (!interaction.member.permissions.has('Administrator')) {
          return await interaction.reply({
            content: '❌ You need Administrator permissions to use this command.',
            ephemeral: true
          });
        }

        const feedType = interaction.options.getString('feed');
        
        await interaction.reply({ 
          content: '🔄 Testing RSS feeds... This may take a moment.',
          ephemeral: true 
        });

        const parser = new Parser();
        const results = [];

        try {
          if (feedType === 'nfl' || feedType === 'both') {
            if (!config.rss.nflUrl) {
              throw new Error('NFL RSS URL not configured in environment variables');
            }
            
            logger.info(`Testing NFL RSS feed: ${config.rss.nflUrl}`);
            const nflFeed = await parser.parseURL(config.rss.nflUrl);
            
            const latestNfl = nflFeed.items[0];
            
            if (latestNfl) {
              const nflEmbed = {
                color: 0x013369,
                title: `🏈 Latest NFL News (Test)`,
                description: latestNfl.title.substring(0, 256),
                url: latestNfl.link,
                fields: [
                  {
                    name: '📰 Source',
                    value: 'ESPN NFL',
                    inline: true
                  },
                  {
                    name: '📅 Published',
                    value: new Date(latestNfl.pubDate).toLocaleDateString(),
                    inline: true
                  },
                  {
                    name: '📊 Feed Status',
                    value: `✅ Working - Found ${nflFeed.items.length} articles`,
                    inline: false
                  }
                ],
                footer: {
                  text: 'NFL RSS Test',
                  icon_url: 'https://i.imgur.com/hU7ulOM.png'
                },
                timestamp: new Date(latestNfl.pubDate).toISOString()
              };
              
              if (latestNfl.contentSnippet) {
                nflEmbed.description += `\n\n${latestNfl.contentSnippet.substring(0, 300)}...`;
              }
              
              results.push(nflEmbed);
            }
          }

          if (feedType === 'madden' || feedType === 'both') {
            if (!config.rss.maddenUrl) {
              throw new Error('Madden RSS URL not configured in environment variables');
            }
            
            logger.info(`Testing Madden RSS feed: ${config.rss.maddenUrl}`);
            const maddenFeed = await parser.parseURL(config.rss.maddenUrl);
            
            const latestMadden = maddenFeed.items[0];
            
            if (latestMadden) {
              const maddenEmbed = {
                color: 0xea580c,
                title: `🎮 Latest Madden News (Test)`,
                description: latestMadden.title.substring(0, 256),
                url: latestMadden.link,
                fields: [
                  {
                    name: '📰 Source',
                    value: 'EA Sports',
                    inline: true
                  },
                  {
                    name: '📅 Published',
                    value: new Date(latestMadden.pubDate).toLocaleDateString(),
                    inline: true
                  },
                  {
                    name: '📊 Feed Status',
                    value: `✅ Working - Found ${maddenFeed.items.length} articles`,
                    inline: false
                  }
                ],
                footer: {
                  text: 'Madden RSS Test',
                  icon_url: 'https://i.imgur.com/hU7ulOM.png'
                },
                timestamp: new Date(latestMadden.pubDate).toISOString()
              };
              
              if (latestMadden.contentSnippet) {
                maddenEmbed.description += `\n\n${latestMadden.contentSnippet.substring(0, 300)}...`;
              }
              
              results.push(maddenEmbed);
            }
          }

          if (results.length > 0) {
            await interaction.followUp({ 
              content: `📡 RSS Feed Test Results for **${feedType.toUpperCase()}**:`,
              embeds: results,
              ephemeral: true
            });
          } else {
            await interaction.followUp({
              content: '❌ No articles found in the selected feed(s). Check the RSS URLs in your configuration.',
              ephemeral: true
            });
          }

        } catch (rssError) {
          logger.error('RSS feed test error:', rssError);
          await interaction.followUp({
            content: `❌ RSS Feed Error: ${rssError.message}\n\nCheck your RSS URLs in the .env file:\n• NFL: \`${config.rss.nflUrl}\`\n• Madden: \`${config.rss.maddenUrl}\``,
            ephemeral: true
          });
        }

      } catch (error) {
        logger.error('Error in test-rss command:', error);
        await interaction.followUp({
          content: '❌ An error occurred while testing RSS feeds.',
          ephemeral: true
        });
      }
    }
  }
];