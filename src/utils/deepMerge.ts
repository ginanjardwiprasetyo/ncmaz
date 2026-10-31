/**
 * Pengganti lodash/merge untuk `site-settings.json` di atas `default-site-settings`.
 * lodash/merge menarik rantai ~50 file ke bundle `_app` yang cuma untuk merge
 * dua objek config ini. Semantik disamakan: objek merge rekursif, array per-index.
 */
export default function deepMerge<T extends Record<string, any>>(
	...sources: (Record<string, any> | undefined | null)[]
): T {
	const target: Record<string, any> = {}
	for (const source of sources) {
		if (!source) continue
		for (const key of Object.keys(source)) {
			const value = source[key]
			// lodash/merge mengabaikan nilai undefined di source (key target tetap)
			if (value === undefined) continue
			if (Array.isArray(value)) {
				const base = Array.isArray(target[key]) ? target[key] : []
				value.forEach((item, i) => {
					base[i] = isMergeable(base[i]) && isMergeable(item)
						? deepMerge(base[i], item)
						: item
				})
				target[key] = base
			} else if (isMergeable(value)) {
				target[key] = deepMerge(
					isMergeable(target[key]) ? target[key] : {},
					value,
				)
			} else {
				target[key] = value
			}
		}
	}
	return target as T
}

function isMergeable(value: any): value is Record<string, any> {
	return !!value && typeof value === 'object' && !Array.isArray(value)
}
