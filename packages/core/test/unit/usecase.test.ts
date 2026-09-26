import { describe, it, expect } from 'vitest';
import { UseCase } from '../../src/index';

// Mock Port
interface MockPort {
  getData(): string;
}

// Mock UseCase implementation
class MockUseCase implements UseCase<string, string> {
  constructor(private port: MockPort) {}

  async execute(input: string): Promise<string> {
    const data = this.port.getData();
    return `${input} - ${data}`;
  }
}

// Factory function
const createMockUseCase = (port: MockPort) => new MockUseCase(port);

describe('Core Architecture: Dependency Injection & UseCase Contract', () => {
  it('should successfully instantiate when provided with mocked dependencies (Ports)', () => {
    const mockPort: MockPort = { getData: () => 'mock data' };
    const useCase = createMockUseCase(mockPort);
    expect(useCase).toBeInstanceOf(MockUseCase);
  });

  it('should correctly execute the execute() method and return the expected output', async () => {
    const mockPort: MockPort = { getData: () => 'mock data' };
    const useCase = createMockUseCase(mockPort);
    
    const result = await useCase.execute('test input');
    expect(result).toBe('test input - mock data');
  });
});
