import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../lib/usePWAInstall';
import { Smartphone, Download, X, Share2, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';

export const PWAInstallNotification: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
      }
    } else {
      // Browser doesn't support beforeinstallprompt or already installed
      setShowIOSModal(true);
    }
  };

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Shortcut Notification Banner */}
      <aside
        aria-label="PWA Installation Notification"
        className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] bg-zinc-900/95 dark:bg-zinc-900/95 text-white p-4 rounded-2xl border border-emerald-500/40 shadow-2xl backdrop-blur-md animate-slideUp transition-all"
      >
        <div className="flex items-start gap-3">
          {/* App Icon preview */}
          <div className="relative flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-sky-500 to-amber-500 p-0.5 shadow-md">
            <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Add App Shortcut
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Offline Ready
              </span>
            </div>
            <h4 className="text-sm font-bold text-zinc-100 mt-0.5">
              Install ASCEND on your screen
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
              Get an app icon on your home screen. Open in offline mode and run fluently with Guddu referee rules and live scoring!
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-black text-xs shadow-md transition transform active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Add to Screen
              </button>

              <button
                onClick={handleDismiss}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 transition cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* iOS Safari or Fallback Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-zinc-900 dark:text-white">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black uppercase tracking-tight">
              Add ASCEND to Home Screen
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Add this app to your mobile screen or desktop as a native icon:
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                <div className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-700 dark:text-zinc-200">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold">Step 1:</span> Tap the <span className="font-bold text-emerald-500">Share</span> icon in your browser toolbar or menu.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                <div className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-700 dark:text-zinc-200">
                  <PlusSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold">Step 2:</span> Scroll down and choose <span className="font-bold text-emerald-500">"Add to Home Screen"</span>.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold">Step 3:</span> Launch from your home screen. It will open like an app and work smoothly offline!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const PWAInstallNavbarButton: React.FC = () => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [showIOS, setShowIOS] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={() => {
          if (isInstallable) {
            install();
          } else {
            setShowIOS(true);
          }
        }}
        title="Add to Home Screen (Install App for Offline Use)"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showIOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-zinc-900 dark:text-white">
            <button
              onClick={() => setShowIOS(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-black uppercase">Install ASCEND App</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Tap your browser menu or share button and select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong> to place the ASCEND icon on your desktop or phone home screen.
            </p>
            <button
              onClick={() => setShowIOS(false)}
              className="mt-4 w-full py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
