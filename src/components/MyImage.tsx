import Image, { ImageProps } from 'next/image'
import { FC } from 'react'

export interface Props extends ImageProps {
	enableDefaultPlaceholder?: boolean
	defaultPlaceholderDataUrl?: string
}

const MyImage: FC<Props> = ({
	enableDefaultPlaceholder = false,
	defaultPlaceholderDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+vx1PQAIqAM4jZDFJQAAAABJRU5ErkJggg==',
	...props
}) => {
	return (
		<Image
			{...props}
			sizes={props.sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
			className={`${props.className} ${
				props.src ? '' : 'dark:brightness-75 dark:filter'
			}`}
			src={props.src || '/images/placeholder.png'}
		/>
	)
}

export default MyImage
