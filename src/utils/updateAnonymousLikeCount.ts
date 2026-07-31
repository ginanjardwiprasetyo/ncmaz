import { getWordPressUrlNoSlash } from './getWordPressUrlNoSlash'
import { getAnonymousUserId } from './anonymousUserId'

type Result = { result: string; new_count: number | null }

export async function updateAnonymousLikeCount(
	postId: number,
	number: 'ADD_1' | 'REMOVE_1',
): Promise<Result> {
	const res = await fetch(`${getWordPressUrlNoSlash()}/index.php?graphql`, {
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
			variables: { post_id: postId, user_id: getAnonymousUserId() },
		}),
	})
	const json = await res.json()
	return json?.data?.ncmazFaustUpdateUserReactionPostCount
}
