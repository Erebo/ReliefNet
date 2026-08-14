import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, Key, User, Lock, Mail, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { TokenResponse, UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState<UserRole>('OPERATOR');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await apiClient.post('/auth/register', {
          email,
          password,
          full_name: fullName,
          organization_name: orgName || undefined,
          role,
        });
      }
      const res = await apiClient.post<TokenResponse>('/auth/login', {
        email,
        password,
      });
      login(res.data.access_token, res.data.user);
      navigate('/map');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string, defaultName: string, defaultRole: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<TokenResponse>('/auth/login', {
        email: demoEmail,
        password: demoPass,
      });
      login(res.data.access_token, res.data.user);
      navigate('/map');
    } catch {
      try {
        await apiClient.post('/auth/register', {
          email: demoEmail,
          password: demoPass,
          full_name: defaultName,
          role: defaultRole,
        });
        const loginRes = await apiClient.post<TokenResponse>('/auth/login', {
          email: demoEmail,
          password: demoPass,
        });
        login(loginRes.data.access_token, loginRes.data.user);
        navigate('/map');
      } catch (regErr: any) {
        setError(regErr.response?.data?.detail || 'Quick login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            RELIEFNET
          </h1>
          <p className="text-xs text-slate-500">
            Flood Relief Coordination Platform — Bangladesh
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization</label>
                <input
                  type="text"
                  placeholder="e.g. BDRCS Feni Unit"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
                >
                  <option value="OPERATOR">OPERATOR (Triage & Dispatch)</option>
                  <option value="VERIFIER">VERIFIER (Field & Ground-truth)</option>
                  <option value="RELIEF_PROVIDER">RELIEF_PROVIDER (NGO Inventory)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="operator@reliefnet.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-2 rounded text-xs transition-colors shadow-sm"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-slate-600 hover:text-slate-900 underline"
          >
            {isRegister ? 'Already have an account? Sign in' : 'Need an operator account? Register'}
          </button>
        </div>

        {/* One-Click Demo Role Logins */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
            One-Click Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('operator@reliefnet.bd', 'operator123', 'HQ Emergency Operator', 'OPERATOR')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors"
            >
              <div className="text-xs font-bold text-slate-900">Operator</div>
              <div className="text-[10px] text-slate-500">Triage & Dispatch</div>
            </button>

            <button
              onClick={() => handleQuickLogin('verifier@reliefnet.bd', 'verifier123', 'Feni Field Verifier', 'VERIFIER')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors"
            >
              <div className="text-xs font-bold text-slate-900">Verifier</div>
              <div className="text-[10px] text-slate-500">Ground-truth</div>
            </button>

            <button
              onClick={() => handleQuickLogin('provider@reliefnet.bd', 'provider123', 'BDRCS Relief Team', 'RELIEF_PROVIDER')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors"
            >
              <div className="text-xs font-bold text-slate-900">Provider</div>
              <div className="text-[10px] text-slate-500">Resource Ledger</div>
            </button>

            <button
              onClick={() => handleQuickLogin('admin@reliefnet.bd', 'admin123', 'System Administrator', 'ADMIN')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors"
            >
              <div className="text-xs font-bold text-slate-900">Admin</div>
              <div className="text-[10px] text-slate-500">Full Access</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
