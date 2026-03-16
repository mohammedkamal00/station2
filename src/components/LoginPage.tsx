import React, { useState } from 'react';
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

// ضع صورتك داخل مجلد public باسم login-hero.jpg
// نستخدم BASE_URL حتى تعمل الصورة محليًا وبعد النشر داخل /station2/
const LOGIN_HERO_IMAGE = `${import.meta.env.BASE_URL}login-hero.jpg`;
const LOGIN_HERO_FALLBACK = 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1400&q=80';
const LOGIN_LOGO = 'https://www.misrpetroleum.com.eg/img/logo.png';

export default function LoginPage() {
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroImageSrc, setHeroImageSrc] = useState(LOGIN_HERO_IMAGE);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setError('يرجى إدخال البريد/اسم المستخدم وكلمة المرور.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(identifier, password);
    } catch (_err) {
      setError('بيانات الدخول غير صحيحة. حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50 p-2 sm:p-3" dir="rtl">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:h-[calc(100vh-1.5rem)] lg:max-h-[760px] lg:flex-row">
        <section className="relative h-[14vh] min-h-[110px] max-h-[140px] w-full lg:h-auto lg:min-h-full lg:max-h-none lg:w-1/2">
          <img
            src={heroImageSrc}
            alt="محطة الوقود"
            className="h-full w-full object-cover"
            style={{ imageRendering: 'pixelated' }}
            onError={() => {
              if (heroImageSrc !== LOGIN_HERO_FALLBACK) setHeroImageSrc(LOGIN_HERO_FALLBACK);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/25 to-emerald-700/20" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
            <p className="text-sm font-semibold tracking-wide text-emerald-100">MISR PETROLEUM</p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-black leading-tight">نظام إدارة المحطة</h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-100/95">واجهة دخول حديثة وسريعة لإدارة الحسابات والأرشيف.</p>
          </div>
        </section>

        <section className="flex w-full items-center justify-center overflow-y-auto bg-white lg:w-1/2">
          <div className="w-full max-w-md p-3.5 sm:p-4 lg:p-5">
            <div className="mb-4 text-center">
              <img src={LOGIN_LOGO} alt="Misr Petroleum" className="mx-auto mb-20 h-14 w-auto object-contain sm:h-16" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800">تسجيل الدخول</h1>
              <p className="mt-1.5 text-slate-500 font-medium">دفتر حسابات المحطة</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block mb-1.5 text-sm font-bold text-slate-700">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="owner@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-bold text-slate-700">كلمة المرور</label>
                <div className="relative">
                  <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-2.5 text-sm font-semibold">
                  <AlertCircle size={18} className="mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-white transition-colors ${
                  isSubmitting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? (
                  <span className="h-5 w-5 rounded-full border-2 border-white border-b-transparent animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                {isSubmitting ? 'جاري تسجيل الدخول...' : 'دخول'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
