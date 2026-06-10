// Netlify Function: /api/results
// Fetches live World Cup 2026 scores from football-data.org

exports.handler = async (event) => {
  const API_KEY = process.env.FOOTBALL_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'FOOTBALL_API_KEY not configured' })
    };
  }

  try {
    // World Cup 2026 competition ID on football-data.org is 2000 (FIFA World Cup)
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/2000/matches?status=FINISHED,IN_PLAY,PAUSED',
      {
        headers: {
          'X-Auth-Token': API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to our format
    const matches = (data.matches || []).map(m => ({
      id: m.id,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
      status: m.status, // FINISHED, IN_PLAY, PAUSED, SCHEDULED
      minute: m.minute || null,
      utcDate: m.utcDate,
      stage: m.stage,
      group: m.group
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60' // cache 1 min
      },
      body: JSON.stringify({ matches, updated: new Date().toISOString() })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
