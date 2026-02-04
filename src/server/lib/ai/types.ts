export type AIGenerateParams = {
  prompt: string;
  mediaDataUri?: string; // for PDFs
};

export type AIGenerateResult = {
  text: string;
  status?: number;
};

export interface AIProvider {
  name: string;
  generate(p: AIGenerateParams): Promise<AIGenerateResult>;
}

export class AIError extends Error {
  status?: number;
  provider?: string;
  constructor(message: string, status?: number, provider?: string) {
    super(message);
    this.status = status;
    this.provider = provider;
  }
}