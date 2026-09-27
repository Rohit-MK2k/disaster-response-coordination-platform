import { Report } from '@drp/shared-types';
import { UseCase } from '../../index'; // index has UseCase
import { DisasterRepositoryPort } from '../../disasters/ports/DisasterRepositoryPort';
import { CachePort } from '../../disasters/ports/CachePort';
import { matchReports } from '../utils/ReportMatcher';
import { NotFoundError } from '../../errors';

export interface GetDisasterReportsInput {
  disasterId: string;
  page?: number;
  limit?: number;
}

export interface GetDisasterReportsOutput {
  reports: Report[];
  total: number;
}

export class GetDisasterReportsUseCase implements UseCase<GetDisasterReportsInput, GetDisasterReportsOutput> {
  constructor(
    private disasterRepo: DisasterRepositoryPort,
    private cache: CachePort
  ) {}

  async execute(input: GetDisasterReportsInput): Promise<GetDisasterReportsOutput> {
    const { disasterId, page = 1, limit = 10 } = input;
    const disaster = await this.disasterRepo.findById(disasterId);
    if (!disaster) throw new NotFoundError('Disaster not found');

    const cacheKey = 'global_reports_feed';
    const cached = await this.cache.get<Report[]>(cacheKey);
    const reports = cached || [];

    const matched = matchReports(disaster, reports);
    
    // Sort descending by date so newest reports are at the top
    matched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const startIndex = (page - 1) * limit;
    const paginated = matched.slice(startIndex, startIndex + limit);

    return { reports: paginated, total: matched.length };
  }
}
