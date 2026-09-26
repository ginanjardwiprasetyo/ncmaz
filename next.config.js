const { withFaust } = require('@faustwp/core')
const { createSecureHeaders } = require('next-secure-headers')

const WP_HOSTNAME = (process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/^https?:\/\//, '').replace(/\/+$/, '')) || 'live-rekayasa.pantheonsite.io'

/**
 * @type {import('next').NextConfig}
 **/
module.exports = withFaust({
	compress: true,
	trailingSlash: true,
	reactStrictMode: true,
	// Lighthouse "large first-party JS without source maps" — maps are only
	// fetched when devtools opens, zero runtime cost
	productionBrowserSourceMaps: true,
	experimental: {
		typedRoutes: false,
		// inline critical CSS, sisanya load async -> hilangkan render-blocking request
		optimizeCss: true,
	},
	async redirects() {
		return [
			{
				source: '/index/',
				destination: '/',
				permanent: true,
			},
		]
	},
	images: {
		loader: 'custom',
		loaderFile: './src/components/MyImage.loader.ts',
		formats: ['image/avif', 'image/webp'],
		// ponytail: default deviceSizes jumps 1080 -> 1920, LCP images at
		// ~1280 displayed were served 47% oversize; quality 75 -> 70
		deviceSizes: [640, 750, 828, 1080, 1200, 1280, 1440, 1600, 1920, 2048, 3840],
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'http',
				hostname: WP_HOSTNAME,
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: WP_HOSTNAME,
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '0.gravatar.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '1.gravatar.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '2.gravatar.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '3.gravatar.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'secure.gravatar.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'images.pexels.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
				port: '',
				pathname: '/**',
			},
			// from env
			{
				protocol: 'https',
				hostname:
					process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME_1 || '1.gravatar.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname:
					process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME_2 || '1.gravatar.com',
				port: '',
				pathname: '/**',
			},
		],
	},
	async headers() {
		return [
			{
				source: '/:path*',
				headers: createSecureHeaders({
					xssProtection: false,
					frameGuard: [
						'allow-from',
						{ uri: process.env.NEXT_PUBLIC_WORDPRESS_URL },
					],
				}),
			},
		]
	},
})
