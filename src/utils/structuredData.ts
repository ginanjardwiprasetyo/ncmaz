import { NC_SITE_SETTINGS } from '@/contains/site-settings'

const SITE_URL = (process.env.NEXT_PUBLIC_URL || '').replace(/\/$/, '')
const SITE_TITLE = NC_SITE_SETTINGS.site_info?.site_title || ''
const SITE_DESCRIPTION = NC_SITE_SETTINGS.site_info?.site_description || ''
const SITE_LOGO = `${SITE_URL}${NC_SITE_SETTINGS.site_info?.site_logo || '/logo.png'}`

export type BreadcrumbItem = { name: string; pathname?: string }

/**
 * WP headless bisa mengembalikan uri absolut (domain WP), sedangkan route site
 * ini mengikuti path-nya saja. Dipakai untuk canonical/breadcrumb.
 */
export function toSitePath(uri?: string | null): string {
	if (!uri) return ''
	try {
		const path = uri.startsWith('http') ? new URL(uri).pathname : uri
		return path !== '/' && !path.endsWith('/') ? `${path}/` : path
	} catch {
		return ''
	}
}

/** WebSite + Organization — dipasang sekali di _document, jadi ada di semua halaman. */
export function getSiteJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${SITE_URL}/#website`,
				url: `${SITE_URL}/`,
				name: SITE_TITLE,
				description: SITE_DESCRIPTION,
				inLanguage: 'id',
				publisher: { '@id': `${SITE_URL}/#organization` },
			},
			{
				'@type': 'Organization',
				'@id': `${SITE_URL}/#organization`,
				name: SITE_TITLE,
				url: `${SITE_URL}/`,
				logo: { '@type': 'ImageObject', url: SITE_LOGO },
				description: SITE_DESCRIPTION,
			},
		],
	}
}

export function getArticleJsonLd(input: {
	title: string
	description?: string | null
	imageUrl?: string | null
	pathname: string
	date?: string | null
	modified?: string | null
	authorName?: string | null
	type?: 'Article' | 'WebPage'
}) {
	const canonical = `${SITE_URL}${input.pathname || '/'}`
	// excerpt WP berbentuk HTML — skema.org minta teks polos
	const plainDescription = input.description
		?.replace(/<[^>]*>?/gm, '')
		.replace(/\s+/g, ' ')
		.trim()
	return {
		'@context': 'https://schema.org',
		'@type': input.type || 'Article',
		headline: input.title.slice(0, 110),
		...(plainDescription
			? { description: plainDescription.slice(0, 300) }
			: {}),
		...(input.imageUrl ? { image: input.imageUrl } : {}),
		inLanguage: 'id',
		mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
		...(input.date ? { datePublished: input.date } : {}),
		...(input.modified || input.date
			? { dateModified: input.modified || input.date }
			: {}),
		...(input.authorName
			? { author: { '@type': 'Person', name: input.authorName } }
			: {}),
		publisher: {
			'@type': 'Organization',
			name: SITE_TITLE,
			logo: { '@type': 'ImageObject', url: SITE_LOGO },
		},
	}
}

export function getBreadcrumbJsonLd(items: BreadcrumbItem[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			...(item.pathname ? { item: `${SITE_URL}${item.pathname}` } : {}),
		})),
	}
}
