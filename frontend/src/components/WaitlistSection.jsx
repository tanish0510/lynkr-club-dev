import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Sparkles, X } from 'lucide-react';
import api, { WAITLIST_TIMEOUT_MS } from '@/utils/api';
import { toast } from 'sonner';

const AGE_OPTIONS = ['18-24', '25-34', '35-44', '45-54', '55+'];
const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other'];

/**
 * Brand chips: user types and adds/removes brands. No predefined list.
 */
function BrandChipsInput({ value, onChange, placeholder, disabled, className }) {
  const [input, setInput] = useState('');

  const addBrand = useCallback(
    (brand) => {
      const b = (brand || input || '').trim();
      if (!b) return;
      const next = value.includes(b) ? value : [...value, b].slice(0, 50);
      onChange(next);
      setInput('');
    },
    [value, input, onChange]
  );

  const removeBrand = useCallback(
    (idx) => {
      onChange(value.filter((_, i) => i !== idx));
    },
    [value, onChange]
  );

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addBrand();
    }
  };

  return (
    <div
      className={cn(
        'min-h-[52px] rounded-xl border border-input bg-background/80 px-3 py-2.5 flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0',
        className
      )}
    >
      {value.map((brand, i) => (
        <span
          key={`${brand}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-primary/20 text-primary px-3 py-1.5 text-sm font-medium"
        >
          {brand}
          <button
            type="button"
            onClick={() => removeBrand(i)}
            disabled={disabled}
            className="rounded-full p-1 hover:bg-primary/30 touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center active:scale-95"
            aria-label={`Remove ${brand}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => input.trim() && addBrand()}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 min-w-[100px] sm:min-w-[120px] bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground text-sm sm:text-base py-1 touch-manipulation"
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
}

export default function WaitlistSection({ id = 'waitlist', onJoined, className, altBg = true }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [favoriteBrands, setFavoriteBrands] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      toast.error('Please enter your name and email.');
      return;
    }
    if (!age || !gender) {
      toast.error('Please select age and gender.');
      return;
    }
    setLoading(true);
    try {
      await api.post(
        '/waitlist',
        {
          name: trimmedName,
          email: trimmedEmail,
          age,
          gender,
          city: city.trim() || undefined,
          favorite_brands: favoriteBrands,
        },
        { timeout: WAITLIST_TIMEOUT_MS }
      );
      setSubmitted(true);
      onJoined?.();
      // Inline success state only; no page reload, no toast required
    } catch (err) {
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout');
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg || detail[0] : detail;
      const fallback = isTimeout ? 'Request took too long. Please check your connection and try again.' : 'Could not join waitlist. Try again.';
      toast.error(typeof msg === 'string' ? msg : fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id={id}
      className={cn(
        'landing-section landing-pad-x relative overflow-hidden',
        altBg && 'waitlist-section-bg',
        className
      )}
      aria-labelledby={`${id}-heading`}
    >
      <div className="max-w-2xl mx-auto relative">
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 shadow-xl shadow-black/20">
          <div className="flex flex-row items-center gap-3 sm:gap-4 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-teal-400" />
            </div>
            <div className="min-w-0">
              <h2 id={`${id}-heading`} className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-foreground">
                Get Early Access to Lynkr
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
                Join the waitlist and tell us which brands you shop from.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            We&apos;ll notify you when rewards, cashback, and deals go live. Help us bring rewards to the brands you love — the more demand we see, the faster we onboard those brands.
          </p>

          {submitted ? (
            <div className="py-8 sm:py-10 text-center px-2">
              <p className="text-teal-400 font-bold text-xl sm:text-2xl">You&apos;re on the Lynkr waitlist 🎉</p>
              <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-md mx-auto leading-relaxed">
                We&apos;ll notify you when rewards for your favorite brands go live.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="min-w-0">
                  <label htmlFor="waitlist-name" className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                  <Input
                    id="waitlist-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="min-h-[48px] sm:min-h-[52px] rounded-xl border-white/10 bg-background/80 text-base touch-manipulation"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="waitlist-email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <Input
                    id="waitlist-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-h-[48px] sm:min-h-[52px] rounded-xl border-white/10 bg-background/80 text-base touch-manipulation"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="min-w-0">
                  <label htmlFor="waitlist-age" className="block text-sm font-medium text-foreground mb-1.5">Age</label>
                  <select
                    id="waitlist-age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full min-h-[48px] sm:min-h-[52px] rounded-xl border border-input bg-background/80 px-3 py-2 text-sm sm:text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 touch-manipulation"
                  >
                    <option value="">Select age</option>
                    {AGE_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label htmlFor="waitlist-gender" className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                  <select
                    id="waitlist-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full min-h-[48px] sm:min-h-[52px] rounded-xl border border-input bg-background/80 px-3 py-2 text-sm sm:text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 touch-manipulation"
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="min-w-0">
                <label htmlFor="waitlist-city" className="block text-sm font-medium text-foreground mb-1.5">City (optional)</label>
                <Input
                  id="waitlist-city"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="e.g. Mumbai, Delhi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="min-h-[48px] sm:min-h-[52px] rounded-xl border-white/10 bg-background/80 text-base touch-manipulation"
                  disabled={loading}
                />
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium text-foreground mb-1.5">Favorite brands (optional)</label>
                <p className="text-xs text-muted-foreground mb-2">Type a brand and press Enter or comma to add.</p>
                <BrandChipsInput
                  value={favoriteBrands}
                  onChange={setFavoriteBrands}
                  placeholder="e.g. Nike, Zara, Starbucks"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full min-h-[52px] sm:min-h-[56px] rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation active:scale-[0.98] shadow-lg shadow-primary/20"
              >
                {loading ? 'Joining…' : 'Join the Waitlist'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By joining you agree to our{' '}
                <a href="/terms" className="underline hover:text-foreground">Terms</a>
                {' '}and{' '}
                <a href="/terms" className="underline hover:text-foreground">Privacy Policy</a>.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
