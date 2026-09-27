import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ReportsSourcePort } from '@drp/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POOL_FILE = path.resolve(__dirname, '../../data/mock-twitter-feed-pool.json');

export class MockSocialFeedAdapter implements ReportsSourcePort {
  async fetchRawReports(): Promise<any[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Simulate 10% failure rate
    if (Math.random() < 0.1) {
      throw new Error('Simulated upstream API timeout');
    }

    try {
      const data = await fs.readFile(POOL_FILE, 'utf-8');
      const pool = JSON.parse(data);
      
      // Shuffle pool and take a random sample of 150 tweets
      const sampleSize = 150;
      const shuffled = pool.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, sampleSize);

      // Mutate timestamps to simulate live data
      const nowMs = Date.now();
      return selected.map((tweet: any) => ({
        ...tweet,
        // Spread the tweets out over the last 60 seconds
        created_at: new Date(nowMs - Math.floor(Math.random() * 60000)).toISOString()
      }));
    } catch (e) {
      console.error('Failed to read mock pool file:', e);
      return [];
    }
  }
}
