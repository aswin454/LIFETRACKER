import React, { useState } from 'react';
import { X, Mail, User, ShieldAlert, Sparkles, Check } from 'lucide-react';

export default function GoogleSignInModal({ isOpen, onClose, onSelectAccount }) {
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [loadingAccount, setLoadingAccount] = useState(null);

  if (!isOpen) return null;

  const mockAccounts = [
    {
      name: 'Aswin Philip Raju',
      email: 'aswin.raju@gmail.com',
      avatar: 'AR',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      name: 'Life User',
      email: 'user@example.com',
      avatar: 'ZU',
      color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    }
  ];

  const handleSelect = async (account) => {
    setLoadingAccount(account.email);
    // Simulate a brief delay to mimic the network roundtrip and loading feel of Google Auth
    setTimeout(() => {
      onSelectAccount({
        googleId: 'mock-google-id-' + Math.random().toString(36).substring(2, 11),
        email: account.email,
        name: account.name
      });
      setLoadingAccount(null);
    }, 900);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customName || !customEmail) return;
    
    handleSelect({
      name: customName,
      email: customEmail
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 flex flex-col">
        {/* Top brand header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
          <div className="flex items-center gap-2.5">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.94 1 12 1 7.35 1 3.39 3.67 1.41 7.56l3.78 2.93c.88-2.65 3.38-4.45 6.81-4.45z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.11 2.73-2.37 3.58l3.78 2.93c2.2-2.03 3.64-5.02 3.64-8.61z"
              />
              <path
                fill="#FBBC05"
                d="M5.19 10.49c-.23-.68-.36-1.4-.36-2.14s.13-1.46.36-2.14L1.41 3.28C.51 5.08 0 7.09 0 9.2c0 2.11.51 4.12 1.41 5.92l3.78-2.93z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.78-2.93c-1.1.74-2.5 1.18-4.18 1.18-3.43 0-5.93-1.8-6.81-4.45L1.41 16.8C3.39 20.69 7.35 23 12 23z"
              />
            </svg>
            <span className="text-sm font-semibold tracking-wider text-slate-300 font-sans uppercase">
              Google Sign-In
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice alert */}
        <div className="px-6 pt-5">
          <div className="flex items-start gap-3 p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs">
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
            <div className="space-y-1">
              <p className="font-semibold">Development & Sandbox Mode</p>
              <p className="text-slate-400">
                You are running in sandbox/offline mode. Selecting an account below will securely sign you in without needing a real Google client configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 flex-grow">
          {!customMode ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white mb-2">
                Choose an account
              </h3>
              
              <div className="space-y-2.5">
                {mockAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleSelect(account)}
                    disabled={loadingAccount !== null}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/20 hover:bg-slate-950/50 hover:border-slate-700 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${account.color}`}>
                        {account.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                          {account.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {account.email}
                        </p>
                      </div>
                    </div>
                    
                    {loadingAccount === account.email ? (
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
                        <Check className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCustomMode(true)}
                disabled={loadingAccount !== null}
                className="w-full text-center py-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline mt-4 transition-colors"
              >
                Use another account
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4 animate-fade-in">
              <h3 className="text-base font-semibold text-white mb-2">
                Enter account details
              </h3>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="jane.doe@gmail.com"
                    className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="flex-1 border border-slate-800 hover:border-slate-700 bg-slate-950/10 hover:bg-slate-950/20 text-slate-400 rounded-xl py-2.5 text-xs font-semibold transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loadingAccount !== null}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingAccount !== null ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-600 leading-normal flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
            Your real Google passwords are never requested or stored.
          </p>
        </div>
      </div>
    </div>
  );
}
