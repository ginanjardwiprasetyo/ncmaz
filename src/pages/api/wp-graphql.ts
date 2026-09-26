import type { NextApiRequest, NextApiResponse } from 'next'

// ponytail: proxy GraphQL minimal — HANYA teruskan body, jangan teruskan
// cookie/sec-fetch/priority browser ke Pantheon. Header cookie + set browser
// memicu Cloudflare challenge (403 "Just a moment") di origin WP.
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST')
		res.status(405).end()
		return
	}

	const wp = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/+$/, '')
	if (!wp) {
		res.status(500).json({ errors: [{ message: 'WP URL not configured' }] })
		return
	}

	try {
		const upstream = await fetch(`${wp}/index.php?graphql`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(req.body ?? {}),
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
