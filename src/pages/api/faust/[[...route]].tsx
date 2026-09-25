import '../../../../faust.config'
import { apiRouter } from '@faustwp/core'
import type { NextApiRequest, NextApiResponse } from 'next'

// Faust's authorizeHandler always proxies to WP; for anonymous visitors
// (no refresh-token cookie, no ?code=) that returns 401 and Chrome logs a
// console error on every page load. Answer the "no session" case locally.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
	const route = ([] as string[]).concat(req.query.route || []).join('/')
	const hasRefreshCookie = (req.headers.cookie || '')
		.split(';')
		.some(c => c.trim().split('=')[0].endsWith('-rt'))

	if (route === 'auth/token' && !req.query.code && !hasRefreshCookie) {
		res.status(200).json({ accessToken: null })
		return
	}

	return apiRouter(req, res)
}
