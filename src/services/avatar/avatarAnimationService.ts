/**
 * Avatar Animation Service
 * Responsible for mapping audio streams into lip-sync visemes AND
 * mapping semantic sentiment/intent into full-body gestures and facial expressions.
 */

export interface AvatarAnimationFrame {
  timestampMs: number;
  visemes: Record<string, number>; // e.g. { "jawOpen": 0.5, "mouthPucker": 0.2 }
  expressions: Record<string, number>; // e.g. { "browInnerUp": 0.8, "eyeSquint": 0.3 }
  gestureTrigger?: string; // e.g. "wave_hello", "nod_agreement", "shrug"
}

export class AvatarAnimationService {
  /**
   * Generates a complete animation frame combining audio-driven mouth movement
   * with context-driven emotional expressions and body gestures.
   */
  static generateFrame(
    pcmAudioChunk: Float32Array, 
    sentimentContext: { score: number; arousal: number; detectedMood: string },
    intentContext: string
  ): AvatarAnimationFrame[] {
    const frames: AvatarAnimationFrame[] = [];
    
    // 1. Audio-driven Visemes (Lip Sync)
    let sum = 0;
    for (let i = 0; i < pcmAudioChunk.length; i++) {
      sum += Math.abs(pcmAudioChunk[i]);
    }
    const averageVolume = sum / pcmAudioChunk.length;
    
    const visemes = {
      jawOpen: Math.min(averageVolume * 10, 1.0),
      mouthRound: Math.min(averageVolume * 5, 0.5)
    };

    // 2. Sentiment-driven Facial Expressions
    const expressions: Record<string, number> = {
      browInnerUp: sentimentContext.score < 0 ? 0.8 : 0.1, // Concern if negative
      mouthSmile: sentimentContext.score > 0.5 ? 0.9 : 0.0, // Smile if positive
      eyeSquint: sentimentContext.arousal > 0.7 ? 0.6 : 0.0, // Squint if intense
    };

    // 3. Intent & Mood driven Body Gestures
    let gestureTrigger: string | undefined;
    
    if (intentContext === "casual_chat" && sentimentContext.score > 0.8) {
      gestureTrigger = "wave_hello";
    } else if (intentContext === "seek_advice" && sentimentContext.score < 0) {
      gestureTrigger = "empathetic_nod";
    } else if (sentimentContext.arousal > 0.8 && sentimentContext.score < 0) {
      gestureTrigger = "hands_up_defensive";
    }

    frames.push({
      timestampMs: Date.now(),
      visemes,
      expressions,
      gestureTrigger
    });

    return frames;
  }
}
