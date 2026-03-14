import { GoogleGenAI } from "@google/genai";
import { GarmentType, ModelType, ModelPose, ModelBackground } from "../types";

const MAX_RETRIES = 3;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Step 1: Use FREE Gemini 1.5 Flash (text only) to analyze fabric and build a prompt
async function analyzeFabricWithGemini(fabricBase64: string, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const base64Data = fabricBase64.split(',')[1] || fabricBase64;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash', // FREE tier - text + image understanding, no image output
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
        { text: `Analyze this fabric swatch in detail. Describe:
1. The exact colors (be specific, e.g. "deep crimson red", "ivory white", "royal navy blue")
2. The pattern type (solid, stripes, checks, floral, paisley, geometric, abstract, etc.)
3. The texture/finish appearance (silk-like sheen, matte cotton, linen texture, etc.)
4. Any embroidery, embellishments, or special details visible

Respond in 2-3 sentences only. Be very specific about colors and patterns. This description will be used to recreate this exact fabric in a fashion photo.` }
      ]
    }
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.text || "solid colored premium fabric";
}

// Step 2: Generate image using Pollinations.ai - 100% FREE, no API key needed
async function generateImageWithPollinations(prompt: string, aspectRatio: string): Promise<string> {
  let width = 768;
  let height = 1024;

  switch (aspectRatio) {
    case '1:1': width = 1024; height = 1024; break;
    case '3:4': width = 768; height = 1024; break;
    case '4:3': width = 1024; height = 768; break;
    case '16:9': width = 1280; height = 720; break;
  }

  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 999999);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true&enhance=true`;

  // Fetch the image and convert to base64
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image generation failed: ${response.status}`);

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
      const apiKey = process.env.API_KEY || '';

      // Step 1: Analyze fabric (free Gemini text model)
      let fabricDescription = "premium fabric with rich texture and vibrant colors";
      try {
        fabricDescription = await analyzeFabricWithGemini(fabricBase64, apiKey);
      } catch (e) {
        console.warn("Fabric analysis skipped, using default description");
      }

      // Step 2: Build model description
      let modelDescription = "";
      switch (modelType) {
        case ModelType.INDIAN_CLASSIC:
          modelDescription = "a handsome clean-shaven Indian male model, sharp jawline, professional look";
          break;
        case ModelType.INDIAN_BEARDED:
          modelDescription = "a handsome Indian male model with a well-groomed stylish beard";
          break;
        case ModelType.INDIAN_TRADITIONAL:
          modelDescription = "a regal Indian male model with a traditional dignified appearance";
          break;
        case ModelType.INTERNATIONAL:
          modelDescription = "a high-fashion international male model, sharp features";
          break;
        default:
          modelDescription = "a professional male fashion model";
      }

      // Step 3: Build background description
      const bgDescriptions: Record<string, string> = {
        'Pure Light Minimalist': 'pure white minimalist studio background',
        'Soft Studio Grey': 'soft grey professional studio backdrop',
        'Neutral Warm Beige': 'warm neutral beige background',
        'Minimalist Studio': 'clean professional studio with subtle gradient',
        'Luxury Interior': 'luxury interior with marble floors and soft ambient light',
        'Royal Palace': 'grand royal palace courtyard, ornate architecture',
        'Heritage Haveli': 'beautiful Indian heritage haveli with carved archways',
        'Festive Courtyard': 'decorated Indian festive courtyard with flowers',
        'Modern Loft': 'modern industrial loft with large windows and natural light',
        'Urban Street': 'upscale urban street with bokeh background',
        'Corporate Office': 'sleek modern corporate office environment',
        'Luxury Yacht Deck': 'luxury yacht deck with ocean in background',
        'Chic Cafe': 'chic upscale cafe with warm ambient lighting',
      };
      const bgDesc = bgDescriptions[modelBackground] || 'professional studio background';

      // Step 4: Garment-specific prompt
      let garmentPrompt = "";
      if (garment === GarmentType.DUO_VIEW) {
        garmentPrompt = `${modelDescription} shown in two poses side by side. LEFT: wearing a knee-length Long Kurta. RIGHT: wearing a tailored Shirt. Both garments made from: ${fabricDescription}. Split composition, same model twice.`;
      } else {
        garmentPrompt = `${modelDescription} wearing a perfectly tailored ${garment} made from ${fabricDescription}. Paired with ${bottomColor.toLowerCase()} bottom. ${modelPose} pose.`;
      }

      // Step 5: Full high-quality fashion photography prompt
      const fullPrompt = `Ultra high resolution professional fashion photography. ${garmentPrompt} Background: ${bgDesc}. The garment fabric is the hero of the image - crisp sharp fabric detail, accurate colors and pattern. Professional fashion magazine quality. Studio lighting with rim light. 8K detail. ${notes}`.trim();

      console.log("Generating with prompt:", fullPrompt.substring(0, 100) + "...");

      // Step 6: Generate with Pollinations (FREE)
      const imageData = await generateImageWithPollinations(fullPrompt, aspectRatio);
      return imageData;

    } catch (error: any) {
      lastError = error;
      console.warn(`Draping attempt ${attempt + 1} failed:`, error.message);
      if (attempt < MAX_RETRIES - 1) {
        await sleep(Math.pow(2, attempt) * 2000);
      }
    }
  }

  throw lastError;
};
