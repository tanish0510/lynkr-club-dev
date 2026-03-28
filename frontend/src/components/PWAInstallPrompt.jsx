import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'lynkr-install-dismissed';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result?.outcome !== 'accepted') {
      localStorage.setItem(DISMISS_KEY, '1');
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-4 right-4 z-30 md:left-auto md:right-6 md:bottom-6">
      <div className="pointer-events-auto ml-auto w-full md:w-auto max-w-sm rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl p-3 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Install Lynkr for app-like access.</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={dismiss} className="h-11 w-11 rounded-xl p-0">
              <X className="h-4 w-4" />
            </Button>
            <Button onClick={handleInstall} className="h-11 rounded-xl px-4">
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
