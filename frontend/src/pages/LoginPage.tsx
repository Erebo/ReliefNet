import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { TokenResponse, UserRole } from '../types';
import { ShieldCheck, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post<TokenResponse>('/auth/login', { email, password });
      login(res.data.access_token, res.data.user);
      navigate('/map');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick admin demo login — auto-registers if account doesn't exist yet
  const handleAdminDemo = async () => {
    setLoading(true);
    setError(null);
    const demoEmail = 'admin@reliefnet.bd';
    const demoPass  = 'admin123';
    try {
      const res = await apiClient.post<TokenResponse>('/auth/login', { email: demoEmail, password: demoPass });
      login(res.data.access_token, res.data.user);
      navigate('/map');
    } catch {
      try {
        await apiClient.post('/auth/register', {
          email: demoEmail, password: demoPass,
          full_name: 'System Administrator', role: 'ADMIN' as UserRole,
        });
        const res = await apiClient.post<TokenResponse>('/auth/login', { email: demoEmail, password: demoPass });
        login(res.data.access_token, res.data.user);
        navigate('/map');
      } catch (regErr: any) {
        setError(regErr.response?.data?.detail || 'Demo login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-2xl mb-2 shadow-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">RELIEFNET</h1>
          <p className="text-xs text-slate-500 font-medium">
            Flood Relief Coordination Platform — Bangladesh
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7 space-y-5">
          <div>
            <h2 className="text-sm font-black text-slate-900">Admin Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">Authorised relief coordinators only</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@reliefnet.bd"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Admin Demo Only */}
          <button
            onClick={handleAdminDemo}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">Continue as Demo Admin</div>
              <div className="text-xs text-slate-500">Full access · No password needed</div>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          ReliefNet · Bangladesh Flood Response Command System
        </p>
      </div>
    </div>
  );
};
