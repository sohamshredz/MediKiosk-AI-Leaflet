import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  body?: any;
  method?: string;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string | number | readonly string[]) => this;
  end: (cb?: () => void) => this;
}

const fwdCache = new Map<string, { timestamp: number; payload: any }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const query = (body?.query ?? req.query?.query ?? body?.q ?? req.query?.q ?? '') as string;
    const cleanQuery = typeof query === 'string' ? query.trim() : '';

    if (!cleanQuery) {
      return res.status(400).json({
        success: false,
        error: 'Location query is required.'
      });
    }

    const cacheKey = cleanQuery.toLowerCase();
    const cached = fwdCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return res.status(200).json(cached.payload);
    }

    // Query OpenStreetMap Nominatim
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery + ', India')}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MediKioskAI-HealthSystem/1.0 (Leaflet-OSM Geocoder)'
          },
          signal: AbortSignal.timeout(6000)
        }
      );

      if (osmRes.ok) {
        const osmData: any = await osmRes.json();
        const first = osmData?.[0];
        if (first) {
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          const addr = first.address || {};
          const city = addr.city || addr.town || addr.district || addr.county || cleanQuery;
          const state = addr.state || '';

          const payload = {
            success: true,
            location: {
              formattedAddress: first.display_name || cleanQuery,
              displayName: city ? (state ? `${city}, ${state}` : city) : cleanQuery,
              area: addr.suburb || addr.neighbourhood || city,
              city,
              state,
              country: addr.country || 'India',
              latitude: lat,
              longitude: lng
            }
          };

          if (fwdCache.size > 200) {
            const firstK = fwdCache.keys().next().value;
            if (firstK) fwdCache.delete(firstK);
          }
          fwdCache.set(cacheKey, { timestamp: Date.now(), payload });
          return res.status(200).json(payload);
        }
      }
    } catch (osmErr) {
      console.warn('Nominatim forward geocode notice:', osmErr);
    }

    return res.status(404).json({
      success: false,
      error: `Could not find coordinates for "${cleanQuery}". Please check the spelling or specify the district/state.`
    });
  } catch (error: any) {
    console.error('Error in /api/geocode/forward:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to forward geocode query'
    });
  }
}
