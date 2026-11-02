export interface SubtitleSegment {
  index: number;
  start: number;
  end: number;
  text: string;
  translatedText?: string;
}

export type ProjectStatus = 'idle' | 'queued' | 'extracting_audio' | 'transcribing' | 'translating' | 'completed' | 'failed';

export interface VideoProject {
  _id: string;
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
  segments: SubtitleSegment[];
  errorMessage?: string | null;
  translatedAudioPath?: string | null;
  dubbedVideoPath?: string | null;
  audioVoiceStatus?: 'none' | 'generating' | 'ready' | 'failed';
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
}

export interface ProgressEventPayload {
  type?: string;
  status: ProjectStatus;
  progress: number;
  message: string;
  project?: VideoProject;
  error?: string;
}
