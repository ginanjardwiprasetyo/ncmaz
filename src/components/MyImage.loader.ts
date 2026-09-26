export default function wpImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
	const q = quality || 60

	// Local (public/) files: /_next/image is broken here (trailingSlash:true
	// redirects it to a path the optimizer rejects), so proxy via wsrv.nl
	// like the PNG branch below. wsrv does not upscale past the source.
	if (src.startsWith('/')) {
		const origin = (process.env.NEXT_PUBLIC_URL || '')
			.replace(/^https?:\/\//, '')
			.replace(/\/$/, '')
		return `https://wsrv.nl/?url=${encodeURIComponent(origin + src)}&w=${width}&q=${q}&output=webp&we=1`
	}

	// Photon/i0.wp.com: same helper, strips the photon prefix back to origin
	const viaWsrv = (raw: string) =>
		`https://wsrv.nl/?url=${encodeURIComponent(
			raw.replace(/^https?:\/\//, ''),
		)}&w=${width}&q=${q}&output=webp&we=1`

	// For WordPress Jetpack/Photon proxied images
	if (src.includes('i0.wp.com') || src.includes('i1.wp.com') || src.includes('i2.wp.com')) {
		const u = new URL(src)
		// ponytail: Photon ignores q on webp sources (byte-identical at q70..q40) — wsrv re-encodes
		return viaWsrv(`https://${u.host}${u.pathname}`)
	}

	// For direct WordPress images — wsrv re-encodes both PNG and jpg/webp (Photon skips webp q)
	const wpHost = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '')
	if (wpHost && src.includes(wpHost)) {
		return viaWsrv(src)
	}

	// For other external images, return as-is (unoptimized)
	return src
}
