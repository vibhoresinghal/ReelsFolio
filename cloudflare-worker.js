/**
 * Cloudflare Worker for ReelsFolio Like Counter
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://dash.cloudflare.com/ and create an account (free)
 * 2. Go to Workers & Pages → Create Worker
 * 3. Replace the default code with this file's contents
 * 4. Go to Workers & Pages → KV → Create namespace called "LIKES"
 * 5. In your worker settings, bind the KV namespace:
 *    - Variable name: LIKES
 *    - KV Namespace: (select the one you created)
 * 6. Deploy and note your worker URL (e.g., https://reelsfolio-likes.YOUR-SUBDOMAIN.workers.dev)
 * 7. Update the WORKER_URL in your index.html
 */

export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        const url = new URL(request.url);
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        };

        try {
            // GET /likes?videoId=xxx - Get like count for a video
            if (request.method === 'GET' && url.pathname === '/likes') {
                const videoId = url.searchParams.get('videoId');

                if (!videoId) {
                    return new Response(JSON.stringify({ error: 'videoId required' }), {
                        status: 400,
                        headers: corsHeaders,
                    });
                }

                const count = await env.LIKES.get(videoId);
                return new Response(JSON.stringify({
                    videoId,
                    count: count ? parseInt(count) : 0
                }), {
                    headers: corsHeaders,
                });
            }

            // POST /likes - Increment like count for a video
            if (request.method === 'POST' && url.pathname === '/likes') {
                const body = await request.json();
                const { videoId, increment = 1 } = body;

                if (!videoId) {
                    return new Response(JSON.stringify({ error: 'videoId required' }), {
                        status: 400,
                        headers: corsHeaders,
                    });
                }

                // Get current count
                const currentCount = await env.LIKES.get(videoId);
                const newCount = (currentCount ? parseInt(currentCount) : 0) + increment;

                // Save new count
                await env.LIKES.put(videoId, newCount.toString());

                return new Response(JSON.stringify({
                    videoId,
                    count: newCount
                }), {
                    headers: corsHeaders,
                });
            }

            // GET /likes/all - Get all like counts (for initial page load)
            if (request.method === 'GET' && url.pathname === '/likes/all') {
                const list = await env.LIKES.list();
                const likes = {};

                for (const key of list.keys) {
                    const count = await env.LIKES.get(key.name);
                    likes[key.name] = parseInt(count) || 0;
                }

                return new Response(JSON.stringify(likes), {
                    headers: corsHeaders,
                });
            }

            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: corsHeaders,
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: corsHeaders,
            });
        }
    },
};
