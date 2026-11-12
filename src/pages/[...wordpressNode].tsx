import { getWordPressProps, WordPressTemplate } from '@faustwp/core'
import { GetStaticProps } from 'next'
import { WordPressTemplateProps } from '../types'
import { REVALIDATE_TIME } from '@/contains/contants'
import { IS_CHISNGHIAX_DEMO_SITE } from '@/contains/site-settings'

export default function Page(props: WordPressTemplateProps) {
	return <WordPressTemplate {...props} />
}

const WP_REST =
	process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/$/, '') || ''

/** ambil semua slug satu endpoint REST WP (100/halaman) — gagal = [] agar build tetap jalan */
async function fetchSlugs(endpoint: string): Promise<string[]> {
	if (!WP_REST) return []
	try {
		const first = await fetch(
			`${WP_REST}/wp-json/wp/v2/${endpoint}?per_page=100&_fields=slug`,
		)
		const totalPages = Number(first.headers.get('X-WP-TotalPages')) || 1
		const pages = [(await first.json()) as any[]]
		for (let page = 2; page <= totalPages; page++) {
			const res = await fetch(
				`${WP_REST}/wp-json/wp/v2/${endpoint}?per_page=100&page=${page}&_fields=slug`,
			)
			pages.push((await res.json()) as any[])
		}
		return pages.flat().map((item) => item?.slug).filter(Boolean)
	} catch (error) {
		console.warn(`myGetPaths: gagal fetch ${endpoint}`, error)
		return []
	}
}

/** path halaman dari URL resmi (menangani halaman bersarang); '' untuk beranda */
async function fetchPagePaths(): Promise<string[]> {
	if (!WP_REST) return []
	try {
		const res = await fetch(
			`${WP_REST}/wp-json/wp/v2/pages?per_page=100&_fields=link`,
		)
		const items = (await res.json()) as any[]
		return items
			.map((item) => {
				try {
					return new URL(item.link).pathname
				} catch {
					return ''
				}
			})
			.filter((path) => path && path !== '/')
	} catch (error) {
		console.warn('myGetPaths: gagal fetch pages', error)
		return []
	}
}

export async function myGetPaths() {
	// Semua konten yang sudah ada di-generate saat build. Tanpa ini, URL yang
	// belum pernah dikunjungi (tag, halaman, arsip) kena fallback blocking ->
	// TTFB menunggu GraphQL WP (~2-4s) — biang TTFB field di Vercel.
	const [posts, categories, tags, pagePaths] = await Promise.all([
		fetchSlugs('posts'),
		fetchSlugs('categories'),
		fetchSlugs('tags'),
		fetchPagePaths(),
	])

	let paths = [
		...posts,
		...categories.map((slug) => 'category/' + slug),
		...tags.map((slug) => 'tag/' + slug),
		...pagePaths.map((path) => path.replace(/^\/+|\/+$/g, '')),
	]

	if (IS_CHISNGHIAX_DEMO_SITE) {
		paths = [
			...paths,
			// Add more demo pages
			'home-2',
			'home-3-podcast',
			'home-4-video',
			'home-5-gallery',
			'home-6',
			'search/posts/',
		]
	}

	return Array.from(new Set(paths)).map((slug) => ({
		params: { wordpressNode: slug.split('/').filter(Boolean) },
	}))
}

export async function getStaticPaths() {
	const paths = await myGetPaths()

	return {
		paths,
		fallback: 'blocking',
	}
}

export const getStaticProps: GetStaticProps = async (ctx) => {
	// WP asal membatasi laju request (429 ~30/menit). Selama build, beri jarak
	// antar prerender agar tak kena limit; saat runtime (fallback blocking)
	// tidak boleh menambah jeda TTFB.
	if (process.env.NEXT_PHASE === 'phase-production-build') {
		await new Promise((resolve) => setTimeout(resolve, 3000))
	}
	return getWordPressProps({ ctx, revalidate: REVALIDATE_TIME })
}
