import { getAnonymousUserId } from './anonymousUserId'

type Result = { result: string; new_count: number | null }

async function callOnce(
	postId: number,
	number: 'ADD_1' | 'REMOVE_1',
	userId: number,
): Promise<Result | null> {
	// same-origin via API route (src/pages/api/wp-graphql.ts) — tanpa CORS,
	// cookie browser tidak diteruskan ke Pantheon
	const res = await fetch('/api/wp-graphql/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			query: `
        mutation M($post_id: Int, $user_id: Int) {
          ncmazFaustUpdateUserReactionPostCount(
            input: { post_id: $post_id, reaction: LIKE, user_id: $user_id, number: ${number} }
          ) { result new_count }
        }
      `,
			variables: { post_id: postId, user_id: userId },
		}),
	})
	const json = await res.json().catch(() => null)
	return json?.data?.ncmazFaustUpdateUserReactionPostCount || null
}

export async function updateAnonymousLikeCount(
	postId: number,
	number: 'ADD_1' | 'REMOVE_1',
): Promise<Result | null> {
	const userId = getAnonymousUserId()
	// ponytail: 1 retry singkat untuk gangguan transient (jaringan/edge)
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const result = await callOnce(postId, number, userId)
			if (result) return result
		} catch {
			// lanjut retry
		}
		await new Promise((r) => setTimeout(r, 600))
	}
	return null
}
