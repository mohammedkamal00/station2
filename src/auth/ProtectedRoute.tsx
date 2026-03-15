import React from 'react';
import { useAuth } from './AuthContext';
import LoginPage from '../components/LoginPage';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-lg font-bold text-slate-700">
          جاري التحقق من الجلسة...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
