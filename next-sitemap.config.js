/** @type {import('next-sitemap').IConfig} */

const SITE_URL = process.env.NEXT_PUBLIC_URL // Update with your site URL if needed

module.exports = {
	siteUrl: SITE_URL,
	generateRobotsTxt: true,
	exclude: [
		'/submission',
		'/dashboard/posts/published',
		'/dashboard/posts/draft',
		'/dashboard/posts/pending',
		'/dashboard/posts/trash',
		'/dashboard/posts/schedule',
		'/dashboard/edit-profile/general',
		'/dashboard/edit-profile/profile',
		'/dashboard/edit-profile/password',
		'/dashboard/edit-profile/socials',
		'/ncmaz_for_ncmazfc_preview_blocks',
		'/preview',
		'/reset-password',
		'/readinglist',
		'/dashboard',
		'/dashboard/edit-profile',
		'/dashboard/posts',
		'/wordpress-sitemap.xml', // Keep this to exclude the WordPress sitemap itself
	],
	robotsTxtOptions: {
		additionalSitemaps: [`${SITE_URL}/wordpress-sitemap.xml`],
	},
	transform: async (config, path) => {
		// Get the current date in W3C datetime format (sitemap protocol)
		const formattedDate = new Date().toISOString()

		// Define paths to assign low priority
		const lowPriorityPaths = ['/contact', '/login', '/sign-up'] // Check paths without the trailing slashes
		const isLowPriority = lowPriorityPaths.includes(path.replace(/\/$/, '')) // Remove trailing slash before checking
		const isHomePage = path === '/'

		// Set the change frequency based on the page type
		let changefreq = 'daily' // Default to daily
		if (isHomePage) {
			changefreq = 'always' // Home page changes always
		} else if (isLowPriority) {
			changefreq = 'monthly' // Low-priority pages change less often
		}

		const priority = isLowPriority ? 0.1 : 1.0 // Low priority for specific pages

		console.log('Transforming:', path, {
			priority,
			changefreq,
			lastmod: formattedDate,
		})

		return {
			loc: `${SITE_URL}${path}`, // Ensure loc URL is correct
			lastmod: formattedDate, // W3C datetime
			priority: priority, // Set priority
			changefreq: changefreq, // Set change frequency
		}
	},
}
