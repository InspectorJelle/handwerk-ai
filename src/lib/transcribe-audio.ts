import { MOCK_TRANSCRIPT } from "@/lib/mock-data";

const MAX_BYTES = 25 * 1024 * 1024;

export async function transcribeAudioBlob(audio: Blob): Promise<string> {
  if (audio.size > MAX_BYTES) {
    throw new Error("Audiodatei zu groß (max. 25 MB)");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return MOCK_TRANSCRIPT;
  }

  const uploadForm = new FormData();
  uploadForm.append(
    "file",
    audio,
    audio.type.includes("webm") ? "recording.webm" : "recording.mp4",
  );
  uploadForm.append("model", "whisper-1");
  uploadForm.append("language", "de");

  const whisperRes = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: uploadForm,
    },
  );

  if (!whisperRes.ok) {
    const err = await whisperRes.text();
    throw new Error(`Whisper-Fehler: ${err}`);
  }

  const result = (await whisperRes.json()) as { text: string };
  return result.text;
}
