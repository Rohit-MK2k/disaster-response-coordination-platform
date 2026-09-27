export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

export * from './errors';
export * from './disasters';
