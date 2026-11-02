import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { AppNavbar } from './components/Navbar';
import { VideoUploader } from './components/VideoUploader';
import { LanguageSelector } from './components/LanguageSelector';
import { ProgressBar } from './components/ProgressBar';
import { VideoPlayer } from './components/VideoPlayer';
import { CaptionDisplay } from './components/CaptionDisplay';
import { ExportControls } from './components/ExportControls';
import { AudioDubbingPanel } from './components/AudioDubbingPanel';
import { ProjectHistoryModal } from './components/ProjectHistoryModal';
import { AIToolsModal } from './components/AIToolsModal';
import { api } from './services/api';
import { VideoProject, SupportedLanguage, ProjectStatus, SubtitleSegment } from './types';
import './App.css';

export const App: React.FC = () => {
  // State
  const [dbConnected, setDbConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | undefined>(undefined);
  const [targetLang, setTargetLang] = useState<string>('es'); // Default to Spanish as in main.py
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ProjectStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('Select a video file to begin.');
  const [logs, setLogs] = useState<string[]>([]);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const unsubscribeSseRef = useRef<(() => void) | null>(null);

  // Initial load
  useEffect(() => {
    const initApp = async () => {
      // 1. Health check
      const healthy = await api.checkHealth();
      setDbConnected(healthy);

      // 2. Fetch supported languages
      try {
        const langs = await api.getLanguages();
        setLanguages(langs);
      } catch (err) {
        console.warn('Could not fetch languages:', err);
      }

      // 3. Fetch past projects
      loadProjects();
    };

    initApp();

    return () => {
      if (unsubscribeSseRef.current) {
        unsubscribeSseRef.current();
      }
    };
  }, []);

  const loadProjects = async () => {
    setLoadingHistory(true);
    try {
      const list = await api.getProjects();
      setProjects(list);
    } catch (err) {
      console.warn('Could not load projects:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setStatus('idle');
    setProgress(0);
    setStatusMessage(`File selected: ${file.name}`);
    setLogs([`Selected file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`]);
  };

  const handleGenerate = async () => {
    if (!selectedFile && !currentProject) {
      setErrorMessage('Please select a video file first.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProgress(5);
    setStatus('queued');
    setStatusMessage('Uploading video to server...');
    setLogs(prev => [...prev, 'Starting transcription pipeline...']);

    try {
      let activeProj = currentProject;

      // 1. If we have a new file selected, upload it first
      if (selectedFile) {
        setLogs(prev => [...prev, `Uploading "${selectedFile.name}" to MongoDB backend...`]);
        activeProj = await api.uploadVideo(selectedFile, targetLang, 'en-US', (pct) => {
          setProgress(Math.round(pct * 0.15)); // Upload is 0-15% of total progress
        });
        setCurrentProject(activeProj);
      }

      if (!activeProj) {
        throw new Error('Could not establish project session.');
      }

      // 2. Subscribe to real-time SSE progress
      if (unsubscribeSseRef.current) {
        unsubscribeSseRef.current();
      }

      unsubscribeSseRef.current = api.subscribeProgress(activeProj._id, (payload) => {
        if (payload.status) setStatus(payload.status);
        if (payload.progress !== undefined) setProgress(payload.progress);
        if (payload.message) {
          setStatusMessage(payload.message);
          setLogs(prev => [...prev, payload.message]);
        }
        if (payload.project) {
          setCurrentProject(payload.project);
        }
        if (payload.error) {
          setErrorMessage(payload.error);
          setIsProcessing(false);
        }
        if (payload.status === 'completed') {
          setIsProcessing(false);
          loadProjects(); // refresh saved list
        }
      });

      // 3. Trigger video processing
      await api.processVideo(activeProj._id, targetLang, 'en-US');

    } catch (error: any) {
      console.error('Processing error:', error);
      setIsProcessing(false);
      setStatus('failed');
      const msg = error.response?.data?.error || error.message || 'Processing failed';
      setErrorMessage(msg);
      setStatusMessage(`Error: ${msg}`);
      setLogs(prev => [...prev, `[Error] ${msg}`]);
    }
  };

  const handleSelectProject = async (projectId: string) => {
    try {
      const proj = await api.getProject(projectId);
      setCurrentProject(proj);
      setActiveVideoUrl(proj.videoPath);
      setSelectedFile(null);
      setTargetLang(proj.targetLanguage || 'es');
      setStatus(proj.status);
      setProgress(proj.progress);
      setStatusMessage(proj.statusMessage);
      setLogs([`Loaded project: ${proj.title || proj.originalFileName}`]);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Failed to load project details.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      loadProjects();
      if (currentProject?._id === projectId) {
        setCurrentProject(null);
        setSelectedFile(null);
        setStatus('idle');
        setProgress(0);
        setStatusMessage('Project deleted.');
      }
    } catch (err) {
      setErrorMessage('Failed to delete project.');
    }
  };

  const handleRetranslate = async () => {
    if (!currentProject) return;
    setIsProcessing(true);
    setStatus('translating');
    setStatusMessage(`Re-translating captions to ${targetLang}...`);
    setLogs(prev => [...prev, `Re-translating to target language: ${targetLang}...`]);

    try {
      const updated = await api.retranslateProject(currentProject._id, targetLang);
      setCurrentProject(updated);
      setIsProcessing(false);
      setStatus('completed');
      setStatusMessage('Captions re-translated successfully!');
      setLogs(prev => [...prev, 'Re-translation complete!']);
    } catch (err: any) {
      setIsProcessing(false);
      setStatus('failed');
      setErrorMessage(err.message || 'Re-translation failed');
    }
  };

  const handleGenerateAudio = async () => {
    if (!currentProject) return;
    setLogs(prev => [...prev, `Generating AI speech audio in ${currentProject.targetLanguage}...`]);
    const updated = await api.generateAudio(currentProject._id);
    setCurrentProject(updated);
    setLogs(prev => [...prev, `AI voice speech audio (.mp3) generated successfully!`]);
    loadProjects();
  };

  const handleGenerateDubbedVideo = async () => {
    if (!currentProject) return;
    setLogs(prev => [...prev, `Dubbing video with AI translated speech audio...`]);
    const updated = await api.generateDubbedVideo(currentProject._id);
    setCurrentProject(updated);
    if (updated.dubbedVideoPath) {
      setActiveVideoUrl(updated.dubbedVideoPath);
    }
    setLogs(prev => [...prev, `Dubbed video (.mp4) generated successfully!`]);
    loadProjects();
  };

  const handleSeekTo = (seconds: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = seconds;
      videoPlayerRef.current.play();
    }
  };

  const handleNewProject = () => {
    if (unsubscribeSseRef.current) {
      unsubscribeSseRef.current();
    }
    setSelectedFile(null);
    setCurrentProject(null);
    setActiveVideoUrl(undefined);
    setIsProcessing(false);
    setProgress(0);
    setStatus('idle');
    setStatusMessage('Select a video file to begin.');
    setLogs([]);
    setErrorMessage(null);
  };

  const handleOriginalTextChange = (text: string) => {
    if (!currentProject) return;
    setCurrentProject({ ...currentProject, originalText: text });
  };

  const handleTranslatedTextChange = (text: string) => {
    if (!currentProject) return;
    setCurrentProject({ ...currentProject, translatedText: text });
  };

  const handleSegmentChange = (index: number, field: 'text' | 'translatedText', value: string) => {
    if (!currentProject || !currentProject.segments) return;
    const newSegments = [...currentProject.segments];
    if (newSegments[index]) {
      newSegments[index] = { ...newSegments[index], [field]: value };
      setCurrentProject({ ...currentProject, segments: newSegments });
    }
  };

  const activeLangName = languages.find(l => l.code === targetLang)?.name || targetLang;

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark text-white">
      {/* Top Navigation */}
      <AppNavbar
        dbConnected={dbConnected}
        projectCount={projects.length}
        onOpenHistory={() => {
          loadProjects();
          setShowHistory(true);
        }}
        onOpenSettings={() => setShowSettings(true)}
        onNewProject={handleNewProject}
      />

      {/* Main App Container */}
      <Container fluid className="px-3 px-md-4 py-3 flex-grow-1">
        {errorMessage && (
          <Alert variant="danger" onClose={() => setErrorMessage(null)} dismissible className="mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
          </Alert>
        )}

        <Row className="g-3">
          {/* Left Column: Controls & Pipeline */}
          <Col lg={6}>
            {/* 1. Video Uploader (Matches Python Browse button) */}
            <VideoUploader
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              uploadedFileName={currentProject?.originalFileName}
              isProcessing={isProcessing}
            />

            {/* 2. Language Selector & Generate Captions */}
            <LanguageSelector
              targetLang={targetLang}
              setTargetLang={setTargetLang}
              languages={languages}
              onGenerate={handleGenerate}
              isProcessing={isProcessing}
              disabled={!selectedFile && !currentProject}
            />

            {/* 3. Progress Bar & Live Activity Log (Matches Python progressbar & log messages) */}
            <ProgressBar
              progress={progress}
              status={status}
              statusMessage={statusMessage}
              logs={logs}
              isProcessing={isProcessing}
            />

            {/* 4. Subtitle Export & Download Controls */}
            <ExportControls
              projectId={currentProject?._id}
              hasCaptions={Boolean(currentProject?.originalText || currentProject?.translatedText)}
              onRetranslate={handleRetranslate}
              isProcessing={isProcessing}
            />
          </Col>

          {/* Right Column: Video Preview Player with Synchronized Subtitles */}
          <Col lg={6}>
            <VideoPlayer
              playerRef={videoPlayerRef}
              videoUrl={activeVideoUrl || currentProject?.videoPath}
              segments={currentProject?.segments || []}
              targetLangName={activeLangName}
              onTimeUpdate={(t) => setCurrentTime(t)}
            />
          </Col>
        </Row>

        {/* AI Voice Dubbing & Audio Studio */}
        <Row className="mt-3">
          <Col xs={12}>
            <AudioDubbingPanel
              project={currentProject}
              onGenerateAudio={handleGenerateAudio}
              onGenerateDubbedVideo={handleGenerateDubbedVideo}
              onSwitchVideoSource={(url) => setActiveVideoUrl(url)}
              activeVideoUrl={activeVideoUrl || currentProject?.videoPath}
              isProcessing={isProcessing}
            />
          </Col>
        </Row>

        {/* Bottom Full-Width Section: Caption Display & Editor */}
        <Row className="mt-3">
          <Col xs={12}>
            <CaptionDisplay
              originalText={currentProject?.originalText || ''}
              translatedText={currentProject?.translatedText || ''}
              segments={currentProject?.segments || []}
              targetLang={targetLang}
              targetLangName={activeLangName}
              onOriginalTextChange={handleOriginalTextChange}
              onTranslatedTextChange={handleTranslatedTextChange}
              onSegmentChange={handleSegmentChange}
              onSeekTo={handleSeekTo}
              currentTime={currentTime}
            />
          </Col>
        </Row>
      </Container>

      {/* Modals */}
      <ProjectHistoryModal
        show={showHistory}
        onHide={() => setShowHistory(false)}
        projects={projects}
        loading={loadingHistory}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
      />

      <AIToolsModal
        show={showSettings}
        onHide={() => setShowSettings(false)}
      />
    </div>
  );
};

export default App;
