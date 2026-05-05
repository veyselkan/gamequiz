import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Recommend() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const handleSearch = async () => {
    const game = input.trim();
    if (!game) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await api.get('/recommend', { params: { game } });
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(msg === 'Oyun bulunamadı' ? 'Oyun bulunamadı. Farklı bir isim dene.' : 'Bir hata oluştu, tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Başlık */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Oyun Önerisi</h1>
          <p className="text-gray-400">Sevdiğin bir oyunu yaz, benzer oyunları keşfet</p>
        </div>

        {/* Arama */}
        <div className="flex gap-2 mb-8">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Örn: The Witcher 3, Red Dead Redemption 2..."
            autoFocus
            className="flex-1 bg-gray-800 border border-gray-600 focus:border-purple-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-6 rounded-xl transition-colors"
          >
            {loading ? '...' : 'Ara'}
          </button>
        </div>

        {/* Hata */}
        {error && (
          <div className="text-center text-red-400 mb-6">{error}</div>
        )}

        {/* Yükleniyor */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 animate-pulse">🔍</div>
            <p className="text-gray-400">Oyun aranıyor ve öneriler hazırlanıyor...</p>
          </div>
        )}

        {/* Sonuç */}
        {result && !loading && (
          <>
            {/* Aranan oyun */}
            <div className="bg-gray-900 border border-purple-700 rounded-2xl overflow-hidden mb-6">
              <div className="flex gap-4 p-4">
                {result.searched.image && (
                  <img
                    src={result.searched.image}
                    alt={result.searched.name}
                    className="w-32 h-20 object-cover rounded-xl shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-lg font-bold text-white leading-tight">{result.searched.name}</h2>
                    {result.searched.metacritic && (
                      <span className="bg-yellow-600 text-white text-sm font-bold px-2 py-0.5 rounded shrink-0">
                        {result.searched.metacritic}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {result.searched.genres.map(g => (
                      <span key={g} className="bg-purple-900/60 border border-purple-700 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                        {g}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result.searched.tags.map(t => (
                      <span key={t} className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Öneriler */}
            {result.recommendations.length === 0 ? (
              <p className="text-center text-gray-500">Bu oyuna benzer öneri bulunamadı.</p>
            ) : (
              <>
                <h3 className="text-white font-bold text-lg mb-4">
                  Bunları da sevebilirsin ({result.recommendations.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.recommendations.map(rec => (
                    <div key={rec.id} className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden hover:border-purple-600 transition-colors">
                      {rec.image && (
                        <div style={{ aspectRatio: '16/9' }}>
                          <img
                            src={rec.image}
                            alt={rec.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-white font-semibold text-sm leading-tight">{rec.name}</span>
                          {rec.metacritic && (
                            <span className="bg-yellow-600 text-white text-xs font-bold px-1.5 py-0.5 rounded shrink-0">
                              {rec.metacritic}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {rec.genres.map(g => (
                            <span key={g} className="text-gray-500 text-xs">{g}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
