'use client';
import { useState } from 'react';
import { Heart, Eye, EyeOff, Loader2, ArrowRight, Lock, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: form.identifier, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }

      // Save to localStorage
      localStorage.setItem('clearmed_token', data.token);
      localStorage.setItem('clearmed_user', JSON.stringify(data.data));

      // Redirect to intended page or home
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/';
      router.push(redirect);
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Image src="/logo.png" alt="ClearMed" width={52} height={52} className="rounded-2xl" />
            <span className="text-2xl font-bold text-white">
              Clear<span className="text-teal-300">Med</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Welcome back</h1>
          <p className="text-white/60 text-sm mt-1">Sign in to track your bills and points</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700 flex items-center gap-2">
              <span className="shrink-0">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email or Phone Number</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="email@example.com or 9876543210"
                  value={form.identifier}
                  onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))}
                  className="input pl-10 w-full"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input pl-10 pr-10 w-full"
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn btn-primary btn-lg w-full justify-center mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
                Create one free
              </Link>
            </p>
          </div>

          {/* Demo hint */}
          <div className="mt-4 bg-brand-50 rounded-xl p-3 text-center">
            <p className="text-xs text-brand-700">
              <strong>No account yet?</strong> Create one to upload bills, earn points & track your healthcare costs.
            </p>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          <Link href="/privacy" className="hover:text-white/70">Privacy Policy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-white/70">Terms</Link>
        </p>
      </div>
    </div>
  );
}
