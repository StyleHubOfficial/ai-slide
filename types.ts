
export enum PresentationStyle {
  Blackboard = "Blackboard",
  Whiteboard = "Whiteboard",
  Notebook = "Notebook",
  Blueprint = "Blueprint",
  DigitalPad = "Digital Pad"
}

export type TransitionStyle = 'fade' | 'zoom' | 'hologram' | 'shutter' | 'glitch' | 'cube';

export type SlideType = 'title' | 'content' | 'chart' | 'table' | 'process';

export type AiModelId = 'gemini-2.5-flash' | 'gemini-flash-lite-latest' | 'gemini-3-pro-preview' | 'gemini-2.5-flash-image';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
  type: 'bar' | 'line' | 'pie';
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ProcessStep {
  title: string;
  description: string;
  icon?: string;
}

export interface Slide {
  id: string;
  type: SlideType;
  title: string;
  subtitle?: string;
  bulletPoints?: string[];
  chartData?: ChartData;
  tableData?: TableData;
  processSteps?: ProcessStep[];
  backgroundImageKeyword?: string; 
  imagePrompt?: string; // AI Image Generation Prompt
  layout?: 'left' | 'right' | 'center' | 'split';
  speakerNotes?: string; 
}

export interface Presentation {
  topic: string;
  style: PresentationStyle;
  title: string;
  author: string;
  slides: Slide[];
}

// Community Feature Types
export interface SharedPresentation extends Presentation {
  id: string;
  likes: number;
  downloads: number;
  sharedBy: string;
  dateShared: string;
}

export interface GenerationParams {
  topic: string;
  style: PresentationStyle;
  fileContext?: string; 
  slideCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: string[];
  timestamp: number;
}
