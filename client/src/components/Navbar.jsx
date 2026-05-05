import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gray-900 border-b border-purple-800 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold text-purple-400 tracking-wider">
        🎮 GameQuiz
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/quiz" className="text-gray-300 hover:text-purple-400 transition-colors font-medium">
          Quiz
        </Link>
        <Link to="/recommend" className="text-gray-300 hover:text-purple-400 transition-colors font-medium">
          Öneri
        </Link>
        <Link to="/leaderboard" className="text-gray-300 hover:text-purple-400 transition-colors font-medium">
          Leaderboard
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-purple-300 font-semibold">👤 {user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
            >
              Çıkış
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-gray-300 hover:text-purple-400 transition-colors font-medium"
            >
              Giriş
            </Link>
            <Link
              to="/register"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
            >
              Kayıt Ol
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
