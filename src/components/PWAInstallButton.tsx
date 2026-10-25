import React, {useState} from 'react';
import {Download, Smartphone, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>Install on Android</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Smartphone className="w-4 h-4" />
        <span>{isIOS ? 'Install on iPhone' : 'Install on Phone'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#181322] border border-white/10 p-6 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold font-display">
                Install Aari Jarvis on Your Phone
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                aria-label="Close installation guide"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-sm text-stone-300 leading-relaxed">
              {isIOS ? (
                <p>
                  1. Tap the <strong>Share</strong> button in your Safari toolbar.
                  <br />
                  2. Scroll down and tap <strong>Add to Home Screen</strong> to launch Aari full-screen.
                </p>
              ) : (
                <>
                  <p>
                    To use Aari as a full-screen Android assistant on your phone:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-stone-200">
                    <li>
                      Open this app link in <strong>Chrome on your Android phone</strong>.
                    </li>
                    <li>
                      Tap the browser menu (<strong>⋮</strong>) and select{' '}
                      <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                    </li>
                    <li>
                      Once installed, Aari directly triggers native Android Dialer (
                      <code className="text-rose-300">tel:</code>), WhatsApp (
                      <code className="text-rose-300">wa.me</code>), SMS (
                      <code className="text-rose-300">sms:</code>), Flashlight torch, and apps!
                    </li>
                  </ol>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
