import 'react'

declare module 'react' {
	interface FormHTMLAttributes<T> {
		toolname?: string
		tooldescription?: string
		toolautosubmit?: string
	}
	interface InputHTMLAttributes<T> {
		toolparamdescription?: string
	}
	interface TextareaHTMLAttributes<T> {
		toolparamdescription?: string
	}
	interface SelectHTMLAttributes<T> {
		toolparamdescription?: string
	}
}

export {}
