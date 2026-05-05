import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const fireConfetti = () => {
  confetti({
    particleCount: 70,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#fbbf24'],
  });
};

const vibrate = (p) => { if (navigator.vibrate) navigator.vibrate(p); };

function CountUp({ to, duration = 1000 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (to === 0) { setV(0); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(e * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{v.toLocaleString('tr-TR')}</>;
}

function GameCard({ game, phase, side, selected, isCorrect, onClick }) {
  const isSelected = selected === side;
  const otherSelected = selected && selected !== side;
  const revealed = phase === 'revealed';

  let borderClass = 'border-white/10 hover:border-purple-400/60';
  if (revealed) {
    if (isSelected && isCorrect) borderClass = 'border-green-500/80 shadow-lg shadow-green-500/40';
    else if (isSelected && !isCorrect) borderClass = 'border-red-500/80 shadow-lg shadow-red-500/40';
    else if (!isSelected && !isCorrect) borderClass = 'border-green-500/60';
    else borderClass = 'border-white/10';
  } else if (isSelected) borderClass = 'border-purple-500/80';

  return (
    <motion.div
      onClick={() => phase === 'playing' && onClick(side)}
      whileHover={phase === 'playing' ? { scale: 1.03, y: -4 } : {}}
      whileTap={phase === 'playing' ? { scale: 0.98 } : {}}
      className={`relative flex-1 rounded-3xl border-2 ${borderClass} overflow-hidden cursor-pointer transition-all duration-300 ${
        otherSelected && !revealed ? 'opacity-60' : ''
      }`}
    >
      <div style={{ aspectRatio: '4/3' }} className="relative">
        <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <p className="text-white font-bold text-lg leading-tight mb-2 drop-shadow-lg">{game.name}</p>
        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.div
              key="revealed"
              initial={{ y: 12, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`text-5xl font-black ${
                isSelected && isCorrect ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]'
                : isSelected && !isCorrect ? 'text-red-400'
                : !isSelected && !isCorrect ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]'
                : 'text-gray-300'
              }`}
            >
              <CountUp to={game.metacritic} duration={700} />
              <span className="text-base ml-1 font-normal text-gray-400">/ 100</span>
            </motion.div>
          ) : (
            <motion.div key="hidden" className="text-5xl font-black text-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]">
              ?
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === 'playing' && (
        <div className="absolute top-3 right-3 bg-purple-600/80 backdrop-blur text-white text-xs px-2.5 py-1 rounded-full font-semibold">
          Seç
        </div>
      )}

      {revealed && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="absolute top-3 left-3 text-3xl drop-shadow-lg"
        >
          {isSelected && isCorrect ? '✅' : isSelected && !isCorrect ? '❌' : !isSelected && !isCorrect ? '✅' : ''}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function HigherLower() {
  const { user } = useAuth();

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
        setPool(data); setChampion(data[0]); setChallenger(data[1]);
        setPoolIndex(2); setPhase('playing');
      })
      .catch(() => setError('Yüklenemedi, tekrar dene.'));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (phase !== 'gameover' || !user) return;
    api.post('/scores', {
      mode: 3, score, correctAnswers: streak, totalQuestions: streak + 1,
    }).catch(() => {});
  }, [phase]); // eslint-disable-line

  const handlePick = (side) => {
    if (phase !== 'playing') return;
    setSelected(side);

    const tie = champion.metacritic === challenger.metacritic;
    const correct = tie ||
      (side === 'champion' && champion.metacritic > challenger.metacritic) ||
      (side === 'challenger' && challenger.metacritic > champion.metacritic);

    setIsCorrect(correct);
    setPhase('revealed');

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setScore(s => s + 100 + newStreak * 10);
      fireConfetti();
      vibrate(40);

      setTimeout(() => {
        const winner = side === 'champion' ? champion : challenger;
        if (poolIndex >= pool.length) { setPhase('gameover'); return; }
        setChampion(winner);
        setChallenger(pool[poolIndex]);
        setPoolIndex(i => i + 1);
        setSelected(null);
        setPhase('playing');
      }, 1800);
    } else {
      vibrate([80, 50, 80]);
      setTimeout(() => setPhase('gameover'), 2000);
    }
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
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-7xl mb-5"
        >⭐</motion.div>
        <p className="text-gray-300 text-lg">Karşılaşmalar hazırlanıyor...</p>
      </div>
    </div>
  );

  if (phase === 'gameover') {
    const badge = streak >= 10 ? '🏆' : streak >= 5 ? '🎯' : '💪';
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="glass border border-purple-500/40 rounded-3xl p-10 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 250 }}
            className="text-7xl mb-3"
          >{badge}</motion.div>
          <h1 className="text-3xl font-black text-white mb-1">Oyun Bitti!</h1>
          <p className="text-gray-500 text-sm mb-6">Higher or Lower</p>

          <div className="my-6">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Toplam Puan</p>
            <div className="text-6xl font-black gradient-text glow-purple">
              <CountUp to={score} />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <p className="text-gray-500 text-xs mb-1">Seri</p>
            <p className="text-2xl font-bold flex items-center justify-center gap-2">
              <span>🔥</span>
              <span className="text-orange-400">{streak} doğru</span>
            </p>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/quiz" className="text-gray-600 hover:text-gray-300 text-sm">← Çık</Link>
          <span className="text-gray-400 font-medium text-sm">⭐ Higher or Lower</span>
          <div className="text-right">
            <div className="text-purple-400 font-black text-xl tabular-nums">
              <CountUp to={score} duration={500} />
            </div>
            <div className="text-gray-600 text-[10px] uppercase tracking-wider">puan</div>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <motion.div
            key={streak}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className={`rounded-2xl px-5 py-2 flex items-center gap-2 shadow-lg ${
              streak >= 5 ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-500/40'
                : streak >= 2 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/30'
                : 'glass border border-white/10'
            }`}
          >
            <motion.span
              animate={streak >= 2 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-xl"
            >
              🔥
            </motion.span>
            <span className="text-white font-black tabular-nums">{streak} seri</span>
          </motion.div>
        </div>

        <p className="text-center text-gray-300 font-semibold text-lg mb-5">
          Hangisinin <span className="text-yellow-400">Metacritic puanı</span> daha yüksek?
        </p>

        <div className="flex gap-3 md:gap-4 items-stretch">
          {champion && <GameCard game={champion} phase={phase} side="champion" selected={selected} isCorrect={isCorrect} onClick={handlePick} />}
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg shadow-purple-500/40">
              VS
            </div>
          </div>
          {challenger && <GameCard game={challenger} phase={phase} side="challenger" selected={selected} isCorrect={isCorrect} onClick={handlePick} />}
        </div>

        <AnimatePresence>
          {phase === 'revealed' && (
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`mt-5 text-center text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}
            >
              {isCorrect
                ? `✅ Doğru! +${100 + streak * 10} puan${streak > 1 ? ` · 🔥 ${streak} seri` : ''}`
                : '❌ Yanlış! Oyun bitti.'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
