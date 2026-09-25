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

// GA4 runs inside a Partytown web worker so gtag.js stays off the main thread (TBT)
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
					__html: `window.partytown={forward:['dataLayer.push','gtag']}`,
				}}
			/>
			<Script
				id="partytown"
				src="/~partytown/partytown.js"
				strategy="afterInteractive"
			/>
			<Script
				id="ga4-src"
				type="text/partytown"
				strategy="afterInteractive"
				src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
			/>
			<Script
				id="ga4-init"
				type="text/partytown"
				strategy="afterInteractive"
				dangerouslySetInnerHTML={{
					__html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
				}}
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
