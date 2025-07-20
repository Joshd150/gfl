# 🏈 Gridiron Fantasy League Discord Bot

A comprehensive Discord bot designed specifically for managing Madden Fantasy Leagues with advanced features for activity tracking, welcome systems, and news feeds.

## ✨ Features

### Core Functionality
- **Persistent Data Storage**: Activity tracking survives bot restarts
- **Activity Tracking**: Automatically manages active/inactive roles based on user activity (26-hour threshold)
- **Welcome System**: Custom embeds and DMs for new league members
- **Auto-Role Assignment**: Assigns roles to new server members
- **News Feeds**: Automated NFL and Madden news via RSS feeds
- **Direct Messaging**: Comprehensive DM system for notifications
- **Slash Commands**: Complete command system for league management

### Advanced Features
- **Data Persistence**: JSON-based storage ensures no data loss on restarts
- **Smart Role Management**: Seamless transitions between active/inactive states
- **Rich Embeds**: Professional-looking messages with team branding
- **Error Handling**: Robust error logging and recovery
- **Modular Architecture**: Clean, maintainable code structure
- **Admin Controls**: Force role changes and view detailed statistics
- **Auto-Cleanup**: Automatically removes old activity data (30+ days)

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js 18.0.0 or higher
- A Discord application with bot token
- Server Administrator permissions

### 2. Installation
```bash
npm install
```

### 3. Configuration
1. Copy `.env.example` to `.env`
2. Fill in all required values:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_server_id_here

# Channel IDs (right-click channels in Discord and copy ID)
WELCOME_CHANNEL_ID=channel_id_here
NFL_NEWS_CHANNEL_ID=channel_id_here
MADDEN_NEWS_CHANNEL_ID=channel_id_here
RULES_CHANNEL_ID=channel_id_here
TEAMS_CHANNEL_ID=channel_id_here
LEAGUE_CHANNEL_ID=channel_id_here

# Role IDs (right-click roles in Discord and copy ID)
MADDEN_LEAGUE_ROLE_ID=role_id_here
ACTIVE_ROLE_ID=role_id_here
INACTIVE_ROLE_ID=role_id_here
AUTO_ASSIGN_ROLE_ID=role_id_here
```

### 4. Running the Bot
```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

## 🎮 Available Slash Commands

### For All Users
- `/inactive` - Show all inactive league members
- `/active` - Show all active league members  
- `/league-stats` - Display comprehensive league statistics
- `/bot-info` - Show bot information and status

### Admin Only
- `/force-active @user` - Force a specific user to be marked as active
- `/test-rss [feed]` - Test RSS feeds and show latest articles (choose NFL, Madden, or Both)

## 📋 Bot Permissions Required

Your bot needs these permissions:
- Manage Roles
- Send Messages
- Embed Links
- Read Message History
- Use External Emojis
- Add Reactions
- Send Messages in Threads
- Use Slash Commands

## 🔧 How It Works

### Activity Tracking
- Monitors users with the Madden League role
- Tracks last message time for each user
- Automatically switches between active/inactive roles after 26 hours
- Sends DM notifications when users become inactive
- Sends DM notifications when users become inactive

### Welcome System
- Triggers when users receive the Madden League role
- Can be toggled on/off with WELCOME_EMBEDS_ENABLED setting
- Only sends welcomes to members who join after the system is enabled
- Sends rich embed welcome message to designated channel
- Sends personalized DM to new members
- Auto-assigns active role to new league members

### News Feeds
- Fetches NFL news every 30 minutes
- Fetches Madden news every hour
- Posts rich embeds with article previews
- Includes thumbnails and publication dates

## 💡 Additional Feature Suggestions

Based on your league needs, consider adding:

### 🎮 Game Management
- **Match Scheduling**: Calendar integration for game schedules
- **Score Tracking**: Automated score reporting and leaderboards
- **Playoff Brackets**: Visual tournament bracket generation

### 📊 Statistics & Analytics
- **Player Stats**: Individual and team performance tracking
- **Season Records**: Win/loss tracking with historical data
- **Draft Management**: Snake draft automation and pick tracking

### 🏆 Competition Features
- **Weekly Challenges**: Mini-games and prediction contests
- **Power Rankings**: Automated team ranking system
- **Awards System**: Season MVP, ROTY, etc. voting

### 🔔 Communication
- **Game Reminders**: Automated DMs for upcoming games
- **Trade Notifications**: Alert system for trade proposals
- **Commissioner Tools**: Bulk messaging and announcements

### 📱 Integration
- **Twitch Integration**: Stream notifications for league games
- **Fantasy Platform Sync**: ESPN/Yahoo fantasy league integration
- **Calendar Sync**: Google Calendar integration for schedules

### 🎯 Engagement
- **Reaction Roles**: Self-assign team/position roles
- **Polls & Voting**: League decision making tools
- **Trivia Bot**: NFL/Madden knowledge contests

## 🐛 Troubleshooting

### Common Issues
1. **Bot not responding**: Check token and permissions
2. **Roles not updating**: Verify role IDs in configuration
3. **News feeds not working**: Check RSS URLs and channel permissions
4. **DMs not sending**: Ensure users allow DMs from server members
5. **Data not persisting**: Check file permissions in the data/ directory

### Logging
Set `LOG_LEVEL=debug` in your `.env` file for detailed logging.

### Data Storage
- Activity data is stored in `data/botData.json`
- Data is auto-saved every 5 minutes
- Old activity records (30+ days) are automatically cleaned up
- Manual backup recommended for important league data

## 📝 License

This project is open source and available under the MIT License.

---

**Ready to dominate the gridiron? Let's get this bot running! 🏈**