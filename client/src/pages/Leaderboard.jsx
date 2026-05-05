import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MODES = [
  { id: '', label: 'Tümü' },
  { id: '1', label: 'Adını Bil' },
  { id: '2', label: 'Pixel Quiz' },
  { id: '3', label: 'Puan Tahmini' },
  { id: '4', label: 'Açıklama Quiz' },
  { id: '5', label: 'Geliştirici Kim?' },
];

const RANK_STYLES = [
  { medal: '🥇', bg: 'from-yellow-500/15 to-yellow-900/10', border: 'border-yellow-500/40', score: 'text-yellow-400' },
  { medal: '🥈', bg: 'from-slate-400/12 to-slate-700/10', border: 'border-slate-400/35', score: 'text-slate-300' },
  { medal: '🥉', bg: 'from-orange-700/12 to-orange-900/10', border: 'border-orange-600/35', score: 'text-orange-400' },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [myScores, setMyScores] = useState([]);
  const [selectedMode, setSelectedMode] = useState('');
  const [tab, setTab] = useState('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = selectedMode ? `?mode=${selectedMode}` : '';
    api.get(`/scores/leaderboard${params}`)
      .then(({ data }) => setScores(data))
      .finally(() => setLoading(false));
  }, [selectedMode]);

  useEffect(() => {
    if (!user) return;
    api.get('/scores/me').then(({ data }) => setMyScores(data));
  }, [user]);

  return (
    <div className="min-h-screen px-4 py-12 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)' }}
      />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="text-6xl mb-3 animate-float inline-block">🏆</div>
          <h1 className="text-4xl font-black gradient-text glow-purple">Leaderboard</h1>
          <p className="text-gray-600 text-sm mt-2">En yüksek skorlar</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 glass border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setTab('global')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'global' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            🌍 Global
          </button>
          {user && (
            <button
              onClick={() => setTab('me')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'me' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              👤 Benim Skorlarım
            </button>
          )}
        </div>

        {tab === 'global' && (
          <>
            {/* Mode filter */}
            <div className="flex gap-2 flex-wrap mb-6">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    selectedMode === m.id
                      ? 'bg-purple-600/80 border-purple-500/60 text-white'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center text-gray-600 py-16">
                <div className="text-4xl mb-3 animate-float inline-block">🎮</div>
                <p className="text-sm">Yükleniyor...</p>
              </div>
            ) : scores.length === 0 ? (
              <div className="text-center text-gray-600 py-16">
                <div className="text-4xl mb-3">🏜️</div>
                <p className="text-sm">Henüz skor yok. İlk sen ol!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map((s, i) => {
                  const rank = RANK_STYLES[i];
                  const isMe = s.username === user?.username;

                  return (
                    <div
                      key={s._id}
                      className={`flex items-center gap-4 bg-gradient-to-r ${
                        rank ? rank.bg : 'from-white/[0.03] to-transparent'
                      } glass border ${
                        rank ? rank.border : isMe ? 'border-purple-500/40' : 'border-white/[0.07]'
                      } rounded-2xl px-5 py-4 animate-fade-in-up transition-all hover:border-purple-500/30`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <span className="text-2xl w-8 text-center flex-shrink-0">
                        {rank ? rank.medal : (
                          <span className="text-gray-600 font-bold text-sm">#{i + 1}</span>
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold truncate ${isMe ? 'text-purple-300' : 'text-white'}`}>
                          {s.username} {isMe && <span className="text-xs text-purple-500">(sen)</span>}
                        </p>
                        <p className="text-gray-600 text-xs mt-0.5">{s.modeName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-black text-xl ${rank ? rank.score : isMe ? 'text-purple-400' : 'text-gray-300'}`}>
                          {s.score}
                        </p>
                        <p className="text-gray-600 text-xs">{s.correctAnswers}/{s.totalQuestions} doğru</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'me' && (
          <div className="space-y-3">
            {myScores.length === 0 ? (
              <div className="text-center text-gray-600 py-16">
                <div className="text-4xl mb-3">🎮</div>
                <p className="text-sm">Henüz skor yok. Hadi oyna!</p>
              </div>
            ) : (
              myScores.map((s, i) => (
                <div
                  key={s._id}
                  className="flex items-center gap-4 glass border border-white/[0.07] hover:border-purple-500/30 rounded-2xl px-5 py-4 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{s.modeName}</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {new Date(s.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-black text-xl">{s.score}</p>
                    <p className="text-gray-600 text-xs">{s.correctAnswers}/{s.totalQuestions} doğru</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
