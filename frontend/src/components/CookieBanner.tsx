'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Check } from 'lucide-react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('clearmed_cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('clearmed_cookie_consent', JSON.stringify({ accepted: true, date: new Date().toISOString(), version: '1.0' }));
    setVisible(false);
    // Notify backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/compliance/consent`, { method: 'POST' }).catch(() => {});
  };

  const decline = () => {
    localStorage.setItem('clearmed_cookie_consent', JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 mb-1">We use essential cookies only</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            ClearMed uses session and preference cookies essential to platform operation. No advertising or tracking cookies.{' '}
            <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={decline}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="w-3.5 h-3.5" /> Decline
          </button>
          <button onClick={accept}
            className="flex items-center gap-1.5 px-4 py-2 text-xs bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
            <Check className="w-3.5 h-3.5" /> Accept
          </button>
        </div>
      </div>
    </div>
  );
}
