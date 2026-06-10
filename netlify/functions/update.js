// Netlify Function: /api/update
// Allows Claude to push file updates to GitHub directly

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = 'idanshaul1991/WorldCup2026';

  if (!GITHUB_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_TOKEN not configured' }) };
  }

  try {
    const { filename, content, message } = JSON.parse(event.body);

    if (!filename || !content) {
      return { statusCode: 400, body: JSON.stringify({ error: 'filename and content required' }) };
    }

    // Get current file SHA (required for update)
    const getRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${filename}`,
      { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    const fileData = await getRes.json();
    const sha = fileData.sha;

    // Encode content to base64
    const encoded = Buffer.from(content, 'utf8').toString('base64');

    // Push update
    const updateRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${filename}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message || `Update ${filename}`,
          content: encoded,
          sha: sha
        })
      }
    );

    const result = await updateRes.json();

    if (updateRes.ok) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, commit: result.commit?.sha, message: `Updated ${filename}` })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: result.message })
      };
    }

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
