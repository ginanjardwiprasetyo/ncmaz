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

	// Faust menghapus cookie refresh dengan Path yang salah (tanpa Path=/),
	// sehingga cookie basi tidak pernah hilang -> 401 di setiap load halaman.
	// Kalau refresh tanpa ?code= gagal, anggap "tidak ada sesi" dan hapus cookie-nya.
	if (route === 'auth/token' && !req.query.code) {
		const end = res.end.bind(res)
		res.end = ((chunk?: unknown, ...rest: unknown[]) => {
			if (res.statusCode !== 401) {
				return (end as (...a: unknown[]) => void)(chunk, ...rest)
			}
			const stale = (req.headers.cookie || '')
				.split(';')
				.map(c => c.trim().split('=')[0])
				.filter(name => name.endsWith('-rt'))
			res.statusCode = 200
			res.setHeader('Content-Type', 'application/json')
			if (stale.length) {
				res.setHeader(
					'Set-Cookie',
					stale
						.map(
							name =>
								`${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`,
						)
						.join(', '),
				)
			}
			return (end as (...a: unknown[]) => void)(
				JSON.stringify({ accessToken: null }),
			)
		}) as typeof res.end
	}

	return apiRouter(req, res)
}
