// Netlify Function: /api/update
// Supports two modes:
// 1. Full file update: { filename, content, message }
// 2. Patch mode: { filename, patch: { find, replace }, message }

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
    const { filename, content, patch, message } = JSON.parse(event.body);
    if (!filename) return { statusCode: 400, body: JSON.stringify({ error: 'filename required' }) };

    // Get current file
    const getRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${filename}`,
      { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    const fileData = await getRes.json();
    const sha = fileData.sha;

    let finalContent;

    if (patch) {
      // Patch mode — decode current, find & replace, re-encode
      const current = Buffer.from(fileData.content, 'base64').toString('utf8');
      if (!current.includes(patch.find)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'patch.find string not found in file' }) };
      }
      finalContent = current.replace(patch.find, patch.replace);
    } else if (content) {
      finalContent = content;
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'content or patch required' }) };
    }

    const encoded = Buffer.from(finalContent, 'utf8').toString('base64');

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
          sha
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
      return { statusCode: 400, body: JSON.stringify({ error: result.message }) };
    }

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
