export interface TextExtractionPort {
  extract(text: string): Promise<{ title: string; tags: string[]; locationText: string }>;
}
