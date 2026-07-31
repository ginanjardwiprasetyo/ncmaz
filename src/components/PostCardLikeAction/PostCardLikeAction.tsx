'use client'

import { FC, useEffect, useMemo, useState } from 'react'
import convertNumbThousand from '@/utils/convertNumbThousand'
import { useMutation } from '@apollo/client'
import { NC_MUTATION_UPDATE_USER_REACTION_POST_COUNT } from '@/fragments/mutations'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/stores/store'
import {
	NcmazFcUserReactionPostActionEnum,
	NcmazFcUserReactionPostNumberUpdateEnum,
	NcmazFcUserReactionPostUpdateResuiltEnum,
} from '@/__generated__/graphql'
import { updateViewerAllReactionPosts } from '@/stores/viewer/viewerSlice'
import { updateAnonymousLikeCount } from '@/utils/updateAnonymousLikeCount'

import toast from 'react-hot-toast'
import { FavouriteIcon } from '../Icons/Icons'

const LS_KEY_LIKED = 'ncmaz_anonymous_liked'

function getLikedFromLS(): number[] {
	try {
		const raw = localStorage.getItem(LS_KEY_LIKED)
		return raw ? JSON.parse(raw) : []
	} catch {
		return []
	}
}

function toggleLikedInLS(postId: number): boolean {
	const liked = getLikedFromLS()
	const idx = liked.indexOf(postId)
	if (idx > -1) {
		liked.splice(idx, 1)
		localStorage.setItem(LS_KEY_LIKED, JSON.stringify(liked))
		return false
	}
	liked.push(postId)
	localStorage.setItem(LS_KEY_LIKED, JSON.stringify(liked))
	return true
}

function isLikedInLS(postId: number): boolean {
	return getLikedFromLS().includes(postId)
}

export interface PostCardLikeActionProps {
	className?: string
	sizeClassName?: string
	likeCount: number
	postDatabseId: number
}

const PostCardLikeAction: FC<PostCardLikeActionProps> = ({
	className = '',
	sizeClassName = 'h-9 w-9 ',
	likeCount: likeCountProp = 34,
	postDatabseId,
}) => {
	const [likeCountState, setLikeCountState] = useState(likeCountProp)
	const [likedAnon, setLikedAnon] = useState(() => isLikedInLS(postDatabseId))
	//
	const [handleUpdateReactionCount, { loading, error, data, called }] =
		useMutation(NC_MUTATION_UPDATE_USER_REACTION_POST_COUNT)
	//
	const { viewer, viewerReactionPosts, authorizedUser } = useSelector(
		(state: RootState) => state.viewer,
	)
	const likesCountOkFromStore = useSelector(
		(state: RootState) =>
			state.postsNcmazMetaDataOk[postDatabseId]?.ncPostMetaData?.likesCount,
	)
	const dispatch = useDispatch()

	const { isAuthenticated, isReady } = authorizedUser

	//
	useEffect(() => {
		if (likesCountOkFromStore == undefined || likesCountOkFromStore == null) {
			return
		}

		setLikeCountState(likesCountOkFromStore || 0)
	}, [likesCountOkFromStore])

	// handle dispatch update viewer reaction posts
	const handleDispatchUpdateViewerReactionPosts = (
		postDatabseId: number,
		type?: NcmazFcUserReactionPostUpdateResuiltEnum | null,
		number?: NcmazFcUserReactionPostNumberUpdateEnum | null,
	) => {
		let newViewerReactionPosts = viewerReactionPosts

		// neu type === Added -> them vao list binh thuong
		if (type === NcmazFcUserReactionPostUpdateResuiltEnum.Added) {
			newViewerReactionPosts = [
				...(viewerReactionPosts || []).filter(
					(post) => !post.title?.includes(`${postDatabseId},LIKE`),
				),
				{
					title: `${postDatabseId},LIKE`,
					id: String(new Date()),
					isNewAddedFromClient: true,
					newLikedCount: likeCountState + 1,
				},
			]

			// update like count
			setLikeCountState(likeCountState + 1)
		}

		if (type === NcmazFcUserReactionPostUpdateResuiltEnum.Removed) {
			// neu type === Remove -> xoa khoi list binh thuong
			newViewerReactionPosts = (viewerReactionPosts || []).map((post) => {
				if (!post.title?.includes(`${postDatabseId},LIKE`)) {
					return post
				} else {
					return {
						...post,
						isNewAddedFromClient: false,
						isNewUnLikeFromClient: true,
						newLikedCount: likeCountState > 0 ? likeCountState - 1 : 0,
					}
				}
			})
			// update like count
			setLikeCountState(likeCountState > 0 ? likeCountState - 1 : 0)
		}

		if (type === NcmazFcUserReactionPostUpdateResuiltEnum.Error) {
			// neu type === Error -> kiem tra xem hanh dong nay la dang remove hay add,
			// vi la Error nen se phai thuc hien nguoc lai voi hanh dong truoc do, vi truoc do da thuc hien dispatch tam 1 lan len redux roi
			// neu la remove -> them lai vao list.
			if (number === NcmazFcUserReactionPostNumberUpdateEnum.Remove_1) {
				newViewerReactionPosts = [
					...(viewerReactionPosts || []).filter(
						(p) => !p.title?.includes(`${postDatabseId},LIKE`),
					),
					{
						title: `${postDatabseId},LIKE`,
						id: String(new Date()),
					},
				]
				// update like count
				setLikeCountState(likeCountState + 1)
			}
			// Neu la add -> xoa khoi list
			if (number === NcmazFcUserReactionPostNumberUpdateEnum.Add_1) {
				newViewerReactionPosts = (viewerReactionPosts || []).filter(
					(post) => !post.title?.includes(`${postDatabseId},LIKE`),
				)

				// update like count
				setLikeCountState(likeCountState > 0 ? likeCountState - 1 : 0)
			}
		}

		dispatch(updateViewerAllReactionPosts(newViewerReactionPosts))
	}
	//

	// check is isLiked
	const isLiked = useMemo(() => {
		if (isAuthenticated) {
			return viewerReactionPosts?.some(
				(post) =>
					post.title?.trim() == `${postDatabseId},LIKE` &&
					!post.isNewUnLikeFromClient,
			)
		}
		return likedAnon
	}, [viewer, viewerReactionPosts, isAuthenticated, likedAnon, postDatabseId])
	//

	// handle update viewerReactionPosts to redux store
	useEffect(() => {
		if (loading || !isReady || !isAuthenticated) {
			return
		}

		if (
			error ||
			data?.ncmazFaustUpdateUserReactionPostCount?.result ===
				NcmazFcUserReactionPostUpdateResuiltEnum.Error
		) {
			console.log('___NcBookmark___error', { error, data })
			toast.error('An error occurred, please try again later.')
			// dispatch update viewer reaction posts -> when update have error
			handleDispatchUpdateViewerReactionPosts(
				postDatabseId,
				NcmazFcUserReactionPostUpdateResuiltEnum.Error,
				data?.ncmazFaustUpdateUserReactionPostCount?.number,
			)
		}
	}, [data, error, loading, isReady, isAuthenticated])

	// handle click like action
	const handleClickAction = async () => {
		if (!isReady) {
			toast.error('Please wait a moment, data is being prepared.')
			return
		}

		if (isAuthenticated) {
			if (!viewer?.databaseId) {
				toast.error('Please wait a moment, data is being prepared.')
				return
			}

			// check isload like count from server
			const loadingDOM = document.querySelectorAll(
				'.getPostsNcmazMetaByIds_is_loading',
			)
			if (!!loadingDOM?.length) {
				toast.error('Please wait a moment, data is being refreshed.')
				return
			}

			// dispatch pre update viewer reaction posts -> when prepare update to server
			handleDispatchUpdateViewerReactionPosts(
				postDatabseId,
				isLiked
					? NcmazFcUserReactionPostUpdateResuiltEnum.Removed
					: NcmazFcUserReactionPostUpdateResuiltEnum.Added,
			)

			//  update like count for database
			handleUpdateReactionCount({
				variables: {
					post_id: postDatabseId,
					user_id: viewer.databaseId,
					reaction: NcmazFcUserReactionPostActionEnum.Like,
					number: isLiked
						? NcmazFcUserReactionPostNumberUpdateEnum.Remove_1
						: NcmazFcUserReactionPostNumberUpdateEnum.Add_1,
				},
			})
		} else {
			const nowLiked = toggleLikedInLS(postDatabseId)
			setLikedAnon(nowLiked)
			setLikeCountState((prev) =>
				nowLiked ? prev + 1 : prev > 0 ? prev - 1 : 0,
			)

			//  update like count for database (anonymous user)
			try {
				const result = await updateAnonymousLikeCount(
					postDatabseId,
					nowLiked ? 'ADD_1' : 'REMOVE_1',
				)
				if (!result) {
					throw new Error('No result from server')
				}
			} catch (err) {
				console.log('___PostCardLikeAction___anon_error', err)
				// roll back optimistic like
				toggleLikedInLS(postDatabseId)
				setLikedAnon(nowLiked ? false : true)
				setLikeCountState((prev) =>
					nowLiked ? (prev > 0 ? prev - 1 : 0) : prev + 1,
				)
				toast.error('An error occurred, please try again later.')
			}
		}
	}

	// handle update like count when have update from store
	const actualLikeCount = useMemo(() => {
		if (!isAuthenticated) {
			return likeCountState
		}
		if (!viewerReactionPosts?.length) {
			return likeCountState
		}
		const viewerReactionPost = viewerReactionPosts?.find(
			(post) => post.title?.trim() == `${postDatabseId},LIKE`,
		)
		if (typeof viewerReactionPost?.newLikedCount === 'number') {
			return viewerReactionPost?.newLikedCount
		}
		return likeCountState
	}, [likeCountState, viewerReactionPosts, isAuthenticated])

	return (
		<button
			className={`nc-PostCardLikeAction group/PostCardLikeAction relative flex items-center text-xs leading-none transition-colors ${className} ${
				isLiked
					? 'text-rose-600 dark:text-rose-500'
					: 'text-neutral-700 hover:text-rose-600 dark:text-neutral-200 dark:hover:text-rose-400'
			} `}
			onClick={handleClickAction}
			title={isLiked ? 'Unlike' : 'Like this post'}
		>
			<div
				className={`${sizeClassName} flex flex-shrink-0 items-center justify-center rounded-full transition-colors duration-75 ${
					isLiked
						? 'bg-rose-50 dark:bg-rose-200/15'
						: 'bg-neutral-50 group-hover/PostCardLikeAction:bg-rose-50 dark:bg-neutral-800 dark:group-hover/PostCardLikeAction:bg-rose-100/10'
				}`}
			>
				<FavouriteIcon
					color={'currentColor'}
					fill={isLiked ? 'currentColor' : 'none'}
					className="h-[18px] w-[18px]"
				/>
			</div>

			<span
				className={`ms-2 min-w-[1.125rem] flex-shrink-0 text-start transition-colors duration-75 ${
					isLiked
						? 'text-rose-600 dark:text-rose-500'
						: 'text-neutral-900 dark:text-neutral-200'
				}`}
			>
				{actualLikeCount ? convertNumbThousand(actualLikeCount) : 0}
			</span>
		</button>
	)
}

export default PostCardLikeAction
