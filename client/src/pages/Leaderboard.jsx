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

const MEDALS = ['🥇', '🥈', '🥉'];

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
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-2">🏆 Leaderboard</h1>
        <p className="text-gray-400 text-center mb-8">En yüksek skorlar</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('global')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              tab === 'global' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Global
          </button>
          {user && (
            <button
              onClick={() => setTab('me')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                tab === 'me' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Benim Skorlarım
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
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedMode === m.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-12">Yükleniyor...</div>
            ) : scores.length === 0 ? (
              <div className="text-center text-gray-500 py-12">Henüz skor yok</div>
            ) : (
              <div className="space-y-3">
                {scores.map((s, i) => (
                  <div
                    key={s._id}
                    className={`flex items-center gap-4 bg-gray-900 border rounded-xl px-5 py-4 ${
                      s.username === user?.username ? 'border-purple-500' : 'border-gray-700'
                    }`}
                  >
                    <span className="text-2xl w-8 text-center">
                      {MEDALS[i] || <span className="text-gray-500 font-bold text-sm">#{i + 1}</span>}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{s.username}</p>
                      <p className="text-gray-500 text-xs">{s.modeName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-400 font-bold text-lg">{s.score}</p>
                      <p className="text-gray-500 text-xs">{s.correctAnswers}/{s.totalQuestions} doğru</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'me' && (
          <div className="space-y-3">
            {myScores.length === 0 ? (
              <div className="text-center text-gray-500 py-12">Henüz skor yok. Hadi oyna!</div>
            ) : (
              myScores.map((s) => (
                <div key={s._id} className="flex items-center gap-4 bg-gray-900 border border-gray-700 rounded-xl px-5 py-4">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{s.modeName}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(s.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-bold text-lg">{s.score}</p>
                    <p className="text-gray-500 text-xs">{s.correctAnswers}/{s.totalQuestions} doğru</p>
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
