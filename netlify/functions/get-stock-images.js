export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { keywords } = JSON.parse(event.body);
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server Pexels Key missing' }) };
    }

    const imagePromises = keywords.map(keyword =>
      fetch(`https://api.pexels.com/v1/search?query=${keyword}&per_page=1`, {
        headers: { 'Authorization': apiKey }
      }).then(res => res.json())
    );

    const results = await Promise.all(imagePromises);
    const images = results.map(result => result?.photos?.[0]?.src?.medium).filter(Boolean);

    return { statusCode: 200, body: JSON.stringify({ images }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};