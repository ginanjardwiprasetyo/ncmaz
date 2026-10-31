// Build CLIENT saja (lihat next.config.js): pengganti @faustwp/core
// server/sitemaps/* — modul server-only yang tetap diimpor barrel index.js
// karena package.json @faustwp/core tanpa field "sideEffects". Tanpa stub ini
// opsi IgnorePlugin mengubahnya jadi require yang melempar error saat modul
// dievaluasi -> seluruh _app crash (megamenu & dropdown header mati).
// Server build memakai modul asli (plugin hanya jalan saat !isServer).
export const SITEMAP_INDEX_PATH = '/sitemap.xml'
export const FAUST_PAGES_PATHNAME = '/sitemap-faust-pages.xml'
export function validateConfig() {}
export async function getSitemapProps() {
	throw new Error('getSitemapProps hanya untuk server build')
}
