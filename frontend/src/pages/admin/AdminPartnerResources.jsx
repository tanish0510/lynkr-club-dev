import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, Presentation, Rocket, LayoutDashboard, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import PartnerBrochure from '@/components/brochure/PartnerBrochure';

const exportBrochureToPdf = async (element, filename = 'Lynkr-Partner-Brochure.pdf') => {
  const html2pdf = (await import('html2pdf.js')).default;
  const opt = {
    margin: [8, 8, 8, 8],
    filename,
    image: { type: 'jpeg', quality: 0.96 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };
  await html2pdf().set(opt).from(element).save();
};

const AdminPartnerResources = () => {
  const brochureRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadBrochure = async () => {
    if (!brochureRef.current) {
      toast.error('Brochure content not ready');
      return;
    }
    setDownloading(true);
    try {
      await exportBrochureToPdf(brochureRef.current, 'Lynkr-Partner-Brochure.pdf');
      toast.success('Partner brochure downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Partner Resources</h1>
        <p className="text-muted-foreground mt-1">Share these materials with potential or existing partners.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold font-heading text-foreground mb-2">Partner pitch brochure</h2>
        <p className="text-sm text-muted-foreground mb-4">
          A professional PDF brochure that explains Lynkr, partner benefits, the Growth Dashboard, and how to join. Share it with businesses you’re onboarding.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownloadBrochure}
            disabled={downloading}
            className="rounded-xl min-h-11"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            Download Partner Brochure
          </Button>
          <Button
            variant="outline"
            className="rounded-xl min-h-11"
            onClick={() => window.location.assign('/partner-pitch')}
          >
            <Presentation className="w-4 h-4 mr-2" />
            Open Partner Pitch Deck
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mt-4">
        <h2 className="text-lg font-semibold font-heading text-foreground mb-2">Partner Demo Mode</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Scroll-driven interactive product story for live meetings. Ideal for demos and onboarding presentations.
        </p>
        <Button
          className="rounded-xl min-h-11 bg-[#3B82F6] hover:bg-[#2b71e8]"
          onClick={() => window.location.assign('/partner-demo')}
        >
          <Rocket className="w-4 h-4 mr-2" />
          Launch Partner Demo Mode
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mt-4">
        <h2 className="text-lg font-semibold font-heading text-foreground mb-2">Ultimate Partner Demo Experience</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Premium end-to-end interactive story combining ecosystem walkthrough, growth metrics, charts, simulation controls, and CTA in one page.
        </p>
        <Button
          className="rounded-xl min-h-11 bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#14B8A6] text-white hover:opacity-90"
          onClick={() => window.location.assign('/partner-demo-experience')}
        >
          <WandSparkles className="w-4 h-4 mr-2" />
          Launch Partner Demo
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mt-4">
        <h2 className="text-lg font-semibold font-heading text-foreground mb-2">Live Partner Dashboard Simulation</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Show a merchant what their business would look like inside Lynkr with interactive metrics, charts, rewards, campaigns, and network insights.
        </p>
        <Button
          className="rounded-xl min-h-11 bg-[#14B8A6] hover:bg-[#0fa390] text-black font-semibold"
          onClick={() => window.location.assign('/partner-demo-dashboard')}
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Open Partner Demo Dashboard
        </Button>
      </div>

      {/* Brochure for PDF: off-screen so html2pdf/html2canvas can capture it (hidden elements often render blank) */}
      <div className="fixed left-[-9999px] top-0 w-[210mm] z-[-1]" aria-hidden>
        <PartnerBrochure ref={brochureRef} />
      </div>
    </div>
  );
};

export default AdminPartnerResources;
