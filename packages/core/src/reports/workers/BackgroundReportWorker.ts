import { Report } from '@drp/shared-types';
import { CachePort } from '../../disasters/ports/CachePort';
import { ReportsSourcePort } from '../ports/ReportsSourcePort';

export class BackgroundReportWorker {
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(
    private reportsSource: ReportsSourcePort,
    private cache: CachePort
  ) {}

  public start(intervalMs: number) {
    this.fetchAndCache();
    this.intervalId = setInterval(() => this.fetchAndCache(), intervalMs);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  public async fetchAndCache(): Promise<void> {
    try {
      const rawPayload = await this.reportsSource.fetchRawReports();
      const normalized = this.normalize(rawPayload);
      await this.cache.set('global_reports_feed', normalized, 120);
      console.log(`[Worker] Successfully cached ${normalized.length} reports.`);
    } catch (error) {
      console.warn(`[Worker] External API failed. Will try again next interval.`);
    }
  }

  private normalize(raw: any[]): Report[] {
    return raw.map((r) => ({
      id: r.id_str || Math.random().toString(),
      content: r.full_text || '',
      user: r.user?.screen_name || 'Anonymous',
      created_at: r.created_at || new Date().toISOString(),
      _matchData: { 
        location: r.place?.full_name || '', 
        tags: Array.isArray(r.entities?.hashtags) ? r.entities.hashtags.map((h: any) => h.text) : [] 
      },
    }));
  }
}
