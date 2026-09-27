import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetDisasterReportsUseCase } from '../../src/reports/use-cases/GetDisasterReportsUseCase';
import { BackgroundReportWorker } from '../../src/reports/workers/BackgroundReportWorker';
import { matchReports } from '../../src/reports/utils/ReportMatcher';
import { DisasterRepositoryPort, CachePort, ReportsSourcePort, NotFoundError } from '../../src';
import { Disaster, Report } from '@drp/shared-types';

describe('Feature 5: Community Reports', () => {
  const mockDisaster: Disaster = {
    id: '1',
    title: 'Manhattan Flood',
    description: 'A huge flood',
    location_name: 'Manhattan, NYC',
    location_lat: 40.7128,
    location_lng: -74.006,
    tags: ['flood', 'water'],
    status: 'active',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const fakeGlobalReports: Report[] = [
    {
      id: 'r1',
      content: 'Water is rising fast in Manhattan!',
      user: 'alice',
      created_at: new Date().toISOString(),
      _matchData: { location: 'Manhattan', tags: ['flood'] },
    },
    {
      id: 'r2',
      content: 'Just another day in Brooklyn.',
      user: 'bob',
      created_at: new Date().toISOString(),
      _matchData: { location: 'Brooklyn', tags: ['sunny'] },
    },
    {
      id: 'r3',
      content: 'Subway flooded in NYC.',
      user: 'charlie',
      created_at: new Date().toISOString(),
      _matchData: { location: 'NYC', tags: ['water', 'transit'] },
    },
    {
      id: 'r4',
      content: 'Fire in the bronx',
      user: 'dave',
      created_at: new Date().toISOString(),
      _matchData: { location: 'Bronx', tags: ['fire'] },
    },
  ];

  describe('ReportMatcher (Pure Function)', () => {
    it('should match reports if location overlaps AND tags intersect', () => {
      const matched = matchReports(mockDisaster, fakeGlobalReports);
      expect(matched).toHaveLength(2);
      expect(matched.map((r) => r.id)).toEqual(['r1', 'r3']);
    });
  });

  describe('BackgroundReportWorker', () => {
    let worker: BackgroundReportWorker;
    let mockSource: ReportsSourcePort;
    let mockCache: CachePort;

    beforeEach(() => {
      mockSource = { fetchRawReports: vi.fn() };
      mockCache = { get: vi.fn(), set: vi.fn() };
      worker = new BackgroundReportWorker(mockSource, mockCache);
      vi.useFakeTimers();
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      worker.stop();
      vi.restoreAllMocks();
    });

    it('should fetch from source, normalize, and cache data', async () => {
      const rawData = [
        { 
          id_str: 'x1', 
          full_text: 'Hello', 
          user: { screen_name: 'z' }, 
          created_at: '2026', 
          place: { full_name: 'LA' }, 
          entities: { hashtags: [{ text: 'fire' }] } 
        },
      ];
      vi.mocked(mockSource.fetchRawReports).mockResolvedValue(rawData);

      await worker.fetchAndCache();

      expect(mockSource.fetchRawReports).toHaveBeenCalledTimes(1);
      expect(mockCache.set).toHaveBeenCalledTimes(1);
      const setArgs = vi.mocked(mockCache.set).mock.calls[0];
      expect(setArgs[0]).toBe('global_reports_feed');
      expect(setArgs[1]).toHaveLength(1);
      expect(setArgs[1][0].id).toBe('x1');
      expect(setArgs[1][0].content).toBe('Hello');
      expect(setArgs[1][0].user).toBe('z');
      expect(setArgs[1][0]._matchData.location).toBe('LA');
      expect(setArgs[1][0]._matchData.tags).toEqual(['fire']);
    });

    it('should swallow errors and not crash or touch cache if source fails', async () => {
      vi.mocked(mockSource.fetchRawReports).mockRejectedValue(new Error('Network Down'));

      await worker.fetchAndCache(); // Should not throw

      expect(mockSource.fetchRawReports).toHaveBeenCalledTimes(1);
      expect(mockCache.set).not.toHaveBeenCalled(); // Leaves cache alone
    });
  });

  describe('GetDisasterReportsUseCase', () => {
    let useCase: GetDisasterReportsUseCase;
    let mockRepo: DisasterRepositoryPort;
    let mockCache: CachePort;

    beforeEach(() => {
      mockRepo = {
        findById: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findAll: vi.fn(),
      };
      mockCache = { get: vi.fn(), set: vi.fn() };
      useCase = new GetDisasterReportsUseCase(mockRepo, mockCache);
    });

    it('should throw NotFoundError if disaster does not exist', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);
      await expect(useCase.execute({ disasterId: 'x' })).rejects.toThrow(NotFoundError);
    });

    it('should return empty array if cache is empty', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockDisaster);
      vi.mocked(mockCache.get).mockResolvedValue(null); // Cache miss

      const result = await useCase.execute({ disasterId: '1' });
      expect(result.reports).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should read from cache, match, and return paginated results', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockDisaster);
      
      // Let's create 12 matched reports
      const matchedReports: Report[] = Array.from({ length: 12 }).map((_, i) => ({
        id: `m${i}`,
        content: `Flood report ${i}`,
        user: `user${i}`,
        created_at: new Date().toISOString(),
        _matchData: { location: 'Manhattan', tags: ['flood'] },
      }));
      // Plus some noise
      const globalCache = [...matchedReports, fakeGlobalReports[1]]; 
      
      vi.mocked(mockCache.get).mockResolvedValue(globalCache);

      // Page 2, Limit 5 -> Should return indices 5 through 9
      const result = await useCase.execute({ disasterId: '1', page: 2, limit: 5 });

      expect(result.total).toBe(12); // 12 total matched
      expect(result.reports).toHaveLength(5);
      expect(result.reports[0].id).toBe('m5');
      expect(result.reports[4].id).toBe('m9');
    });
  });
});
