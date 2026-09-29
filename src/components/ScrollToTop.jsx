import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router doesn't reset scroll position on navigation — this is an
// SPA, so moving from a long, scrolled-down page to a new one otherwise
// just keeps whatever scrollY the browser already had, which is what made
// a freshly-loaded page look like it "started at the bottom" instead of
// the top. Browsers' own scroll restoration (back/forward cache) fights
// this the same way, so it's turned off in favor of always doing this
// explicitly.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
