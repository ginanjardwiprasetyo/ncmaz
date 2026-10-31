import SEO, { useCanonicalPath } from "@/components/SEO/SEO";
import React, { FC } from "react";
import SiteHeader from "./SiteHeader";
import Footer from "@/components/Footer/Footer";
import { FragmentType } from "@/__generated__";
import {
  NC_FOOTER_MENU_QUERY_FRAGMENT,
  NC_PRIMARY_MENU_QUERY_FRAGMENT,
} from "@/fragments/menu";
import { NcgeneralSettingsFieldsFragmentFragment } from "@/__generated__/graphql";
import { NC_SITE_SETTINGS } from "@/contains/site-settings";
import {
  BreadcrumbItem,
  getArticleJsonLd,
  getBreadcrumbJsonLd,
} from "@/utils/structuredData";

interface Props {
  children: React.ReactNode;
  pageTitle?: string | null | undefined;
  headerMenuItems?: FragmentType<typeof NC_PRIMARY_MENU_QUERY_FRAGMENT>[];
  footerMenuItems?: FragmentType<typeof NC_FOOTER_MENU_QUERY_FRAGMENT>[] | null;
  pageFeaturedImageUrl?: string | null | undefined;
  generalSettings?: NcgeneralSettingsFieldsFragmentFragment | null | undefined;
  pageDescription?: string | null | undefined;
  /** data untuk JSON-LD Article (post) / WebPage (halaman) */
  pageArticle?: {
    type?: "Article" | "WebPage";
    date?: string | null;
    modified?: string | null;
    authorName?: string | null;
  };
  /** item terakhir boleh tanpa pathname — diisi path halaman sekarang */
  pageBreadcrumb?: BreadcrumbItem[];
}

const MAX_TITLE_LENGTH = 60;

const PageLayout: FC<Props> = ({
  children,
  footerMenuItems,
  headerMenuItems,
  pageFeaturedImageUrl,
  pageTitle,
  generalSettings,
  pageDescription,
  pageArticle,
  pageBreadcrumb,
}) => {
  const fullTitle = (pageTitle || "") + " - " + (generalSettings?.title || "");
  const displayTitle = fullTitle.length > MAX_TITLE_LENGTH
    ? fullTitle.substring(0, MAX_TITLE_LENGTH - 3) + "..."
    : fullTitle;

  const description =
    pageDescription ||
    generalSettings?.description ||
    NC_SITE_SETTINGS.site_info?.site_description ||
    "";

  const canonicalPath = useCanonicalPath();
  const breadcrumb = (pageBreadcrumb || []).map((item, index, arr) =>
    index === arr.length - 1 && !item.pathname
      ? { ...item, pathname: canonicalPath }
      : item,
  );
  const structuredData = [
    ...(pageArticle && pageTitle
      ? [
          getArticleJsonLd({
            title: pageTitle || "",
            description,
            imageUrl: pageFeaturedImageUrl,
            pathname: canonicalPath,
            date: pageArticle.date,
            modified: pageArticle.modified,
            authorName: pageArticle.authorName,
            type: pageArticle.type,
          }),
        ]
      : []),
    ...(breadcrumb.length > 1 ? [getBreadcrumbJsonLd(breadcrumb)] : []),
  ];

  return (
    <>
      <SEO
        title={displayTitle}
        description={description}
        imageUrl={pageFeaturedImageUrl}
        ogType={pageArticle?.type === "WebPage" ? "website" : pageArticle ? "article" : undefined}
        publishedTime={pageArticle?.date}
        modifiedTime={pageArticle?.modified}
        structuredData={structuredData}
      />

      <SiteHeader
        siteTitle={generalSettings?.title}
        siteDescription={generalSettings?.description}
        menuItems={headerMenuItems || []}
      />

      {children}

      <Footer menuItems={footerMenuItems || []} />
    </>
  );
};

export default PageLayout;
