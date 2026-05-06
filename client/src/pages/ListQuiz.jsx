import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const fireConfetti = (intensity = 1) => {
  confetti({
    particleCount: 50 * intensity,
    spread: 70,
    origin: { y: 0.7 },
    colors: ['#a855f7', '#ec4899', '#22c55e', '#fbbf24'],
  });
};
const vibrate = (p) => { if (navigator.vibrate) navigator.vibrate(p); };

function CountUp({ to, duration = 800 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (to === 0) { setV(0); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{v.toLocaleString('tr-TR')}</>;
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
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
  const [filled, setFilled] = useState({});
  const [lives, setLives] = useState(MAX_LIVES);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('loading');
  const [flash, setFlash] = useState(null);
  const [lastSeries, setLastSeries] = useState(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/quiz/6', { signal: controller.signal })
      .then(({ data }) => { setChallenge(data); setPhase('playing'); })
      .catch(() => setError('Yüklenemedi, tekrar dene.'));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (challenge && Object.keys(filled).length === challenge.count) {
      setPhase('won');
      fireConfetti(2);
      setTimeout(() => fireConfetti(1.5), 400);
    }
  }, [filled, challenge, phase]);

  useEffect(() => {
    if ((phase === 'won' || phase === 'lost') && user) {
      const correct = Object.keys(filled).length;
      api.post('/scores', {
        mode: 6, score, correctAnswers: correct, totalQuestions: challenge?.count || 10,
      }).catch(() => {});
    }
  }, [phase]); // eslint-disable-line

  const handleGuess = () => {
    const guess = input.trim();
    if (!guess || phase !== 'playing') return;

    // Tüm eşleşen dolu olmayan oyunları bul (seri desteği)
    const matches = challenge.answers.filter(a => isMatch(guess, a.name) && !filled[a.rank]);

    if (matches.length === 0) {
      const alreadyFilled = challenge.answers.some(a => isMatch(guess, a.name));
      if (alreadyFilled) {
        setFlash('duplicate');
        setTimeout(() => setFlash(null), 1100);
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        setFlash('wrong');
        vibrate([60, 40, 60]);
        setTimeout(() => setFlash(null), 900);
        if (newLives <= 0) setTimeout(() => setPhase('lost'), 800);
      }
    } else if (matches.length === 1) {
      setFilled(prev => ({ ...prev, [matches[0].rank]: matches[0] }));
      setScore(s => s + 100 + lives * 20);
      setFlash('correct');
      fireConfetti();
      vibrate(30);
      setTimeout(() => setFlash(null), 900);
    } else {
      // Seri eşleşme — aynı anda birden fazla oyun bulundu
      const points = matches.length * (100 + lives * 20);
      setFilled(prev => {
        const next = { ...prev };
        matches.forEach(m => { next[m.rank] = m; });
        return next;
      });
      setScore(s => s + points);
      setLastSeries({ count: matches.length, points });
      setFlash('series');
      fireConfetti(Math.min(matches.length, 4));
      vibrate([30, 20, 30, 20, 30]);
      setTimeout(() => setFlash(null), 1400);
    }

    setInput('');
    inputRef.current?.focus();
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center glass border border-red-500/30 rounded-2xl p-10">
        <div className="text-5xl mb-4">😵</div>
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/quiz" className="text-purple-400 hover:underline text-sm">← Geri</Link>
      </div>
    </div>
  );

  if (phase === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 4, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-7xl mb-5"
        >📋</motion.div>
        <p className="text-gray-300 text-lg">Liste hazırlanıyor...</p>
      </div>
    </div>
  );

  const isGameOver = phase === 'won' || phase === 'lost';
  const correctCount = Object.keys(filled).length;
  const progress = challenge ? (correctCount / challenge.count) * 100 : 0;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto">

        {/* Header — sticky so it stays visible below the navbar while scrolling */}
        <div className="sticky top-14 z-40 -mx-4 px-4 py-3 mb-5 flex items-center justify-between backdrop-blur-md bg-black/60 border-b border-white/5">
          <Link to="/quiz" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">← Çık</Link>
          <div className="text-right">
            <div className="text-purple-400 font-black text-xl tabular-nums">
              <CountUp to={score} duration={500} />
            </div>
            <div className="text-gray-600 text-[10px] uppercase tracking-wider">puan</div>
          </div>
        </div>

        {/* Lives */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <motion.span
              key={i}
              animate={i < lives ? {} : { scale: [1, 0.7], opacity: [1, 0.2] }}
              transition={{ duration: 0.4 }}
              className={`text-2xl drop-shadow-lg ${i < lives ? '' : 'grayscale'}`}
            >
              ❤️
            </motion.span>
          ))}
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-black text-white">{challenge.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{challenge.subtitle}</p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-5">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ boxShadow: '0 0 8px rgba(168,85,247,0.5)' }}
          />
        </div>

        {/* Slots */}
        <div className="space-y-2 mb-5">
          {challenge.answers.map((ans) => {
            const f = filled[ans.rank];
            return (
              <motion.div
                key={ans.rank}
                animate={f ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                  f ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/20 border border-green-700/50 shadow-lg shadow-green-500/10'
                    : 'glass border border-white/10'
                }`}
              >
                <span className={`text-sm font-black w-6 text-center shrink-0 ${f ? 'text-green-400' : 'text-gray-600'}`}>
                  {ans.rank}
                </span>
                {f ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-white font-semibold">{f.name}</span>
                    <span className="text-green-400 font-bold text-sm tabular-nums">{f.metacritic}</span>
                  </div>
                ) : isGameOver ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-gray-500 italic">{ans.name}</span>
                    <span className="text-gray-600 text-sm tabular-nums">{ans.metacritic}</span>
                  </div>
                ) : (
                  <div className="h-4 bg-white/8 rounded flex-1 animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Flash */}
        <AnimatePresence mode="wait">
          {flash && (
            <motion.div
              key={flash}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              className={`text-center text-sm font-bold mb-3 ${
                flash === 'correct' ? 'text-green-400'
                : flash === 'series' ? 'text-purple-300'
                : flash === 'wrong' ? 'text-red-400'
                : 'text-yellow-400'
              }`}
            >
              {flash === 'correct' && `✅ Doğru! +${100 + lives * 20} puan`}
              {flash === 'series' && lastSeries && `🎯 Seri! ${lastSeries.count} oyun bulundu! +${lastSeries.points} puan`}
              {flash === 'wrong' && '❌ Yanlış! -1 can'}
              {flash === 'duplicate' && '⚠️ Zaten buldun!'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input or finish card */}
        {!isGameOver ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGuess()}
              placeholder="Oyun adı yaz..."
              autoFocus
              className={`flex-1 bg-white/5 border-2 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all ${
                flash === 'wrong' ? 'border-red-500/60 shake'
                : flash === 'correct' || flash === 'series' ? 'border-green-500/60'
                : 'border-white/10 focus:border-purple-500/60'
              }`}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGuess}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black px-5 rounded-2xl shadow-lg shadow-purple-500/30 transition-all"
            >
              →
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`glass border rounded-3xl p-7 text-center ${
              phase === 'won' ? 'border-green-500/40' : 'border-red-500/40'
            }`}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 250 }}
              className="text-6xl mb-3"
            >
              {phase === 'won' ? '🏆' : '💀'}
            </motion.div>
            <h2 className={`text-3xl font-black mb-1 ${phase === 'won' ? 'animate-rainbow' : 'text-white'}`}>
              {phase === 'won' ? 'Tebrikler!' : 'Oyun Bitti!'}
            </h2>
            <p className="text-gray-500 text-sm mb-5">{correctCount} / {challenge.count} oyun bulundu</p>

            <div className="my-5">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Toplam Puan</p>
              <div className="text-5xl font-black gradient-text glow-purple">
                <CountUp to={score} />
              </div>
            </div>

            {!user && (
              <p className="text-gray-600 text-sm mb-4">
                Skorunu kaydetmek için{' '}
                <Link to="/login" className="text-purple-400 hover:underline">giriş yap</Link>
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-2xl transition-all hover:scale-[1.03] shadow-lg shadow-purple-500/30"
              >
                Tekrar Oyna
              </button>
              <Link
                to="/leaderboard"
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-2xl transition-all text-center"
              >
                Leaderboard
              </Link>
            </div>
          </motion.div>
        )}

        {!isGameOver && (
          <p className="text-center text-gray-600 text-xs mt-4 tabular-nums">
            {correctCount} / {challenge.count} bulundu
          </p>
        )}
      </div>
    </div>
  );
}
