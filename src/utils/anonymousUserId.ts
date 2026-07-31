const LS_KEY = 'ncmaz_anon_user_id'

export function getAnonymousUserId(): number {
	let id = parseInt(localStorage.getItem(LS_KEY) || '', 10)
	if (!Number.isInteger(id) || id <= 0) {
		id = Math.floor(1000000 + Math.random() * 900000000)
		localStorage.setItem(LS_KEY, String(id))
	}
	return id
}
