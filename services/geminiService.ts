import { GarmentType, ModelType, ModelPose, ModelBackground } from "../types";

const MAX_RETRIES = 3;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildShortPrompt(
  garment: GarmentType,
  modelType: ModelType,
  modelPose: ModelPose,
  modelBackground: ModelBackground,
  bottomColor: string,
  notes: string
): string {
  const modelMap: Record<string, string> = {
    [ModelType.INDIAN_CLASSIC]:      'clean-shaven Indian male model',
    [ModelType.INDIAN_BEARDED]:      'bearded Indian male model',
    [ModelType.INDIAN_TRADITIONAL]:  'regal Indian male model',
    [ModelType.INTERNATIONAL]:       'international male fashion model',
  };

  const bgMap: Record<string, string> = {
    'Pure Light Minimalist':  'white studio background',
    'Soft Studio Grey':       'grey studio backdrop',
    'Neutral Warm Beige':     'warm beige background',
    'Minimalist Studio':      'clean studio background',
    'Luxury Interior':        'luxury interior setting',
    'Royal Palace':           'royal palace courtyard',
    'Heritage Haveli':        'Indian heritage haveli',
    'Festive Courtyard':      'festive Indian courtyard',
    'Modern Loft':            'modern loft setting',
    'Urban Street':           'upscale urban street',
    'Corporate Office':       'modern corporate office',
    'Luxury Yacht Deck':      'luxury yacht deck',
    'Chic Cafe':              'chic upscale cafe',
  };

  const model  = modelMap[modelType]  || 'professional male model';
  const bg     = bgMap[modelBackground] || 'studio background';
  const pose   = modelPose.toLowerCase();

  let garmentDesc = '';
  if (garment === GarmentType.DUO_VIEW) {
    garmentDesc = `split view: same model wearing kurta on left, tailored shirt on right`;
  } else {
    garmentDesc = `${garment} with ${bottomColor.toLowerCase()} bottom`;
  }

  const extra = notes ? notes.substring(0, 60) : '';

  // Keep prompt under 400 chars to avoid URL length issues
  return `professional fashion photo, ${model}, ${pose} pose, wearing ${garmentDesc}, ${bg}, studio lighting, sharp fabric detail, fashion magazine quality${extra ? ', ' + extra : ''}`;
}

async function generateWithPollinations(prompt: string, aspectRatio: string): Promise<string> {
  let width = 768, height = 1024;
  if (aspectRatio === '1:1')  { width = 1024; height = 1024; }
  if (aspectRatio === '4:3')  { width = 1024; height = 768;  }
  if (aspectRatio === '16:9') { width = 1280; height = 720;  }

  const seed = Math.floor(Math.random() * 99999);
  // Keep URL short — encode only what's necessary
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true`;

  console.log('Fetching from Pollinations, prompt length:', prompt.length);

  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);

  const blob = await res.blob();
  if (blob.size < 1000) throw new Error('Received empty image from Pollinations');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror   = () => reject(new Error('Failed to read image'));
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
  const prompt = buildShortPrompt(garment, modelType, modelPose, modelBackground, bottomColor, notes);
  console.log('Final prompt:', prompt);

  let lastError: any;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await generateWithPollinations(prompt, aspectRatio);
    } catch (err: any) {
      lastError = err;
      console.warn(`Attempt ${attempt + 1} failed:`, err.message);
      if (attempt < MAX_RETRIES - 1) await sleep(3000);
    }
  }
  throw new Error(`Image generation failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
};
