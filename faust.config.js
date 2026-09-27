import { setConfig, hooks } from "@faustwp/core";
import templates from "./src/wp-templates";
import possibleTypes from "./possibleTypes.json";

// Cloudflare di origin WP melempar challenge 403 (HTML tanpa header CORS) untuk
// request dari browser -> Apollo gagal total: "TypeError: Failed to fetch".
// Request dari server lolos, jadi browser dialihkan ke proxy same-origin.
hooks.addFilter("graphqlEndpoint", "ncmaz/wp-graphql-proxy", (endpoint) =>
  typeof window === "undefined" ? endpoint : "/api/wp-graphql/"
);

/**
 * @type {import('@faustwp/core').FaustConfig}
 **/
export default setConfig({
	templates,
	possibleTypes,
	usePersistedQueries: true,
	// ponytail: query GraphQL harus POST. GET di-cache Cloudflare per-URL
	// (cf-cache-status HIT) sehingga update konten di WP tidak sampai ke SSR
	// selama TTL edge masih berlaku -> /helps/ nyangkut konten lama berjam-jam.
	useGETForQueries: false,
});
