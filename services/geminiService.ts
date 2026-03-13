
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GarmentType, ModelType, ModelPose, ModelBackground } from "../types";

const MAX_RETRIES = 3;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const generateDrapedImage = async (
  fabricBase64: string,
  garment: GarmentType,
  modelType: ModelType,
  modelPose: ModelPose,
  modelBackground: ModelBackground,
  bottomColor: string,
  aspectRatio: string,
  notes: string
): Promise<string> => {
  let lastError: any;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = fabricBase64.split(',')[1] || fabricBase64;

      let modelDescription = "";
      switch (modelType) {
        case ModelType.INDIAN_CLASSIC:
          modelDescription = "a handsome Indian male model with a clean-cut professional look";
          break;
        case ModelType.INDIAN_BEARDED:
          modelDescription = "a handsome Indian male model with a well-groomed, stylish beard";
          break;
        case ModelType.INDIAN_TRADITIONAL:
          modelDescription = "a handsome Indian male model in a regal traditional look";
          break;
        case ModelType.INTERNATIONAL:
          modelDescription = "a high-fashion international male model";
          break;
        default:
          modelDescription = "a professional fashion model";
      }

      const highlightingInstructions = `
        CRITICAL FOCUS & QUALITY:
        1. THE GARMENT IS THE STAR: The ${garment} must be the absolute brightest and most detailed element in the image.
        2. FABRIC HIGHLIGHT: Render the fabric with sharp detail and vibrant colors. Patterns must be crisp and perfectly draped.
        3. HIGH-END LIGHTING: Use professional studio lighting. Primary soft light from the front-left, and a SHARP RIM LIGHT to separate the model from the background.
        4. NEUTRAL BACKGROUND: The background (${modelBackground.toLowerCase()}) must be soft, light-colored, and slightly out of focus to ensure the garment highlights more.
      `;

      const prompt = garment === GarmentType.DUO_VIEW
        ? `World-class side-by-side fashion catalog photo. The SAME ${modelDescription} shown twice. LEFT: Knee-length Long Kurta. RIGHT: Tailored Shirt. ${highlightingInstructions} ${notes}`
        : `Hyper-realistic fashion photography of ${modelDescription} wearing a ${garment}. ${highlightingInstructions} Pose: ${modelPose}. Bottom garment color: ${bottomColor}. ${notes}`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp-image-generation',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
            { text: prompt }
          ]
        },
        config: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("Empty AI response.");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data in response.");

    } catch (error: any) {
      lastError = error;
      console.warn(`Draping attempt ${attempt + 1} failed:`, error.message);

      if (attempt < MAX_RETRIES - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  throw lastError;
};
