export interface ISubtitleSegment {
  index: number;
  start: number;
  end: number;
  text: string;
  translatedText?: string;
}

export type ProjectStatus = 'idle' | 'queued' | 'extracting_audio' | 'transcribing' | 'translating' | 'completed' | 'failed';

export interface IVideoProject {
  _id?: string;
  title: string;
  originalFileName: string;
  videoPath: string;
  videoFilePath: string;
  fileSize: number;
  duration: number;
  sourceLanguage: string;
  targetLanguage: string;
  status: ProjectStatus;
  progress: number;
  statusMessage: string;
  originalText: string;
  translatedText: string;
  segments: ISubtitleSegment[];
  errorMessage?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ISupportedLanguage {
  code: string;
  name: string;
}
