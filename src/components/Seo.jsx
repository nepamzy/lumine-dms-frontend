import { useEffect } from "react";

const SITE_NAME = "Lumine";
const SITE_URL = "https://www.lummine.site";

function setMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Updates document.title, meta description, canonical, and OG/Twitter tags
// for the current route. Falls back to index.html's site-wide defaults for
// any page that doesn't render this (e.g. protected dashboards, which are
// blocked from indexing via robots.txt anyway).
export default function Seo({ title, description, path = "/" }) {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }
    setMeta("property", "og:title", fullTitle);
    setMeta("name", "twitter:title", fullTitle);

    const url = `${SITE_URL}${path}`;
    setMeta("property", "og:url", url);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, path]);

  return null;
}
