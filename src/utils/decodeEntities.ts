/**
 * Pengganti `decode` dari html-entities (~65KB named-references ikut ke bundle `_app`).
 * Browser: textarea.innerHTML — RCDATA, jadi semua entity resmi HTML ter-decode tanpa
 * mem-parse tag. SSR (errorHandling/Error tidak selalu jalan di client): fallback regex
 * untuk entity numerik + nama umum.
 */
const NAMED: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: '\u00a0',
	hellip: '…',
	mdash: '—',
	ndash: '–',
	lsquo: '‘',
	rsquo: '’',
	ldquo: '“',
	rdquo: '”',
	copy: '©',
	reg: '®',
	deg: '°',
	plusmn: '±',
	times: '×',
	divide: '÷',
	euro: '€',
	pound: '£',
	sect: '§',
	para: '¶',
	bull: '•',
	laquo: '«',
	raquo: '»',
}

function decodeFallback(text: string): string {
	return text.replace(
		/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g,
		(match, entity: string) => {
			if (entity[0] === '#') {
				const isHex = entity[1] === 'x' || entity[1] === 'X'
				const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10)
				return Number.isNaN(code) ? match : String.fromCodePoint(code)
			}
			return NAMED[entity.toLowerCase()] ?? match
		},
	)
}

export default function decode(text?: string | null): string {
	if (!text) return ''
	if (typeof document !== 'undefined') {
		const el = document.createElement('textarea')
		el.innerHTML = text
		return el.value
	}
	return decodeFallback(text)
}
