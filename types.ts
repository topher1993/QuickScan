export interface ExtractedData {
  name: string;
  phoneNumber: string;
  amount: number;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ProcessingResult {
  data: ExtractedData | null;
  rawText?: string;
}