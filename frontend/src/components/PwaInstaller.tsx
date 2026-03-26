'use client';
import { useState, useEffect } from 'react';
import { Download, X, Bell, BellOff, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstaller() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('[PWA] Service worker registered:', reg.scope);
      }).catch(err => console.warn('[PWA] SW registration failed:', err));
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      // We don't return here so they can still enable alerts!
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show banner shortly after arrival
    const timer = setTimeout(() => {
      const wasDismissed = localStorage.getItem('clearmed_pwa_dismissed');
      if (!wasDismissed) setShowBanner(true);
    }, 1500);

    // Check notification permission
    if ('Notification' in window) setNotifPermission(Notification.permission);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      alert("To install: \n\niOS: Tap the Share button, then 'Add to Home Screen'.\n\nAndroid/Desktop: Use the browser menu to 'Install App' or 'Add to phone/desktop'.");
      return;
    }
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstalled(true);
      setShowBanner(false);
    }
    setInstallPrompt(null);
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      new Notification('ClearMed Notifications Enabled! 🎉', {
        body: "You'll get alerts when your bill is verified and when new hospitals are added near you.",
        icon: '/icons/icon-192.png',
      });
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('clearmed_pwa_dismissed', '1');
  };

  if (installed || dismissed || !showBanner) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 animate-slide-up">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 flex items-center gap-3">
          <Smartphone className="w-6 h-6 text-white shrink-0" />
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Add ClearMed to Home Screen</p>
            <p className="text-white/70 text-xs">Faster access + offline support</p>
          </div>
          <button onClick={dismiss} className="text-white/60 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex gap-2.5">
            <button onClick={handleInstall}
              className="flex-1 btn btn-primary btn-sm justify-center text-xs">
              <Download className="w-3.5 h-3.5" /> Install App
            </button>
            {notifPermission === 'default' && (
              <button onClick={requestNotifications}
                className="flex-1 btn btn-secondary btn-sm justify-center text-xs">
                <Bell className="w-3.5 h-3.5" /> Enable Alerts
              </button>
            )}
            {notifPermission === 'granted' && (
              <div className="flex-1 flex items-center justify-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 rounded-xl">
                <Bell className="w-3.5 h-3.5" /> Alerts On
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 text-center">Works offline · No app store needed</p>
        </div>
      </div>
    </div>
  );
}
