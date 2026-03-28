/**
 * Datasets and helpers for programmatic partner SEO pages.
 * Used by PartnerSEOPage and sitemap generator.
 */

export const CITIES = [
  { slug: 'delhi', name: 'Delhi' },
  { slug: 'mumbai', name: 'Mumbai' },
  { slug: 'bangalore', name: 'Bangalore' },
  { slug: 'pune', name: 'Pune' },
  { slug: 'hyderabad', name: 'Hyderabad' },
  { slug: 'gurgaon', name: 'Gurgaon' },
  { slug: 'noida', name: 'Noida' },
  { slug: 'chandigarh', name: 'Chandigarh' },
  { slug: 'ahmedabad', name: 'Ahmedabad' },
  { slug: 'jaipur', name: 'Jaipur' },
];

export const BUSINESS_TYPES = [
  { slug: 'cafes', name: 'Cafes', singular: 'Cafe' },
  { slug: 'restaurants', name: 'Restaurants', singular: 'Restaurant' },
  { slug: 'gyms', name: 'Gyms', singular: 'Gym' },
  { slug: 'retail-stores', name: 'Retail Stores', singular: 'Retail Store' },
  { slug: 'salons', name: 'Salons', singular: 'Salon' },
  { slug: 'bars', name: 'Bars', singular: 'Bar' },
  { slug: 'coffee-shops', name: 'Coffee Shops', singular: 'Coffee Shop' },
  { slug: 'fitness-studios', name: 'Fitness Studios', singular: 'Fitness Studio' },
];

const cityBySlug = Object.fromEntries(CITIES.map((c) => [c.slug, c]));
const businessBySlug = Object.fromEntries(BUSINESS_TYPES.map((b) => [b.slug, b]));

export function getCity(slug) {
  return cityBySlug[slug ?? ''] ?? null;
}

export function getBusinessType(slug) {
  return businessBySlug[slug ?? ''] ?? null;
}

export function isValidPartnerSEOPath(citySlug, businessSlug) {
  return Boolean(getCity(citySlug) && getBusinessType(businessSlug));
}

/** SEO title for programmatic page */
export function getPartnerSEOTitle(cityName, businessName) {
  const templates = [
    `Simple Rewards Platform for ${businessName} in ${cityName} | Lynkr`,
    `Customer Loyalty Rewards Program for ${businessName} in ${cityName} | Lynkr`,
    `Easy Loyalty Program for ${businessName} in ${cityName} | Lynkr`,
    `Rewards System for ${businessName} in ${cityName} | Lynkr`,
  ];
  return templates[0]; // consistent: "Simple Rewards Platform for X in Y"
}

/** Meta description for programmatic page */
export function getPartnerSEODescription(cityName, businessName) {
  return `Lynkr helps ${businessName.toLowerCase()} in ${cityName} turn everyday purchases into loyalty rewards. Increase repeat customers with a simple rewards platform built for local businesses.`;
}

/** All (citySlug, businessSlug) pairs for sitemap */
export function getAllPartnerSEOPaths() {
  const paths = [];
  for (const city of CITIES) {
    for (const business of BUSINESS_TYPES) {
      paths.push({ citySlug: city.slug, businessSlug: business.slug });
    }
  }
  return paths;
}
