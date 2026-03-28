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

function setOgImage(url) {
  if (!url) return;
  setMeta('og:image', url, true);
  setMeta('twitter:image', url);
}

/**
 * Updates document title and meta tags for SEO and social sharing.
 * @param {Object} options
 * @param {string} options.title - Page title (e.g. "Partners | Lynkr")
 * @param {string} options.description - Meta description
 * @param {string} [options.canonical] - Canonical URL (default: SITE_URL + pathname)
 * @param {string} [options.path] - Path for canonical (e.g. "/partners")
 * @param {string} [options.image] - Absolute URL for og:image and twitter:image (default: use existing or site logo)
 */
export function useDocumentHead({ title, description, canonical, path, image }) {
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
    if (image) setOgImage(image);
  }, [title, description, canonical, path, image]);
}

export default useDocumentHead;
