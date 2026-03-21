import Link from 'next/link';
import { WifiOff, Search, Stethoscope, Heart } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-5">
        <Heart className="w-8 h-8 text-brand-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You're offline</h1>
      <p className="text-gray-500 max-w-xs mb-8 leading-relaxed">
        No internet connection. Previously visited hospital pages and search results are still available.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/" className="btn btn-primary btn-lg justify-center">
          <Search className="w-5 h-5" /> Go to Home
        </Link>
        <Link href="/symptoms" className="btn btn-secondary btn-lg justify-center">
          <Stethoscope className="w-5 h-5" /> Symptom Analyzer
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-8 flex items-center gap-1.5">
        <WifiOff className="w-3.5 h-3.5" /> Reconnect to access live cost data
      </p>
    </div>
  );
}
