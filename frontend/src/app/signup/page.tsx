'use client';
import { useState, useEffect } from 'react';
import { Heart, Eye, EyeOff, Loader2, ArrowRight, Lock, User, Phone, MapPin, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', city: '', referralCode: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || localStorage.getItem('clearmed_referral');
    if (ref) set('referralCode', ref);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }
    if (!form.city) {
      setError('Please select your city');
      setLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (form.password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const body: Record<string, string> = { name: form.name, password: form.password };
      if (form.email) body.email = form.email;
      if (form.phone) body.phone = form.phone;
      if (form.city) body.city = form.city;
      if (form.referralCode) body.referralCode = form.referralCode;

      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); return; }

      if (data.data?.verificationRequired) {
        setUserId(data.data.id);
        setVerifying(true);
        return;
      }

      localStorage.setItem('clearmed_token', data.token);
      localStorage.setItem('clearmed_user', JSON.stringify(data.data));
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Verification failed'); return; }

      localStorage.setItem('clearmed_token', data.token);
      localStorage.setItem('clearmed_user', JSON.stringify(data.data));
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-slate-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Account Created! 🎉</h2>
        <p className="text-gray-500 text-sm">Welcome to ClearMed. Redirecting you to the homepage...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/logo.png" alt="ClearMed" width={64} height={64} className="rounded-2xl" />
            <span className="text-2xl font-bold text-white">Clear<span className="text-teal-300">Med</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3">Create your account</h1>
          <p className="text-white/60 text-sm mt-1">Free forever · Upload bills · Earn points</p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          {!verifying ? (
            <>
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Rahul Kumar" value={form.name}
                      onChange={e => set('name', e.target.value)} required
                      className="input pl-10 w-full" autoComplete="name" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address *</label>
                  <input type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => set('email', e.target.value)} required
                    className="input w-full" autoComplete="email" />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Mobile Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <div className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</div>
                    <input type="tel" placeholder="9876543210" maxLength={10} value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="input pl-16 w-full" autoComplete="tel" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPwd ? 'text' : 'password'} placeholder="Minimum 6 characters"
                      value={form.password} onChange={e => set('password', e.target.value)}
                      required className="input pl-10 pr-10 w-full" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showConfirmPwd ? 'text' : 'password'} placeholder="Confirm your password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      required className="input pl-10 pr-10 w-full" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your City *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select value={form.city} onChange={e => set('city', e.target.value)} required
                      className="input pl-10 w-full cursor-pointer appearance-none">
                      <option value="">Select your city</option>
                      {CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Referral */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Referral Code <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="text" placeholder="e.g. RAHU1234" value={form.referralCode}
                    onChange={e => set('referralCode', e.target.value.toUpperCase())}
                    className="input w-full uppercase tracking-wider" />
                </div>

                <button type="submit" disabled={loading}
                  className="btn btn-primary btn-lg w-full justify-center mt-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {loading ? 'Creating Account...' : 'Create Free Account'}
                </button>
              </form>

              {/* Benefits */}
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: '🧾', label: 'Upload Bills' },
                  { icon: '⭐', label: 'Earn Points' },
                  { icon: '🏆', label: 'Leaderboard' },
                ].map(b => (
                  <div key={b.label} className="bg-gray-50 rounded-xl p-2">
                    <p className="text-xl mb-0.5">{b.icon}</p>
                    <p className="text-xs text-gray-600 font-medium">{b.label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-brand-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Verify your Email</h2>
                <p className="text-sm text-gray-500 mt-1">We sent a 6-digit code to <strong>{form.email}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Verification Code</label>
                <input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input text-center text-2xl tracking-[0.5em] font-mono w-full px-4 py-3"
                  required
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading || otp.length < 6}
                className="btn btn-primary btn-lg w-full justify-center mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
              </button>

              <div className="text-center mt-3 text-sm text-gray-500">
                Didn't receive it?{' '}
                <button type="button" onClick={async () => {
                  setError('');
                  await fetch(`${API}/auth/resend-verification`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: form.email })
                  });
                  alert('A new code has been sent to your email.');
                }} className="text-brand-600 font-semibold hover:underline">
                  Resend Code
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-white/40 text-xs mt-4">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="hover:text-white/70">Terms</Link> &{' '}
          <Link href="/privacy" className="hover:text-white/70">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
