import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function GameCard({ game, phase, side, selected, isCorrect, onClick }) {
  const isSelected = selected === side;
  const otherSelected = selected && selected !== side;
  const revealed = phase === 'revealed';

  const winner = revealed && game.metacritic >= (side === 'champion' ? 0 : 0);

  let borderColor = 'border-gray-700';
  if (revealed) {
    if (isSelected && isCorrect) borderColor = 'border-green-500';
    else if (isSelected && !isCorrect) borderColor = 'border-red-500';
    else if (!isSelected && !isCorrect) borderColor = 'border-green-500';
    else borderColor = 'border-gray-700';
  } else if (isSelected) {
    borderColor = 'border-purple-500';
  }

  return (
    <div
      onClick={() => phase === 'playing' && onClick(side)}
      className={`relative flex-1 rounded-2xl border-2 ${borderColor} overflow-hidden cursor-pointer
        transition-all duration-300 ${phase === 'playing' ? 'hover:border-purple-400 hover:scale-[1.02]' : ''}
        ${otherSelected && !revealed ? 'opacity-60' : ''}`}
    >
      {/* Image */}
      <div style={{ aspectRatio: '4/3' }} className="relative">
        <img
          src={game.image}
          alt={game.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <p className="text-white font-bold text-lg leading-tight mb-2 drop-shadow">{game.name}</p>

        {/* Score */}
        {revealed ? (
          <div className={`text-4xl font-black ${
            isSelected && isCorrect ? 'text-green-400' :
            isSelected && !isCorrect ? 'text-red-400' :
            !isSelected && !isCorrect ? 'text-green-400' : 'text-gray-300'
          }`}>
            {game.metacritic}
            <span className="text-base ml-1 font-normal text-gray-300">/ 100</span>
          </div>
        ) : (
          <div className="text-4xl font-black text-purple-300">?</div>
        )}
      </div>

      {/* Selection indicator */}
      {phase === 'playing' && (
        <div className="absolute top-3 right-3 bg-purple-600/80 text-white text-xs px-2 py-1 rounded-full">
          Seç
        </div>
      )}

      {/* Result badge */}
      {revealed && isSelected && (
        <div className={`absolute top-3 left-3 text-2xl`}>
          {isCorrect ? '✅' : '❌'}
        </div>
      )}
      {revealed && !isSelected && !isCorrect && (
        <div className="absolute top-3 left-3 text-2xl">✅</div>
      )}
    </div>
  );
}

export default function HigherLower() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pool, setPool] = useState([]);
  const [poolIndex, setPoolIndex] = useState(2);
  const [champion, setChampion] = useState(null);
  const [challenger, setChallenger] = useState(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/quiz/3', { signal: controller.signal })
      .then(({ data }) => {
        setPool(data);
        setChampion(data[0]);
        setChallenger(data[1]);
        setPoolIndex(2);
        setPhase('playing');
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError('Yüklenemedi, tekrar dene.');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (phase !== 'gameover' || !user) return;
    api.post('/scores', {
      mode: 3,
      score,
      correctAnswers: streak,
      totalQuestions: streak + 1,
    }).catch(() => {});
  }, [phase]);

  const handlePick = (side) => {
    if (phase !== 'playing') return;
    setSelected(side);

    const champScore = champion.metacritic;
    const challScore = challenger.metacritic;
    const tie = champScore === challScore;
    const correct = tie ||
      (side === 'champion' && champScore > challScore) ||
      (side === 'challenger' && challScore > champScore);

    setIsCorrect(correct);
    setPhase('revealed');

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setScore(s => s + 100 + newStreak * 10);

      setTimeout(() => {
        const winner = side === 'champion' ? champion : challenger;
        if (poolIndex >= pool.length) {
          setPhase('gameover');
          return;
        }
        setChampion(winner);
        setChallenger(pool[poolIndex]);
        setPoolIndex(i => i + 1);
        setSelected(null);
        setPhase('playing');
      }, 1800);
    } else {
      setTimeout(() => setPhase('gameover'), 2000);
    }
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/quiz" className="text-purple-400 hover:underline">← Geri</Link>
      </div>
    </div>
  );

  if (phase === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">⭐</div>
        <p className="text-gray-400 text-lg">Yükleniyor...</p>
      </div>
    </div>
  );

  if (phase === 'gameover') return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-purple-700 rounded-2xl p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">{streak >= 10 ? '🏆' : streak >= 5 ? '🎯' : '💪'}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Oyun Bitti!</h1>
        <p className="text-gray-400 mb-6">Higher or Lower</p>

        <div className="bg-gray-800 rounded-xl p-6 mb-6 space-y-3">
          <div className="flex justify-between text-lg">
            <span className="text-gray-400">Toplam Puan</span>
            <span className="text-purple-400 font-bold">{score}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Seri</span>
            <span className="text-yellow-400 font-bold">{streak} doğru</span>
          </div>
        </div>

        {!user && (
          <p className="text-gray-500 text-sm mb-4">
            Skorunu kaydetmek için{' '}
            <Link to="/login" className="text-purple-400 hover:underline">giriş yap</Link>
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Tekrar Oyna
          </button>
          <Link
            to="/leaderboard"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors text-center"
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/quiz" className="text-gray-500 hover:text-gray-300 text-sm">← Çık</Link>
          <span className="text-gray-400 font-medium">⭐ Higher or Lower</span>
          <span className="text-purple-400 font-bold">{score} puan</span>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-gray-800 rounded-xl px-5 py-2 flex items-center gap-2">
            <span className="text-yellow-400">🔥</span>
            <span className="text-white font-bold">{streak} seri</span>
          </div>
        </div>

        {/* Question */}
        <p className="text-center text-gray-300 font-semibold text-lg mb-5">
          Hangisinin <span className="text-yellow-400">Metacritic puanı</span> daha yüksek?
        </p>

        {/* Cards */}
        <div className="flex gap-4">
          {champion && (
            <GameCard
              game={champion}
              phase={phase}
              side="champion"
              selected={selected}
              isCorrect={isCorrect}
              onClick={handlePick}
            />
          )}

          <div className="flex items-center justify-center">
            <div className="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center text-gray-400 font-bold text-sm shrink-0">
              VS
            </div>
          </div>

          {challenger && (
            <GameCard
              game={challenger}
              phase={phase}
              side="challenger"
              selected={selected}
              isCorrect={isCorrect}
              onClick={handlePick}
            />
          )}
        </div>

        {/* Revealed feedback */}
        {phase === 'revealed' && (
          <div className={`mt-5 text-center text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect
              ? `✅ Doğru! +${100 + streak * 10} puan${streak > 0 ? ` (🔥${streak} seri)` : ''}`
              : '❌ Yanlış! Oyun bitti.'}
          </div>
        )}
      </div>
    </div>
  );
}
