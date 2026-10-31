import { GetServerSideProps } from 'next'
import { gql } from '@apollo/client'
import { getApolloClient } from '@faustwp/core'
import { NC_SITE_SETTINGS } from '@/contains/site-settings'

const SITE_URL = process.env.NEXT_PUBLIC_URL
const SITE_TITLE = NC_SITE_SETTINGS.site_info?.site_title || ''
const SITE_DESCRIPTION = NC_SITE_SETTINGS.site_info?.site_description || ''
const FEED_SIZE = 20

const FEED_QUERY = gql`
	query NcFeedQuery($first: Int) {
		posts(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
			nodes {
				title
				uri
				date
				excerpt
			}
		}
	}
`

const esc = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')

// ponytail: excerpt may carry HTML/entities from WP, strip tags before escaping
const plainText = (value: string) => esc(value.replace(/<[^>]*>/g, ' ').trim())

export default function Feed() {
	return null
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const { data } = await getApolloClient().query({
		query: FEED_QUERY,
		variables: { first: FEED_SIZE },
		fetchPolicy: 'no-cache',
	})

	const items = (data?.posts?.nodes || [])
		.filter((node: { uri?: string | null }) => !!node.uri)
		.map((node: { title: string; uri: string; date: string; excerpt?: string | null }) => {
			const link = `${SITE_URL}${node.uri}`
			return [
				'<item>',
				`<title>${esc(node.title)}</title>`,
				`<link>${esc(link)}</link>`,
				`<guid isPermaLink="true">${esc(link)}</guid>`,
				`<pubDate>${new Date(node.date).toUTCString()}</pubDate>`,
				`<description>${plainText(node.excerpt || node.title)}</description>`,
				'</item>',
			].join('')
		})
		.join('')

	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0">',
		'<channel>',
		`<title>${esc(SITE_TITLE)}</title>`,
		`<link>${esc(SITE_URL || '')}</link>`,
		`<description>${esc(SITE_DESCRIPTION)}</description>`,
		`<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
		items,
		'</channel>',
		'</rss>',
	].join('')

	ctx.res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
	ctx.res.write(xml)
	ctx.res.end()

	return { props: {} }
}
