import dynamic from 'next/dynamic'
import { gql } from '@/__generated__'
import { FOOTER_LOCATION, PRIMARY_LOCATION } from '@/contains/menu'
import { GET_POSTS_FIRST_COMMON } from '@/contains/contants'

// ponytail: Faust only reads .query/.queries/.variables off the entries
// (getWordPressProps + WordPressTemplate effects), never the component at
// config time — so components load per-route via next/dynamic and ~385KB
// of template code (comments, video player, archive UI) stays out of _app.
type Tpl = {
	(props: any): any
	query?: any
	queries?: any[]
	variables?: (seedNode: any, ctx?: any) => Record<string, any>
}

const page = dynamic(() => import('./page')) as Tpl

page.variables = ({ databaseId }: any, ctx: any) => {
	return {
		databaseId,
		asPreview: ctx?.asPreview,
		headerLocation: PRIMARY_LOCATION,
		footerLocation: FOOTER_LOCATION,
	}
}

// Note***: tat ca cac query trong cac page deu phai co generalSettings, no duoc su dung o compoent Wrap
page.query = gql(`
  query GetPage($databaseId: ID!, $asPreview: Boolean = false, $headerLocation: MenuLocationEnum!, $footerLocation: MenuLocationEnum!) {
    page(id: $databaseId, idType: DATABASE_ID, asPreview: $asPreview) {
      title
      ncPageMeta {
        isFullWithPage
      }
      featuredImage {
        node {
          altText
          sourceUrl
        }
      }
      editorBlocks(flat: true) {
        __typename
        renderedHtml
        clientId
        parentClientId
        ...NcmazFaustBlockMagazineFragment
        ...NcmazFaustBlockTermsFragment
        ...NcmazFaustBlockCtaFragment
        ...NcmazFaustBlockGroupFragment
        ...CoreColumnsFragment
        ...CoreColumnFragment
      }
    }
    # common query for all page 
    generalSettings {
      ...NcgeneralSettingsFieldsFragment
    }
    primaryMenuItems: menuItems(where: { location:  $headerLocation  }, first: 80) {
      nodes {
        ...NcPrimaryMenuFieldsFragment
      }
    }
    footerMenuItems: menuItems(where: {location:$footerLocation}, first: 40) {
      nodes {
        ...NcFooterMenuFieldsFragment
      }
    }
  }
`)

const single = dynamic(() => import('./single')) as Tpl

single.variables = ({ databaseId }: any, ctx: any) => {
	return {
		databaseId,
		post_databaseId: Number(databaseId || 0),
		asPreview: ctx?.asPreview,
		headerLocation: PRIMARY_LOCATION,
		footerLocation: FOOTER_LOCATION,
	}
}

single.query = gql(`
  query GetPostSiglePage($databaseId: ID!, $post_databaseId: Int,$asPreview: Boolean = false, $headerLocation: MenuLocationEnum!, $footerLocation: MenuLocationEnum!) {
    post(id: $databaseId, idType: DATABASE_ID, asPreview: $asPreview) {
		...NcmazFcPostFullVsEditorBlocksNoContentFields
    }
    posts(where: {isRelatedOfPostId:$post_databaseId}) {
      nodes {
      ...PostCardFieldsNOTNcmazMEDIA
      }
    }
    categories(first:10, where: { orderby: COUNT, order: DESC }) {
      nodes {
        ...NcmazFcCategoryFullFieldsFragment
      }
    }
    generalSettings {
      ...NcgeneralSettingsFieldsFragment
    }
    primaryMenuItems: menuItems(where: {location:$headerLocation}, first: 80) {
      nodes {
        ...NcPrimaryMenuFieldsFragment
      }
    }
    footerMenuItems: menuItems(where: {location:$footerLocation}, first: 40) {
      nodes {
        ...NcFooterMenuFieldsFragment
      }
    }
  }
`)

const category = dynamic(() => import('./category')) as Tpl

category.variables = ({ id }: any) => ({
	id,
	first: GET_POSTS_FIRST_COMMON,
	headerLocation: PRIMARY_LOCATION,
	footerLocation: FOOTER_LOCATION,
})

category.query = gql(`
query PageCategoryGetCategory($id: ID!, $first: Int, $headerLocation: MenuLocationEnum!, $footerLocation: MenuLocationEnum!)  {
    category(id: $id) {
       ...NcmazFcCategoryFullFieldsFragment
      posts(first: $first, where: {orderby: {field: DATE, order: DESC}}) {
        nodes {
          ...NcmazFcPostCardFields
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
    categories(first:10, where: { orderby: COUNT, order: DESC }) {
      nodes {
        ...NcmazFcCategoryFullFieldsFragment
      }
    }
    # common query for all page 
    generalSettings {
      ...NcgeneralSettingsFieldsFragment
    }
    primaryMenuItems: menuItems(where: { location:  $headerLocation  }, first: 80) {
      nodes {
        ...NcPrimaryMenuFieldsFragment
      }
    }
    footerMenuItems: menuItems(where: { location:  $footerLocation  }, first: 40) {
      nodes {
        ...NcFooterMenuFieldsFragment
      }
    }
 }`)

const tag = dynamic(() => import('./tag')) as Tpl

tag.variables = ({ id }: any) => ({
	id,
	first: GET_POSTS_FIRST_COMMON,
	headerLocation: PRIMARY_LOCATION,
	footerLocation: FOOTER_LOCATION,
})

tag.query = gql(`
 query PageTagGetTag($id: ID!, $first: Int, $headerLocation: MenuLocationEnum!, $footerLocation: MenuLocationEnum!) {
    tag(id: $id) {
       ...NcmazFcTagFullFieldsFragment
      
      posts(first: $first, where: {orderby: {field: DATE, order: DESC}}) {
        nodes {
          ...NcmazFcPostCardFields
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
    categories(first:10, where: { orderby: COUNT, order: DESC }) {
      nodes {
        ...NcmazFcCategoryFullFieldsFragment
      }
    }
     # common query for all page 
   generalSettings {
      ...NcgeneralSettingsFieldsFragment
    }
    primaryMenuItems: menuItems(where: { location:  $headerLocation  }, first: 80) {
      nodes {
        ...NcPrimaryMenuFieldsFragment
      }
    }
    footerMenuItems: menuItems(where: { location:  $footerLocation  }, first: 50) {
      nodes {
        ...NcFooterMenuFieldsFragment
      }
    }
    # end common query for all page
  }`)

const archive = dynamic(() => import('./archive')) as Tpl

archive.variables = ({ uri }: any) => ({
	uri,
	first: GET_POSTS_FIRST_COMMON,
	headerLocation: PRIMARY_LOCATION,
	footerLocation: FOOTER_LOCATION,
})

archive.query = gql(`
 query PageArchiveGetArchive($uri: String! = "", $first: Int, $headerLocation: MenuLocationEnum!, $footerLocation: MenuLocationEnum!) {
  nodeByUri(uri: $uri) {
      uri
      id
      ... on PostFormat {
        ...NcmazFcPostFormatFullFieldsFragment
        posts(first: $first, where: {orderby: {field: DATE, order: DESC}}) {
          nodes {
            ...NcmazFcPostCardFields
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
    categories(first:10, where: { orderby: COUNT, order: DESC }) {
      nodes {
        ...NcmazFcCategoryFullFieldsFragment
      }
    }
     # common query for all page 
   generalSettings {
      ...NcgeneralSettingsFieldsFragment
    }
    primaryMenuItems: menuItems(where: { location:  $headerLocation  }, first: 80) {
      nodes {
        ...NcPrimaryMenuFieldsFragment
      }
    }
    footerMenuItems: menuItems(where: { location:  $footerLocation  }, first: 50) {
      nodes {
        ...NcFooterMenuFieldsFragment
      }
    }
    # end common query for all page
  }`)

const main = dynamic(() => import('./main')) as Tpl

export default {
	// front page will a specifycally page
	page,
	single,
	category,
	tag,
	index: main,
	archive,
}
