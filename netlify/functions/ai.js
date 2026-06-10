exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
 
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }
 
  try {
    const body = JSON.parse(event.body);
 
    // Always use Sonnet for best Hebrew quality
    body.model = 'claude-sonnet-4-5-20251022';
 
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify(body)
    });
 
    const data = await response.json();
 
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
 
