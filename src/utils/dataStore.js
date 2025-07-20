import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

export class DataStore {
  constructor() {
    this.dataDir = 'data';
    this.dataFile = path.join(this.dataDir, 'botData.json');
    this.saveInterval = null;
  }

  async ensureDataDir() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
      logger.info('Created data directory');
    }
  }

  async load() {
    try {
      await this.ensureDataDir();
      const data = await fs.readFile(this.dataFile, 'utf8');
      const parsed = JSON.parse(data);
      logger.info('Loaded bot data from storage');
      return parsed;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('No existing data file found, starting fresh');
        return { userActivity: {}, lastSave: Date.now() };
      }
      logger.error('Error loading data:', error);
      return { userActivity: {}, lastSave: Date.now() };
    }
  }

  async save(data) {
    try {
      await this.ensureDataDir();
      data.lastSave = Date.now();
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
      logger.debug('Bot data saved to storage');
    } catch (error) {
      logger.error('Error saving data:', error);
    }
  }

  startAutoSave(data) {
    // Auto-save every 10 minutes for lightweight performance
    this.saveInterval = setInterval(() => {
      this.save(data);
    }, 10 * 60 * 1000);
    
    logger.info('Auto-save started (every 10 minutes)');
  }

  stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
      logger.info('Auto-save stopped');
    }
  }
}