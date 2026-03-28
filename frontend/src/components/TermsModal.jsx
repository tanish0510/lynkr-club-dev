import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const TERMS_SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By creating an account on Lynkr ("Service"), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Service. Lynkr is a rewards platform that provides you with a personal Lynkr email for shopping at partner brands; we detect purchases from confirmation emails and credit reward points that you can redeem for coupons and offers.' },
  { title: '2. Eligibility', body: 'You must be at least 18 years old and capable of entering into a binding contract to use Lynkr. By signing up, you represent that the information you provide is accurate and that you accept these terms.' },
  { title: '3. Account and Lynkr Email', body: 'You will receive a Lynkr email address for use when shopping with partners. You are responsible for keeping your account credentials secure. We only read purchase-related emails sent to your Lynkr email to detect orders and award points; we do not access your personal inbox.' },
  { title: '4. Points and Rewards', body: 'Points are credited based on verified purchases at partner brands. Reward coupons and offers are subject to partner terms and availability. Lynkr does not guarantee any minimum points or redemption value. We and our partners may change or discontinue offers with reasonable notice where required.' },
  { title: '5. Privacy and Data', body: 'Your use of Lynkr is also governed by our Privacy Policy. We process data necessary to provide the Service, detect purchases, and manage rewards. We do not sell your personal data to third parties for marketing. Verification emails and communications may be sent from admin@lynkr.club.' },
  { title: '6. Acceptable Use', body: 'You agree not to misuse the Service, including by creating fake purchases, abusing referral or reward systems, or violating any applicable law. We may suspend or terminate accounts that breach these terms or for any reason with notice where required.' },
  { title: '7. Disclaimers', body: 'The Service is provided "as is." We do not warrant uninterrupted or error-free operation. Partner offers and rewards are the responsibility of the respective partners. Lynkr is not liable for partner actions or for any indirect or consequential damages arising from your use of the Service.' },
  { title: '8. Changes', body: 'We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance. Material changes will be communicated via email or in-app notice where appropriate.' },
  { title: '9. Contact', body: 'For questions about these Terms or the Service, contact us at admin@lynkr.club.' },
];

const TermsModal = ({ open, onOpenChange, onAccept }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 border-white/10">
        <DialogHeader className="p-4 pb-2 border-b border-white/10 shrink-0">
          <DialogTitle className="text-lg font-semibold">Terms and Conditions</DialogTitle>
          <p className="text-xs text-muted-foreground">Last updated: February 2025</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-sm font-semibold mb-1.5">{section.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
        <DialogFooter className="p-4 pt-2 border-t border-white/10 shrink-0 flex-row gap-2 justify-end">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => {
              onAccept();
              onOpenChange(false);
            }}
          >
            I have read and accept the Terms and Conditions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;
