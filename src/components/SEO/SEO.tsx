import Head from 'next/head'
import { useRouter } from 'next/router'

/**
 * Path canonical selalu trailing slash (next.config trailingSlash: true).
 * Home kadang ter-resolve sebagai /index/ padahal di-redirect ke /.
 */
export function useCanonicalPath() {
	const router = useRouter()
	const path = router.asPath.split('?')[0].split('#')[0]
	const normalized = path === '/index/' ? '/' : path
	return normalized !== '/' && !normalized.endsWith('/')
		? normalized + '/'
		: normalized
}

interface Props {
	title?: string | null
	description?: string | null
	imageUrl?: string | null
	url?: string | null
	ogType?: 'website' | 'article'
	publishedTime?: string | null
	modifiedTime?: string | null
	/** Array skema.org (Article, BreadcrumbList, ...) — di-stringify apa adanya. */
	structuredData?: object[] | null
}

/**
 * Provide SEO related meta tags to a page.
 *
 * @param {Props} props The props object.
 * @param {string} props.title Used for the page title, og:title, twitter:title, etc.
 * @param {string} props.description Used for the meta description, og:description, twitter:description, etc.
 * @param {string} props.imageUrl Used for the og:image and twitter:image. NOTE: Must be an absolute url.
 * @param {string} props.url Used for the og:url and twitter:url.
 *
 * @returns {React.ReactElement} The SEO component
 */
export default function SEO({
	title,
	description,
	imageUrl,
	url,
	ogType,
	publishedTime,
	modifiedTime,
	structuredData,
}: Props) {
	if (
		!title &&
		!description &&
		!imageUrl &&
		!url &&
		!structuredData?.length
	) {
		return null
	}

	const descriptionNoHtmlTags = description?.replace(/<[^>]*>?/gm, '') || ''

	// self-referencing canonical
	const canonicalPath = useCanonicalPath()
	const canonical =
		(process.env.NEXT_PUBLIC_URL || '').replace(/\/$/, '') + canonicalPath
	const pageUrl = url || canonical

	return (
		<>
			<Head>
				<link rel="canonical" href={canonical} />
				<meta property="og:type" content={ogType || 'website'} />
				<meta name="twitter:card" content="summary_large_image" />
				<meta property="og:url" content={pageUrl} />
				<meta name="twitter:url" content={pageUrl} />

				{publishedTime && (
					<meta
						property="article:published_time"
						content={publishedTime}
					/>
				)}
				{modifiedTime && (
					<meta property="article:modified_time" content={modifiedTime} />
				)}

				{/* \u003c mencegah konten WP menutup tag <script> */}
				{(structuredData || []).map((data, index) => (
					<script
						key={index}
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(data).replace(/</g, '\\u003c'),
						}}
					/>
				))}

				{title && (
					<>
						<title>{title}</title>
						<meta name="title" content={title} />
						<meta property="og:title" content={title} />
						<meta name="twitter:title" content={title} />
					</>
				)}

				{!!descriptionNoHtmlTags && (
					<>
						<meta name="description" content={descriptionNoHtmlTags} />
						<meta property="og:description" content={descriptionNoHtmlTags} />
						<meta
							name="twitter:description"
							content={descriptionNoHtmlTags}
						/>
					</>
				)}

				{imageUrl && (
					<>
						<meta property="og:image" content={imageUrl} />
						<meta name="twitter:image" content={imageUrl} />
					</>
				)}
			</Head>
		</>
	)
}
