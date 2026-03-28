import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDocumentHead } from '@/hooks/useDocumentHead';

const SITE_NAME = 'Lynkr';

const DEFAULT_OG_IMAGE = 'https://lynkr.club/icons/favicon-512x512.png';

const ROUTE_META = {
  '/': {
    title: `${SITE_NAME} | Partner Rewards & Loyalty Platform — lynkr.club`,
    description: 'Lynkr — the partner rewards and loyalty platform. Lynkr helps businesses turn everyday transactions into customer loyalty, increase repeat customers, and grow through a connected rewards network.',
    image: DEFAULT_OG_IMAGE,
  },
  '/partner': {
    title: `Partners | ${SITE_NAME} | Loyalty Platform — lynkr.club`,
    description: 'Join the Lynkr partner rewards network. Turn customer payments into loyalty rewards, increase repeat customers, and grow with a business loyalty program and merchant rewards platform.',
    path: '/partners',
    image: DEFAULT_OG_IMAGE,
  },
  '/partners': {
    title: `Partners | ${SITE_NAME} | Loyalty Platform — lynkr.club`,
    description: 'Lynkr helps you grow through rewards and customer engagement. Connect once, acknowledge orders, and watch revenue from Lynkr users and repeat customers grow.',
    path: '/partners',
    image: DEFAULT_OG_IMAGE,
  },
  '/app/partner/login': {
    title: `Partner Login | ${SITE_NAME}`,
    description: 'Sign in to the Lynkr partner portal to manage transactions, rewards, and customer loyalty analytics.',
    path: '/app/partner/login',
    image: DEFAULT_OG_IMAGE,
  },
  '/app/login': {
    title: `Login | ${SITE_NAME}`,
    description: 'Sign in to your Lynkr account to earn and redeem rewards across the partner network.',
    path: '/app/login',
    image: DEFAULT_OG_IMAGE,
  },
  '/app/signup': {
    title: `Sign Up | ${SITE_NAME}`,
    description: 'Create your Lynkr account and start earning rewards at partner businesses.',
    path: '/app/signup',
    image: DEFAULT_OG_IMAGE,
  },
  '/terms': {
    title: `Terms of Service | ${SITE_NAME}`,
    description: 'Terms of service and privacy for Lynkr rewards and loyalty platform.',
    path: '/terms',
    image: DEFAULT_OG_IMAGE,
  },
  '/partner-pitch': {
    title: `Partner Pitch Deck | ${SITE_NAME}`,
    description: 'Interactive partner pitch: how Lynkr helps businesses with loyalty programs and partner rewards network.',
    path: '/partner-pitch',
    image: DEFAULT_OG_IMAGE,
  },
  '/partner-demo': {
    title: `Partner Demo | ${SITE_NAME}`,
    description: 'Scroll-driven partner demo: loyalty platform, rewards network, and business growth.',
    path: '/partner-demo',
    image: DEFAULT_OG_IMAGE,
  },
  '/partner-demo-dashboard': {
    title: `Partner Demo Dashboard | ${SITE_NAME}`,
    description: 'Live partner dashboard simulation: rewards, analytics, and loyalty metrics.',
    path: '/partner-demo-dashboard',
    image: DEFAULT_OG_IMAGE,
  },
  '/partner-demo-experience': {
    title: `Partner Demo Experience | ${SITE_NAME}`,
    description: 'Full partner demo experience: loyalty platform, customer rewards, and partner benefits.',
    path: '/partner-demo-experience',
    image: DEFAULT_OG_IMAGE,
  },
};

const PROGRAMMATIC_PARTNERS_PATTERN = /^\/partners\/[^/]+\/[^/]+$/;

function getMetaForPath(pathname) {
  const exact = ROUTE_META[pathname];
  if (exact) return exact;
  if (PROGRAMMATIC_PARTNERS_PATTERN.test(pathname)) return null;
  if (pathname.startsWith('/app/partner')) {
    return {
      title: `Partner Dashboard | ${SITE_NAME}`,
      description: 'Manage your business on Lynkr: transactions, rewards, loyalty analytics, and growth metrics.',
      path: '/app/partner',
    };
  }
  if (pathname.startsWith('/app/admin')) {
    return {
      title: `Admin | ${SITE_NAME}`,
      description: 'Lynkr admin: users, partners, coupons, and system settings.',
      path: '/app/admin',
    };
  }
  if (pathname.startsWith('/app')) {
    return {
      title: `App | ${SITE_NAME}`,
      description: 'Your Lynkr rewards, purchases, and loyalty activity.',
      path: pathname,
    };
  }
  return null;
}

/**
 * Updates document title and meta tags based on current route.
 * Renders nothing; side-effect only.
 */
const DocumentHead = () => {
  const { pathname } = useLocation();
  const meta = getMetaForPath(pathname);
  useDocumentHead(
    meta
      ? {
          title: meta.title,
          description: meta.description,
          path: meta.path || pathname,
          image: meta.image ?? DEFAULT_OG_IMAGE,
        }
        : {
          title: `${SITE_NAME} | Partner Rewards & Loyalty Platform — lynkr.club`,
          description: 'Lynkr — the partner rewards and loyalty platform. Lynkr helps businesses turn everyday transactions into customer loyalty and increase repeat customers through a connected rewards network.',
          path: pathname,
          image: DEFAULT_OG_IMAGE,
        }
  );
  return null;
};

export default DocumentHead;
