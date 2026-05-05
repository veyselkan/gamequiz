import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/quiz', label: 'Quiz' },
  { to: '/recommend', label: 'Öneri' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/[0.07] px-6 py-3.5 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5 group">
        <span className="text-2xl inline-block group-hover:animate-dance">🎮</span>
        <span className="text-xl font-black gradient-text glow-purple tracking-wide">
          GameQuiz
        </span>
      </Link>

      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive(to)
                ? 'text-purple-300 bg-purple-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {label}
            {isActive(to) && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />
            )}
          </Link>
        ))}

        <div className="w-px h-4 bg-white/10 mx-2" />

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-purple-300 font-semibold">
              👤 {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm px-3.5 py-1.5 rounded-lg border border-red-800/50 bg-red-900/20 text-red-400 hover:bg-red-800/30 hover:text-red-300 transition-all"
            >
              Çıkış
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm px-3.5 py-1.5 text-gray-400 hover:text-white transition-colors"
            >
              Giriş
            </Link>
            <Link
              to="/register"
              className="text-sm px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all btn-glow animate-pulse-glow"
            >
              Kayıt Ol
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
