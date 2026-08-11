export default function wpImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
	const q = quality || 75

	// For WordPress Jetpack/Photon proxied images
	if (src.includes('i0.wp.com') || src.includes('i1.wp.com') || src.includes('i2.wp.com')) {
		const url = new URL(src)
		url.searchParams.set('w', String(width))
		url.searchParams.set('q', String(q))
		url.searchParams.set('ssl', '1')
		return url.toString()
	}

	// For direct WordPress images, use Jetpack Photon proxy
	if (src.includes('live-rekayasa.pantheonsite.io')) {
		return `https://i0.wp.com/${src.replace('https://', '').replace('http://', '')}?w=${width}&q=${q}&ssl=1`
	}

	// For other external images, return as-is (unoptimized)
	return src
}
