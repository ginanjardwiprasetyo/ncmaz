import '@/../faust.config'
import React from 'react'
import { useRouter } from 'next/router'
import { FaustProvider } from '@faustwp/core'
import '@/styles/globals.css'
import '@/styles/index.scss'
import { AppProps } from 'next/app'
import { WordPressBlocksProvider, fromThemeJson } from '@faustwp/blocks'
import blocks from '@/wp-blocks'
import { Poppins } from 'next/font/google'
import SiteWrapperProvider from '@/container/SiteWrapperProvider'
import { Toaster } from 'react-hot-toast'
import NextNProgress from 'nextjs-progressbar'
import themeJson from '@/../theme.json'
import Script from 'next/script'
import dynamic from 'next/dynamic'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// Plain async gtag. Measured (4x CPU, prod): partytown added ~1-1.5s main-thread
// (sandbox proxy) vs ~0 for plain async gtag — see prof4 A/B.
function Analytics() {
	const router = useRouter()

	React.useEffect(() => {
		if (!GA_ID) return
		const onRoute = () =>
			(window as any).gtag?.('config', GA_ID, { page_path: router.asPath })
		router.events.on('routeChangeComplete', onRoute)
		return () => {
			router.events.off('routeChangeComplete', onRoute)
		}
	}, [router])

	if (!GA_ID) return null

	return (
		<>
			<script
				dangerouslySetInnerHTML={{
					__html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
				}}
			/>
			<Script
				id="ga4-src"
				strategy="afterInteractive"
				src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
			/>
		</>
	)
}

const DynamicSpeedInsights = dynamic(
	() => import('@vercel/speed-insights/next').then(mod => ({ default: mod.SpeedInsights })),
	{ ssr: false }
)

const poppins = Poppins({
	subsets: ['latin'],
	display: 'swap',
	weight: ['400', '600'],
})

export default function MyApp({ Component, pageProps }: AppProps) {
	const router = useRouter()

	const app = (
		<FaustProvider pageProps={pageProps}>
			<WordPressBlocksProvider
				config={{
					blocks,
					theme: fromThemeJson(themeJson),
				}}
			>
				<SiteWrapperProvider {...pageProps}>
					<style jsx global>{`
						html {
							font-family: ${poppins.style.fontFamily};
						}
					`}</style>
					<NextNProgress color="#818cf8" />
					<Component {...pageProps} key={router.asPath} />
					<Toaster
						position="bottom-left"
						toastOptions={{
							style: {
								fontSize: '14px',
								borderRadius: '0.75rem',
							},
						}}
						containerClassName="text-sm"
					/>
				</SiteWrapperProvider>
			</WordPressBlocksProvider>
		</FaustProvider>
	)

	return (
		<>
			<Analytics />

			<DynamicSpeedInsights/>

			{app}
		</>
	)
}
