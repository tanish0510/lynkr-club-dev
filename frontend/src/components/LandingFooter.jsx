import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Twitter, Linkedin, Instagram } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';

const TAGLINE = 'Turn everyday payments into rewards.';
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Dico-style footer for landing pages: logo + tagline + copyright on the left;
 * three columns on the right (Lynkr/Product, Company, Socials) with Login link and Signup button.
 */
const LandingFooter = ({ variant = 'main' }) => {
  const navigate = useNavigate();

  const lynkrColumn = {
    title: 'Lynkr',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Open App', onClick: () => navigate('/app') },
      { label: 'Login', onClick: () => navigate('/app/login'), highlight: true },
      { label: 'Sign up', onClick: () => navigate('/app/signup'), button: true },
    ],
  };

  const partnerColumn = {
    title: 'Partners',
    links: [
      { label: 'Partner login', onClick: () => navigate('/app/partner/login'), highlight: true },
      { label: 'Become a partner', onClick: () => { window.location.href = 'mailto:partners@lynkr.club?subject=Become a Partner'; } },
    ],
  };

  const companyColumn = {
    title: 'Company',
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy Policy', href: '/terms' },
      { label: 'Contact', href: 'mailto:admin@lynkr.club' },
    ],
  };

  const socialsColumn = {
    title: 'Socials',
    links: [
      { label: 'Twitter', href: 'https://twitter.com/lynkrclub', external: true, icon: Twitter },
      { label: 'LinkedIn', href: 'https://linkedin.com/company/lynkr', external: true, icon: Linkedin },
      { label: 'Instagram', href: 'https://www.instagram.com/lynkr.club/', external: true, icon: Instagram },
    ],
  };

  const columns = variant === 'partner'
    ? [partnerColumn, companyColumn, socialsColumn]
    : [lynkrColumn, companyColumn, socialsColumn];

  const renderLink = (link) => {
    const baseClass = 'text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] inline-flex items-center touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg';
    const highlightClass = link.highlight ? 'text-primary hover:text-primary/90 font-medium' : '';
    if (link.button) {
      return (
        <Button
          key={link.label}
          onClick={link.onClick}
          className="mt-2 w-full sm:w-auto min-h-[44px] rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation"
        >
          {link.label}
        </Button>
      );
    }
    if (link.href) {
      const Icon = link.icon;
      return (
        <a
          key={link.label}
          href={link.href}
          className={`${baseClass} ${highlightClass} inline-flex items-center gap-2`}
          {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
          aria-label={link.label}
        >
          {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
          {link.label}
        </a>
      );
    }
    return (
      <button
        key={link.label}
        type="button"
        onClick={link.onClick}
        className={`${baseClass} ${highlightClass} text-left`}
      >
        {link.label}
      </button>
    );
  };

  const linkColumns = variant === 'partner'
    ? [partnerColumn, companyColumn]
    : [lynkrColumn, companyColumn];

  return (
    <footer className="mt-auto rounded-t-2xl sm:rounded-t-3xl border border-white/10 border-b-0 bg-card/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
      <div className="max-w-6xl mx-auto landing-pad-x py-6 sm:py-10 lg:py-12 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-10 lg:gap-12 lg:justify-between">
          {/* Left: logo, tagline, copyright */}
          <div className="flex flex-col gap-2 sm:gap-3 max-w-xs">
            <Logo className="h-8 sm:h-9 w-24 sm:w-28 text-foreground" />
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {TAGLINE}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/80">
              © {CURRENT_YEAR} Lynkr. All rights reserved.
            </p>
          </div>

          {/* Right: link columns — 2 cols on mobile, 3 on sm+ */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:gap-10 min-w-0">
            {linkColumns.map((col) => (
              <div key={col.title} className="min-w-0">
                <h4 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground/90 mb-3 sm:mb-4">
                  {col.title}
                </h4>
                <ul className="flex flex-col gap-2 sm:gap-3">
                  {col.links.map((link) => (
                    <li key={link.label}>{renderLink(link)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Socials: horizontal icon row on mobile, column on sm+ */}
          <div className="lg:contents">
            <div className="sm:block">
              <h4 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground/90 mb-3 sm:mb-4">
                {socialsColumn.title}
              </h4>
              {/* Mobile: icon row with 44px touch targets */}
              <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-3">
                {socialsColumn.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      className="inline-flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:min-h-[44px] rounded-xl sm:rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 sm:border-0 text-muted-foreground hover:text-foreground transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent sm:inline-flex sm:gap-2"
                    >
                      {Icon && <Icon className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />}
                      <span className="hidden sm:inline">{link.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
