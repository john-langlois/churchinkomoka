'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send code');
        setLoading(false);
        return;
      }

      setMessage('Code sent! Check your email.');
      setStep('code');
    } catch (error) {
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('otp', {
        identifier: email,
        code,
        type: 'email',
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tight text-stone-900 mb-2">Admin Login</h2>
          <p className="text-stone-600 font-medium">Enter your email to receive a login code</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
                loading ? 'bg-stone-400' : 'bg-stone-900 hover:bg-stone-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Code'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <p className="text-stone-600 text-sm mb-4">
                We sent a code to <span className="font-bold">{email}</span>
              </p>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Enter Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none font-bold text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                  setMessage('');
                }}
                className="flex-1 px-4 py-3 bg-stone-100 text-stone-900 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-200 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className={`flex-1 py-3 rounded-xl font-bold text-white uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
                  loading || code.length !== 6 ? 'bg-stone-400' : 'bg-stone-900 hover:bg-stone-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
