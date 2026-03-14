// Netlify serverless function — runs on Netlify's servers, not the browser
// This avoids all browser-level rate limits, CORS issues, and geo-blocks

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { prompt, width, height } = JSON.parse(event.body || '{}');
  if (!prompt) return { statusCode: 400, body: 'Missing prompt' };

  const seed = Math.floor(Math.random() * 999999);
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width||768}&height=${height||1024}&model=flux&seed=${seed}&nologo=true`;

  console.log('Fetching:', url.substring(0, 120));

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DrapeAI/1.0)',
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      // Try turbo model as fallback
      const url2 = `https://image.pollinations.ai/prompt/${encoded}?width=${width||768}&height=${height||1024}&model=turbo&seed=${seed+1}&nologo=true`;
      const r2 = await fetch(url2, { signal: AbortSignal.timeout(60000) });
      if (!r2.ok) throw new Error(`Both models failed: ${response.status}, ${r2.status}`);
      
      const buf2 = await r2.arrayBuffer();
      const b64_2 = Buffer.from(buf2).toString('base64');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: `data:image/jpeg;base64,${b64_2}` })
      };
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: `data:image/jpeg;base64,${base64}` })
    };

  } catch (err) {
    console.error('Function error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
