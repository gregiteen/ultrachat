import { elevenlabs, type Voice, type VoiceSettings } from './elevenlabs';

interface SpeechOptions {
  voice?: Voice;
  settings?: VoiceSettings;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  stream?: boolean;
}

class SpeechService {
  private currentVoice: Voice | null = null;
  private currentStream: ReadableStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private mediaSource: MediaSource | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isProcessing = false;
  private recognition: SpeechRecognition | null = null;

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new window.webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
    }
  }

  async speak(text: string, options: SpeechOptions = {}) {
    try {
      options.onStart?.();

      // Stop any current playback
      this.stop();

      // Use streaming if specified
      if (options.stream) {
        await this.streamAudio(text, options);
      } else {
        await this.playAudio(text, options);
      }

      options.onEnd?.();
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error('Speech generation failed'));
    }
  }

  private async streamAudio(text: string, options: SpeechOptions) {
    try {
      this.currentStream = await elevenlabs.textToSpeech({
        text,
        voice_id: options.voice?.id || '',
        voice_settings: options.settings,
        stream: true,
        output_format: 'mp3_44100_128',
      }) as ReadableStream;

      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const reader = this.currentStream.getReader();
      const mediaSource = new MediaSource();
      const audio = new Audio();
      audio.src = URL.createObjectURL(mediaSource);

      mediaSource.addEventListener('sourceopen', async () => {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        
        // Process stream chunks
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Wait for the buffer to be ready
          if (sourceBuffer.updating) {
            await new Promise(resolve => {
              sourceBuffer.addEventListener('updateend', resolve, { once: true });
            });
          }
          
          sourceBuffer.appendBuffer(value);
        }

        mediaSource.endOfStream();
      });

      await audio.play();
      this.mediaSource = mediaSource;

    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  private async playAudio(text: string, options: SpeechOptions) {
    const audioBlob = await elevenlabs.textToSpeech({
      text,
      voice_id: options.voice?.id || '',
      voice_settings: options.settings,
      output_format: 'mp3_44100_128',
    }) as Blob;

    const arrayBuffer = await audioBlob.arrayBuffer();
    
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    source.onended = () => {
      options.onEnd?.();
      this.sourceNode = null;
    };

    this.sourceNode = source;
    source.start(0);
  }

  stop() {
    // Stop streaming
    if (this.currentStream) {
      elevenlabs.stopStream(this.currentVoice?.id || '');
      this.currentStream = null;
    }

    // Stop audio playback
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Clean up MediaSource
    if (this.mediaSource && this.mediaSource.readyState === 'open') {
      this.mediaSource.endOfStream();
    }

    // Reset audio context
    if (this.audioContext?.state === 'running') {
      this.audioContext.suspend();
    }

    // Clear queue
    this.audioQueue = [];
    this.isProcessing = false;

    // Stop speech recognition
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  startRecording(onResult: (text: string, isFinal: boolean) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      this.recognition.onstart = () => {
        resolve();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript, true);
        } else if (interimTranscript) {
          onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  stopRecording() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  async getVoices(): Promise<Voice[]> {
    return elevenlabs.getVoices();
  }

  setVoice(voice: Voice) {
    this.currentVoice = voice;
  }

  async createVoice(name: string, files: File[], description?: string): Promise<Voice> {
    return elevenlabs.addVoice(name, files, description);
  }

  async generateVoice(name: string, text: string, design?: any): Promise<Voice> {
    return elevenlabs.generateVoice({
      name,
      text,
      design,
    });
  }

  isPlaying(): boolean {
    return !!(this.sourceNode || this.currentStream);
  }
}

export const speech = new SpeechService();
export const speechRecognition = {
  startRecording: (onResult: (text: string, isFinal: boolean) => void) => speech.startRecording(onResult),
  stopRecording: () => speech.stopRecording(),
};