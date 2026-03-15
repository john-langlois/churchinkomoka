import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

// gemini-3.1-flash-image-preview = "Nano Banana 2" in Google's branding
const MODEL = "gemini-3.1-flash-image-preview";

/**
 * Generate a podcast thumbnail using Gemini 3.1 Flash Image (Nano Banana 2).
 *
 * If a reference image is provided (as a base64 string), the model uses it
 * as a visual reference to guide the composition and style of the output.
 * Output: 1:1 square PNG returned as a Buffer.
 */
export async function generateSermonThumbnail(
  sermonTitle: string,
  referenceImageBase64?: string,
  referenceImageMimeType?: string,
): Promise<Buffer> {
  const displayTitle =
    sermonTitle.length > 80 ? `${sermonTitle.slice(0, 77)}...` : sermonTitle;

  const prompt = [
    "Create a podcast cover art thumbnail.",
    "Use the reference image as the visual base — preserve the key subject, composition, and mood.",
    "Add a pure solid black overlay that is semi-transparent so the reference image shows through subtly.",
    `Overlay large bold white sans-serif text at the bottom: "${displayTitle}"`,
    "Text should be centered horizontally, with enough contrast to be readable at small sizes.",
    "Add a small thin white cross icon at the top center.",
    "Modern, clean, professional church podcast aesthetic.",
    "No additional text, no borders, no gradients.",
    "1:1 square aspect ratio.",
  ].join(" ");

  const parts: object[] = [{ text: prompt }];

  if (referenceImageBase64 && referenceImageMimeType) {
    parts.push({
      inlineData: {
        mimeType: referenceImageMimeType,
        data: referenceImageBase64,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inlineData?.data,
  ) as any;

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini 3.1 Flash Image returned no image in response");
  }

  return Buffer.from(imagePart.inlineData.data, "base64");
}
