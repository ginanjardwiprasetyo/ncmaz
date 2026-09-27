import type { NextApiRequest, NextApiResponse } from 'next'

// ponytail: proxy GraphQL minimal — HANYA teruskan method/query/body + auth
// header, jangan teruskan cookie/sec-fetch/priority browser ke Pantheon.
// Header cookie + set browser memicu Cloudflare challenge (403 "Just a moment")
// di origin WP, dan 403 itu tidak bawa header CORS -> browser error
// "TypeError: Failed to fetch".
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const method = req.method === 'GET' || req.method === 'POST' ? req.method : null
	if (!method) {
		res.setHeader('Allow', 'GET, POST')
		res.status(405).end()
		return
	}

	const wp = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/+$/, '')
	if (!wp) {
		res.status(500).json({ errors: [{ message: 'WP URL not configured' }] })
		return
	}

	// Apollo kirim query sebagai GET (NEXT_PUBLIC_SITE_API_METHOD=GET);
	// endpoint asli sudah punya "?graphql" jadi sambung dengan "&"
	const qs = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : ''

	const headers: Record<string, string> = {}
	if (method === 'POST') headers['content-type'] = 'application/json'
	const auth = req.headers.authorization
	if (auth) headers.authorization = auth

	try {
		const upstream = await fetch(`${wp}/index.php?graphql${qs ? `&${qs}` : ''}`, {
			method,
			headers,
			body: method === 'POST' ? JSON.stringify(req.body ?? {}) : undefined,
		})
		const text = await upstream.text()
		res.status(upstream.status)
		res.setHeader(
			'content-type',
			upstream.headers.get('content-type') || 'application/json',
		)
		res.send(text)
	} catch {
		res.status(502).json({ errors: [{ message: 'Upstream GraphQL failed' }] })
	}
}
