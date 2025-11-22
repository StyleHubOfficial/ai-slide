
export enum PresentationStyle {
  Cyberpunk = "Cyberpunk",
  Corporate = "Corporate",
  Minimalist = "Minimalist",
  Futuristic = "Futuristic",
  Nature = "Nature"
}

export type TransitionStyle = 'fade' | 'zoom' | 'hologram' | 'shutter' | 'glitch' | 'cube';

export type SlideType = 'title' | 'content' | 'chart' | 'table' | 'process';

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