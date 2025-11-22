
export enum PresentationStyle {
  Cyberpunk = "Cyberpunk",
  Corporate = "Corporate",
  Minimalist = "Minimalist",
  Futuristic = "Futuristic",
  Nature = "Nature"
}

export type TransitionStyle = 'fade' | 'zoom' | 'hologram' | 'shutter';

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
}

export interface Presentation {
  topic: string;
  style: PresentationStyle;
  title: string;
  author: string;
  slides: Slide[];
}

export interface GenerationParams {
  topic: string;
  style: PresentationStyle;
  fileContext?: string; // Content from uploaded file
  slideCount: number;
}
