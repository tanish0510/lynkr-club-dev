import { useEffect } from 'react';

const SITE_URL = 'https://lynkr.club';

const setMeta = (nameOrProp, content, isProperty = false) => {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`head meta[${attr}="${nameOrProp}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, nameOrProp);
    document.head.appendChild(el);
  }
  if (el.getAttribute('content') !== content) {
    el.setAttribute('content', content);
  }
};

/**
 * Updates document title and meta tags for SEO and social sharing.
 * Call from top-level page components or from a central place based on route.
 * @param {Object} options
 * @param {string} options.title - Page title (e.g. "Partners | Lynkr")
 * @param {string} options.description - Meta description
 * @param {string} [options.canonical] - Canonical URL (default: SITE_URL + pathname)
 * @param {string} [options.path] - Path for canonical (e.g. "/partner")
 */
export function useDocumentHead({ title, description, canonical, path }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, true);
      setMeta('twitter:description', description);
    }
    if (title) {
      setMeta('og:title', title, true);
      setMeta('twitter:title', title);
    }
    const canonicalUrl = canonical || (path ? `${SITE_URL}${path}` : SITE_URL + '/');
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== canonicalUrl) {
      link.setAttribute('href', canonicalUrl);
    }
    setMeta('og:url', canonicalUrl, true);
    setMeta('twitter:url', canonicalUrl);
  }, [title, description, canonical, path]);
}

export default useDocumentHead;
