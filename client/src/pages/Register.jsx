import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      navigate('/quiz');
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute top-1/3 right-1/3 w-72 h-72 rounded-full pointer-events-none animate-orb"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 left-1/4 w-56 h-56 rounded-full pointer-events-none animate-orb"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)', animationDelay: '3s' }}
      />

      <div className="glass border border-white/10 rounded-2xl p-8 w-full max-w-md relative z-10 animate-fade-in-up card-neon">
        <div className="text-center mb-8">
          <span className="text-5xl inline-block animate-float">🏆</span>
          <h1 className="text-3xl font-black mt-3 gradient-text">Kayıt Ol</h1>
          <p className="text-gray-500 text-sm mt-1">Leaderboard'da yerini al</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm flex items-center gap-2 animate-slide-down">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'username', label: 'Kullanıcı Adı', type: 'text', placeholder: 'harika_oyuncu' },
            { key: 'email', label: 'E-posta', type: 'email', placeholder: 'ornek@mail.com' },
            { key: 'password', label: 'Şifre', type: 'password', placeholder: 'En az 6 karakter' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-gray-500 text-xs font-semibold mb-2 uppercase tracking-widest">
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/60 focus:bg-purple-900/10 transition-all placeholder-gray-700 text-sm"
                placeholder={placeholder}
                required
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] btn-glow mt-2 text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">⏳</span>
                Kayıt yapılıyor...
              </span>
            ) : 'Kayıt Ol'}
          </button>
        </form>

        <p className="text-gray-600 text-center mt-6 text-sm">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
