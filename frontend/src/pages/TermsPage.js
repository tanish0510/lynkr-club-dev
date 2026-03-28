import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
        <Button
          variant="ghost"
          className="mb-6 min-h-11 rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 2025</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By creating an account on Lynkr (“Service”), you agree to be bound by these Terms and Conditions.
              If you do not agree, do not use the Service. Lynkr is a rewards platform that provides you with a
              personal Lynkr email for shopping at partner brands; we detect purchases from confirmation emails
              and credit reward points that you can redeem for coupons and offers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 18 years old and capable of entering into a binding contract to use Lynkr.
              By signing up, you represent that the information you provide is accurate and that you accept these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Account and Lynkr Email</h2>
            <p className="text-muted-foreground leading-relaxed">
              You will receive a Lynkr email address for use when shopping with partners. You are responsible for
              keeping your account credentials secure. We only read purchase-related emails sent to your Lynkr
              email to detect orders and award points; we do not access your personal inbox.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Points and Rewards</h2>
            <p className="text-muted-foreground leading-relaxed">
              Points are credited based on verified purchases at partner brands. Reward coupons and offers are
              subject to partner terms and availability. Lynkr does not guarantee any minimum points or redemption
              value. We and our partners may change or discontinue offers with reasonable notice where required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Privacy and Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of Lynkr is also governed by our Privacy Policy. We process data necessary to provide the
              Service, detect purchases, and manage rewards. We do not sell your personal data to third parties
              for marketing. Verification emails and communications may be sent from admin@lynkr.club.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to misuse the Service, including by creating fake purchases, abusing referral or
              reward systems, or violating any applicable law. We may suspend or terminate accounts that breach
              these terms or for any reason with notice where required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Disclaimers</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided “as is.” We do not warrant uninterrupted or error-free operation. Partner
              offers and rewards are the responsibility of the respective partners. Lynkr is not liable for partner
              actions or for any indirect or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Changes</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. Continued use of the Service after changes constitutes
              acceptance. Material changes will be communicated via email or in-app notice where appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms or the Service, contact us at admin@lynkr.club.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
