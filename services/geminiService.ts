import { GarmentType, ModelType, ModelPose, ModelBackground } from "../types";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildPrompt(
  garment: GarmentType,
  modelType: ModelType,
  modelPose: ModelPose,
  modelBackground: ModelBackground,
  bottomColor: string,
  notes: string
): string {
  const modelMap: Record<string, string> = {
    [ModelType.INDIAN_CLASSIC]:     'clean-shaven Indian male model',
    [ModelType.INDIAN_BEARDED]:     'bearded Indian male model',
    [ModelType.INDIAN_TRADITIONAL]: 'regal Indian male model',
    [ModelType.INTERNATIONAL]:      'international male fashion model',
  };
  const bgMap: Record<string, string> = {
    'Pure Light Minimalist': 'white studio',
    'Soft Studio Grey':      'grey studio',
    'Neutral Warm Beige':    'beige background',
    'Minimalist Studio':     'clean studio',
    'Luxury Interior':       'luxury interior',
    'Royal Palace':          'royal palace',
    'Heritage Haveli':       'Indian haveli',
    'Festive Courtyard':     'festive courtyard',
    'Modern Loft':           'modern loft',
    'Urban Street':          'urban street',
    'Corporate Office':      'corporate office',
    'Luxury Yacht Deck':     'yacht deck',
    'Chic Cafe':             'chic cafe',
  };

  const model = modelMap[modelType] || 'male fashion model';
  const bg    = bgMap[modelBackground] || 'studio';
  const pose  = modelPose.toLowerCase();
  const extra = notes ? ', ' + notes.substring(0, 50) : '';

  if (garment === GarmentType.DUO_VIEW) {
    return `fashion photo, ${model}, kurta left shirt right, split view, ${bg}, studio lighting${extra}`;
  }
  return `fashion photo, ${model}, ${pose}, ${garment}, ${bottomColor} pants, ${bg}, studio lighting${extra}`;
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
  const prompt = buildPrompt(garment, modelType, modelPose, modelBackground, bottomColor, notes);

  let width = 768, height = 1024;
  if (aspectRatio === '1:1')  { width = 1024; height = 1024; }
  if (aspectRatio === '4:3')  { width = 1024; height = 768; }
  if (aspectRatio === '16:9') { width = 1280; height = 720; }

  // Call OUR Netlify serverless function — server-side, no rate limits, no CORS
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(5000);
    try {
      const res = await fetch('/.netlify/functions/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, width, height }),
        signal: AbortSignal.timeout(90000),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.image) throw new Error('No image in response');
      return data.image;

    } catch (err: any) {
      console.warn(`Attempt ${attempt + 1} failed:`, err.message);
      if (attempt === 2) throw new Error(`Generation failed: ${err.message}`);
    }
  }

  throw new Error('All attempts failed');
};
