import axios from 'axios';
import { VideoProject, SupportedLanguage, ProgressEventPayload } from '../types';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Check health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await apiClient.get('/health');
      return res.data?.status === 'healthy';
    } catch {
      return false;
    }
  },

  // Upload video
  async uploadVideo(
    file: File,
    targetLanguage: string = 'es',
    sourceLanguage: string = 'en-US',
    onUploadProgress?: (percent: number) => void
  ): Promise<VideoProject> {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('targetLanguage', targetLanguage);
    formData.append('sourceLanguage', sourceLanguage);

    const res = await axios.post<{ success: boolean; project: VideoProject }>(
      `${API_BASE}/videos/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onUploadProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percent);
          }
        }
      }
    );

    return res.data.project;
  },

  // Process video
  async processVideo(
    projectId: string,
    targetLanguage?: string,
    sourceLanguage?: string
  ): Promise<VideoProject> {
    const res = await apiClient.post<{ success: boolean; project: VideoProject }>(
      `/videos/${projectId}/process`,
      { targetLanguage, sourceLanguage }
    );
    return res.data.project;
  },

  // Get project by ID
  async getProject(projectId: string): Promise<VideoProject> {
    const res = await apiClient.get<{ success: boolean; project: VideoProject }>(
      `/projects/${projectId}`
    );
    return res.data.project;
  },

  // Get all projects
  async getProjects(): Promise<VideoProject[]> {
    const res = await apiClient.get<{ success: boolean; projects: VideoProject[] }>(
      `/projects`
    );
    return res.data.projects;
  },

  // Update project
  async updateProject(
    projectId: string,
    data: Partial<VideoProject>
  ): Promise<VideoProject> {
    const res = await apiClient.put<{ success: boolean; project: VideoProject }>(
      `/projects/${projectId}`,
      data
    );
    return res.data.project;
  },

  // Retranslate project
  async retranslateProject(projectId: string, targetLanguage: string): Promise<VideoProject> {
    const res = await apiClient.post<{ success: boolean; project: VideoProject }>(
      `/projects/${projectId}/retranslate`,
      { targetLanguage }
    );
    return res.data.project;
  },

  // Delete project
  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  },

  // Generate AI Translated Audio file
  async generateAudio(projectId: string): Promise<VideoProject> {
    const res = await apiClient.post<{ success: boolean; project: VideoProject }>(
      `/projects/${projectId}/generate-audio`
    );
    return res.data.project;
  },

  // Generate Dubbed Video with translated audio track
  async generateDubbedVideo(projectId: string): Promise<VideoProject> {
    const res = await apiClient.post<{ success: boolean; project: VideoProject }>(
      `/projects/${projectId}/generate-dubbed-video`
    );
    return res.data.project;
  },

  // Get live streaming audio URL for a single phrase/segment
  getLiveAudioUrl(text: string, lang: string = 'es'): string {
    return `${API_BASE}/projects/tts/speak?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
  },

  // Get supported languages
  async getLanguages(): Promise<SupportedLanguage[]> {
    const res = await apiClient.get<{ success: boolean; languages: SupportedLanguage[] }>(
      `/translate/languages`
    );
    return res.data.languages;
  },

  // Helper for subtitle download URL
  getExportUrl(projectId: string, format: 'srt' | 'vtt' | 'txt' | 'json', useTranslation: boolean = true): string {
    return `${API_BASE}/projects/${projectId}/export/${format}?useTranslation=${useTranslation}`;
  },

  // Subscribe to SSE stream for live progress updates
  subscribeProgress(
    projectId: string,
    onProgress: (payload: ProgressEventPayload) => void,
    onError?: (err: any) => void
  ): () => void {
    const eventSource = new EventSource(`${API_BASE}/videos/${projectId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onProgress(data);
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    // Return cleanup function to close connection
    return () => {
      eventSource.close();
    };
  }
};
