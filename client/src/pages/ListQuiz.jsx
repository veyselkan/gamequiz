import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function isMatch(input, answerName) {
  const i = normalize(input);
  const a = normalize(answerName);
  if (i.length < 3) return false;
  return a.includes(i) || i === a;
}

const MAX_LIVES = 3;

export default function ListQuiz() {
  const { user } = useAuth();
  const inputRef = useRef(null);

  const [challenge, setChallenge] = useState(null);
  const [filled, setFilled] = useState({});      // { rank: answerObj }
  const [lives, setLives] = useState(MAX_LIVES);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('loading'); // loading | playing | won | lost
  const [flash, setFlash] = useState(null);       // 'correct' | 'wrong' | 'duplicate'
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/quiz/6', { signal: controller.signal })
      .then(({ data }) => {
        setChallenge(data);
        setPhase('playing');
      })
      .catch(err => {
        if (!controller.signal.aborted) setError('Yüklenemedi, tekrar dene.');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (phase !== 'playing' || !user) return;
    if (Object.keys(filled).length === challenge?.count) {
      setPhase('won');
    }
  }, [filled]);

  useEffect(() => {
    if ((phase === 'won' || phase === 'lost') && user) {
      const correct = Object.keys(filled).length;
      api.post('/scores', {
        mode: 6,
        score,
        correctAnswers: correct,
        totalQuestions: challenge?.count || 10,
      }).catch(() => {});
    }
  }, [phase]);

  const handleGuess = () => {
    const guess = input.trim();
    if (!guess || phase !== 'playing') return;

    const alreadyFilled = Object.values(filled).some(a => normalize(a.name) === normalize(guess));
    if (alreadyFilled) {
      setFlash('duplicate');
      setTimeout(() => setFlash(null), 1200);
      setInput('');
      return;
    }

    const match = challenge.answers.find(a => isMatch(guess, a.name) && !filled[a.rank]);
    if (match) {
      const newFilled = { ...filled, [match.rank]: match };
      setFilled(newFilled);
      const bonus = lives * 20;
      setScore(s => s + 100 + bonus);
      setFlash('correct');
      setTimeout(() => setFlash(null), 1000);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setFlash('wrong');
      setTimeout(() => setFlash(null), 1000);
      if (newLives <= 0) {
        setTimeout(() => setPhase('lost'), 800);
      }
    }
    setInput('');
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleGuess();
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
        <div className="text-6xl mb-4 animate-pulse">📋</div>
        <p className="text-gray-400 text-lg">Yükleniyor...</p>
      </div>
    </div>
  );

  const isGameOver = phase === 'won' || phase === 'lost';
  const correctCount = Object.keys(filled).length;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <Link to="/quiz" className="text-gray-500 hover:text-gray-300 text-sm">← Çık</Link>
          <span className="text-purple-400 font-bold">{score} puan</span>
        </div>

        {/* Lives */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} className={`text-2xl transition-all ${i < lives ? 'opacity-100' : 'opacity-20 grayscale'}`}>
              ❤️
            </span>
          ))}
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-white">{challenge.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{challenge.subtitle}</p>
        </div>

        {/* Slots */}
        <div className="space-y-2 mb-6">
          {challenge.answers.map((ans) => {
            const f = filled[ans.rank];
            return (
              <div key={ans.rank} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                f ? 'bg-green-900/30 border border-green-700' : 'bg-gray-800/60 border border-gray-700'
              }`}>
                <span className={`text-sm font-bold w-6 text-center shrink-0 ${f ? 'text-green-400' : 'text-gray-500'}`}>
                  {ans.rank}
                </span>
                {f ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-white font-medium">{f.name}</span>
                    <span className="text-green-400 font-bold text-sm">{f.metacritic}</span>
                  </div>
                ) : isGameOver ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-gray-400 italic">{ans.name}</span>
                    <span className="text-gray-500 text-sm">{ans.metacritic}</span>
                  </div>
                ) : (
                  <div className="h-5 bg-gray-700 rounded flex-1 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Flash feedback */}
        <div className={`text-center text-sm font-semibold h-6 mb-3 transition-all ${
          flash === 'correct' ? 'text-green-400' :
          flash === 'wrong' ? 'text-red-400' :
          flash === 'duplicate' ? 'text-yellow-400' : 'opacity-0'
        }`}>
          {flash === 'correct' && '✅ Doğru!'}
          {flash === 'wrong' && '❌ Yanlış! -1 can'}
          {flash === 'duplicate' && '⚠️ Zaten buldun!'}
        </div>

        {/* Input */}
        {!isGameOver ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Oyun adı yaz..."
              autoFocus
              className={`flex-1 bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                flash === 'wrong' ? 'border-red-500' :
                flash === 'correct' ? 'border-green-500' : 'border-gray-600 focus:border-purple-500'
              }`}
            />
            <button
              onClick={handleGuess}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 rounded-xl transition-colors"
            >
              →
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 border border-purple-700 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">{phase === 'won' ? '🏆' : '💀'}</div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {phase === 'won' ? 'Tebrikler!' : 'Oyun Bitti!'}
            </h2>
            <p className="text-gray-400 mb-4">{correctCount} / {challenge.count} oyun bulundu</p>
            <p className="text-purple-400 font-bold text-xl mb-5">{score} puan</p>

            {!user && (
              <p className="text-gray-500 text-sm mb-4">
                Skor kaydetmek için{' '}
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
        )}

        {/* Progress */}
        {!isGameOver && (
          <p className="text-center text-gray-500 text-sm mt-4">
            {correctCount} / {challenge.count} bulundu
          </p>
        )}
      </div>
    </div>
  );
}
