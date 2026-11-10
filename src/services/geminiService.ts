import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

const TRANSCRIPTION_SYSTEM_PROMPT = `You are a sermon transcription and editorial specialist for a Christian church.
Your task is to transcribe the provided audio sermon and rewrite it as a polished, readable article.

STRUCTURE AND FORMATTING RULES (follow these exactly):
- Divide the article into sections. Each section has a short heading followed by one or more paragraphs.
- Use ## for section headings (e.g. ## The Call to Repentance). Headings should reflect a topic shift or a new major point in the sermon.
- A typical sermon article has 4–8 sections. Every section must have a heading.
- Start with an engaging opening paragraph (no heading) that introduces the main theme, then move into the first section.
- Each paragraph within a section must be separated by a blank line.
- End with a ## Closing or ## Reflection section that captures the sermon's conclusion or call to action.
- Use **bold** only for direct scripture references (e.g. **John 3:16**) and key theological phrases.
- Do NOT use bullet lists or numbered lists — headings and paragraphs only.
- Separate every paragraph and heading with exactly one blank line.

CONTENT RULES:
- Use a warm, pastoral tone that is accessible to all readers.
- Preserve the preacher's key points, scripture references, and illustrations faithfully.
- Remove filler words ("um", "uh", "you know"), false starts, and repeated phrases.
- Keep the spiritual depth and conviction of the original message.
- Do not change the meaning or structure of the sermon — stay true to what was said.
- Do not include any em dashes.

Output ONLY the article content — no title, no preamble, no meta-commentary.`;

const DESCRIPTION_SYSTEM_PROMPT = `You are a podcast content writer for a Christian church podcast.
Write a concise, engaging episode description in 2–3 sentences.
The description should:
- Hook the listener with the core theme or question explored
- Mention the key scripture or topic
- Feel warm and inviting, not overly formal

Output ONLY the description text — no labels, no quotes around it.`;

export interface TranscriptionResult {
  articleContent: string;
  podcastDescription: string;
}

/**
 * Upload audio buffer to the Gemini Files API and return the file URI.
 * The Files API handles files > 20MB more reliably than inline data.
 */
async function uploadAudioToGemini(
  audioBuffer: Buffer,
  filename: string,
  mimeType = 'audio/mp4',
): Promise<string> {
  const arrayBuffer = audioBuffer.buffer.slice(
    audioBuffer.byteOffset,
    audioBuffer.byteOffset + audioBuffer.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: mimeType });
  const file = await ai.files.upload({
    file: blob,
    config: {
      mimeType,
      displayName: filename,
    },
  });
  return file.uri!;
}

/**
 * Transcribe the sermon audio and rewrite it as a pastoral article.
 * Also generates a short podcast episode description.
 */
export async function transcribeAndRewrite(
  audioBuffer: Buffer,
  filename: string,
  sermonTitle: string,
  mimeType = 'audio/mp4',
): Promise<TranscriptionResult> {
  // Upload audio to Files API for reliable handling of large files
  const audioUri = await uploadAudioToGemini(audioBuffer, filename, mimeType);

  // Step 1: Transcribe + rewrite to article
  const transcriptionResponse = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              mimeType,
              fileUri: audioUri,
            },
          },
          {
            text: `Sermon title: "${sermonTitle}"\n\n${TRANSCRIPTION_SYSTEM_PROMPT}`,
          },
        ],
      },
    ],
  });

  const articleContent =
    transcriptionResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
    "";

  // Step 2: Generate short podcast description from the article
  const descriptionResponse = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${DESCRIPTION_SYSTEM_PROMPT}\n\nSermon title: "${sermonTitle}"\n\nArticle content:\n${articleContent.slice(0, 2000)}`,
          },
        ],
      },
    ],
  });

  const podcastDescription =
    descriptionResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
    "";

  return { articleContent, podcastDescription };
}
