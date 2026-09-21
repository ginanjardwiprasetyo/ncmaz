import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Method not allowed' })
	}

	const secret = req.headers['x-revalidate-secret']
	if (secret !== process.env.REVALIDATE_SECRET) {
		return res.status(401).json({ message: 'Invalid secret' })
	}

	const { slug } = req.body
	if (!slug) {
		return res.status(400).json({ message: 'Missing slug' })
	}

	try {
		await res.revalidate(`/${slug}`)
		return res.json({ revalidated: true, slug })
	} catch (err) {
		return res.status(500).json({ message: 'Error revalidating' })
	}
}
