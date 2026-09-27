export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

export * from './errors';
export * from './disasters';
export * from './resources';
export * from './reports/ports/ReportsSourcePort';
export * from './reports/utils/ReportMatcher';
export * from './reports/workers/BackgroundReportWorker';
export * from './reports/use-cases/GetDisasterReportsUseCase';