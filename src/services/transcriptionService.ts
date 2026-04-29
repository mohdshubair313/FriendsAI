export class TranscriptionService {
  async transcribeAudio(audioBase64: string, mimeType: string = "audio/wav"): Promise<string> {
    try {
      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mimeType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to transcribe audio");
      }

      const data = await response.json();
      return data.transcription;
    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    }
  }
}