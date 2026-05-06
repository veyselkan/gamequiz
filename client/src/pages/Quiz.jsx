import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ── Static config ──────────────────────────────────────────────────
const MODE_INFO = {
  1: { title: 'Adını Bil', icon: '🖼️' },
  2: { title: 'Pixel Quiz', icon: '🔲' },
  3: { title: 'Puan Tahmini', icon: '⭐' },
  4: { title: 'Açıklama Quiz', icon: '📖' },
  5: { title: 'Geliştirici Kim?', icon: '🏢' },
};

const PIXEL_STYLES = ['blur-none', 'blur-sm', 'blur', 'blur-md', 'blur-lg'];

const OPTION_STYLES = [
  { letter: 'A', gradient: 'from-purple-500 to-purple-700', glow: 'shadow-purple-500/40' },
  { letter: 'B', gradient: 'from-blue-500 to-blue-700',     glow: 'shadow-blue-500/40' },
  { letter: 'C', gradient: 'from-pink-500 to-pink-700',     glow: 'shadow-pink-500/40' },
  { letter: 'D', gradient: 'from-orange-500 to-orange-700', glow: 'shadow-orange-500/40' },
  { letter: 'E', gradient: 'from-green-500 to-green-700',   glow: 'shadow-green-500/40' },
  { letter: 'F', gradient: 'from-red-500 to-red-700',       glow: 'shadow-red-500/40' },
];

const LOADING_MSGS = [
  "RAWG API'ye rüşvet veriyoruz... 💸",
  "Sunucu uyuyordu, zorla uyandırdık ☕",
  "En zor soruları seçiyoruz 😈",
  "Oyun veritabanını hackledik... şaka 🙃",
  "Kahve molasından dönüyoruz, sabır...",
  "Bu ekran uzun sürüyorsa Wi-Fi suçlu",
];

const WRONG_STREAK_TOASTS = {
  2: { msg: "Bro...", emoji: "😬" },
  3: { msg: "Bu oyunları hiç oynamadın değil mi?", emoji: "😅" },
  4: { msg: "En kötü ihtimalle öğrenmiş olursun 💀", emoji: "💀" },
  5: { msg: "Bro bu quiz, dedektiflik değil 🕵️", emoji: "🕵️" },
  6: { msg: "Tamam artık google açabilirsin 🙏", emoji: "🙏" },
};

const STREAK_TOASTS = {
  3: { msg: "Üç doğru! Isınma turu bitti 🔥", emoji: "🔥" },
  5: { msg: "Beş arka arkaya! Yanıyor! ⚡", emoji: "⚡" },
  7: { msg: "Yedi kombo! Sen kimsin? 👑", emoji: "👑" },
  10: { msg: "ON KOMBO! ÇILGIN! 🏆", emoji: "🏆" },
};

const DANCE_CHARS = ['🎮', '🕹️', '👾', '🏆', '⚔️', '🎯', '💎', '🌟'];

// ── Helpers ────────────────────────────────────────────────────────
const fireConfetti = (intensity = 1) => {
  confetti({
    particleCount: Math.round(60 * intensity),
    spread: 80,
    startVelocity: 35,
    origin: { y: 0.65 },
    colors: ['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#fbbf24', '#06b6d4'],
    ticks: 220,
    scalar: 0.9,
  });
};

const fireBigConfetti = () => {
  const end = Date.now() + 1500;
  const colors = ['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#fbbf24'];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
};

const vibrate = (pattern) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
};

// ── Sub-components ─────────────────────────────────────────────────
function CircularTimer({ timeLeft, total = 20 }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, timeLeft) / total);
  const color = timeLeft > 10 ? '#22c55e' : timeLeft > 5 ? '#eab308' : '#ef4444';

  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
        <circle
          cx="50" cy="50" r={r}
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease',
            filter: `drop-shadow(0 0 6px ${color}aa)`,
          }}
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center font-black text-xl ${
          timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'
        }`}
      >
        {timeLeft}
      </div>
    </div>
  );
}

function StreakBadge({ streak }) {
  if (streak < 2) return null;
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl px-3 py-1.5 flex items-center gap-1.5 shadow-lg shadow-orange-500/50"
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="text-base"
      >
        🔥
      </motion.span>
      <span className="font-black text-white text-sm tabular-nums">{streak}</span>
    </motion.div>
  );
}

function CountUp({ to, duration = 1400 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (to === 0) { setVal(0); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{val.toLocaleString('tr-TR')}</>;
}

function FloatingXP({ amount, id }) {
  return (
    <motion.div
      key={id}
      initial={{ y: 30, opacity: 0, scale: 0.5 }}
      animate={{ y: -120, opacity: [0, 1, 1, 0], scale: [0.5, 1.4, 1.2, 1] }}
      transition={{ duration: 1.5, ease: 'easeOut', times: [0, 0.15, 0.75, 1] }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
    >
      <div className="text-5xl md:text-6xl font-black text-green-400 drop-shadow-[0_0_25px_rgba(74,222,128,0.7)]">
        +{amount} <span className="text-2xl md:text-3xl">XP</span>
      </div>
    </motion.div>
  );
}

function ScreenFlash({ flash }) {
  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.id}
          initial={{ opacity: 0.45 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
          className={`fixed inset-0 pointer-events-none z-30 ${
            flash.type === 'correct' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      )}
    </AnimatePresence>
  );
}

function Toast({ msg, emoji }) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 30, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div className="glass border border-white/15 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
        <span className="text-2xl">{emoji}</span>
        <span className="text-white font-semibold text-sm whitespace-nowrap">{msg}</span>
      </div>
    </motion.div>
  );
}

function PerfectOverlay({ score, onDone }) {
  useEffect(() => {
    fireBigConfetti();
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
    >
      <div className="flex gap-3 mb-6">
        {DANCE_CHARS.map((ch, i) => (
          <span
            key={i}
            className="text-5xl md:text-6xl animate-dance inline-block"
            style={{ animationDelay: `${i * 0.09}s`, animationDuration: `${0.65 + i * 0.05}s` }}
          >
            {ch}
          </span>
        ))}
      </div>
      <motion.h2
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        className="text-6xl md:text-7xl font-black animate-rainbow mb-2"
      >
        MÜKEMMEL!
      </motion.h2>
      <p className="text-gray-300 text-lg mb-3">Tüm soruları doğru cevapladın!</p>
      <p className="text-purple-300 font-black text-4xl"><CountUp to={score} /> puan</p>
    </motion.div>
  );
}

// ── Main ───────────────────────────────────────────────────────────
export default function Quiz() {
  const { mode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [pixelLevel, setPixelLevel] = useState(4);
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState('');
  const [pixelWrong, setPixelWrong] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const MAX_PIXEL_WRONG = 3;

  // wow-effect state
  const [streak, setStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [toast, setToast] = useState(null);
  const [flash, setFlash] = useState(null);
  const [xpFloat, setXpFloat] = useState(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [showPerfect, setShowPerfect] = useState(false);
  const questionStartRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg, emoji, ms = 2600) => {
    clearTimeout(toastTimerRef.current);
    setToast({ msg, emoji, id: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), ms);
  }, []);

  // Rotate loading messages
  useEffect(() => {
    if (phase !== 'loading') return;
    const t = setInterval(() => setLoadingMsgIdx(i => (i + 1) % LOADING_MSGS.length), 2200);
    return () => clearInterval(t);
  }, [phase]);

  // Load questions
  useEffect(() => {
    const controller = new AbortController();
    api.get(`/quiz/${mode}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!data || data.length === 0) { setError('Soru oluşturulamadı, lütfen tekrar dene.'); return; }
        setQuestions(data); setPhase('question');
      })
      .catch(() => setError('Sorular yüklenemedi, lütfen tekrar dene.'));
    return () => controller.abort();
  }, [mode]);

  useEffect(() => {
    if (phase === 'question') questionStartRef.current = Date.now();
  }, [phase, current]);

  const goNext = useCallback(() => {
    if (current + 1 >= questions.length) {
      setPhase('finished');
    } else {
      setCurrent(c => c + 1);
      setTimeLeft(20);
      setPixelLevel(4);
      setSelected(null);
      setPixelWrong(false);
      setWrongAttempts(0);
      setPhase('question');
    }
  }, [current, questions.length]);

  const handleAnswer = useCallback((answer) => {
    if (phase !== 'question') return;

    const q = questions[current];
    if (!q) return;
    const isCorrect = answer !== null && String(answer) === String(q.correct);
    const answerSec = questionStartRef.current
      ? (Date.now() - questionStartRef.current) / 1000
      : 10;

    if (answer === null) {
      setPhase('eliminated');
      vibrate([100, 50, 100, 50, 100]);
      return;
    }

    // Pixel quiz: wrong with lives remaining
    if (mode === '2' && !isCorrect) {
      const newWrong = wrongAttempts + 1;
      if (newWrong < MAX_PIXEL_WRONG) {
        setPixelLevel(l => Math.max(0, l - 1));
        setWrongAttempts(newWrong);
        setPixelWrong(true);
        setTimeout(() => setPixelWrong(false), 900);
        setFlash({ type: 'wrong', id: Date.now() });
        vibrate(80);
        return;
      }
      setWrongAttempts(newWrong);
    }

    setPhase('answered');
    setSelected(answer);
    if (isCorrect && mode === '2') setPixelLevel(0);

    if (isCorrect) {
      const timeBonus = timeLeft * 5;
      const pixelBonus = mode === '2' ? pixelLevel * 25 : 0;
      const streakBonus = streak * 10;
      const total = 100 + timeBonus + pixelBonus + streakBonus;

      setScore(s => s + total);
      setCorrectCount(c => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setWrongStreak(0);

      // wow effects
      fireConfetti(newStreak >= 5 ? 1.6 : 1);
      setFlash({ type: 'correct', id: Date.now() });
      setXpFloat({ amount: total, id: Date.now() });
      vibrate(40);

      // streak milestone toasts
      const streakToast = STREAK_TOASTS[newStreak];
      if (streakToast) showToast(streakToast.msg, streakToast.emoji, 2200);
      else if (answerSec < 2) showToast('Speedrun! 🏃', '⚡', 1800);
      else if (timeLeft <= 1) showToast('Son saniyede! Matrix gibi 🕶️', '🕶️', 2000);
    } else {
      const newWrongStreak = wrongStreak + 1;
      setWrongStreak(newWrongStreak);
      setStreak(0);
      setFlash({ type: 'wrong', id: Date.now() });
      vibrate([60, 40, 60]);

      const wt = WRONG_STREAK_TOASTS[Math.min(newWrongStreak, 6)];
      if (wt) showToast(wt.msg, wt.emoji);
      else if (answerSec < 2) showToast('Çok hızlısın... googladın değil mi? 👀', '👀');
    }

    setTimeout(goNext, 1900);
  }, [phase, questions, current, timeLeft, pixelLevel, mode, goNext, wrongAttempts, wrongStreak, streak, showToast]);

  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;

  // Countdown timer
  useEffect(() => {
    if (phase !== 'question') return;
    if (timeLeft <= 0) { handleAnswerRef.current(null); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase]);

  // Pixel reveal
  useEffect(() => {
    if (phase !== 'question' || mode !== '2' || pixelLevel <= 0) return;
    const t = setTimeout(() => setPixelLevel(l => l - 1), 5000);
    return () => clearTimeout(t);
  }, [pixelLevel, phase, mode]);

  // Save score
  useEffect(() => {
    if ((phase !== 'finished' && phase !== 'eliminated') || !user) return;
    api.post('/scores', {
      mode: Number(mode),
      score,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
    }).catch(() => {});
  }, [phase]); // eslint-disable-line

  // Trigger perfect overlay
  useEffect(() => {
    if (phase === 'finished' && correctCount === questions.length && questions.length > 0) {
      setShowPerfect(true);
    }
  }, [phase, correctCount, questions.length]);

  // ── Render ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center glass border border-red-500/30 rounded-2xl p-10 max-w-sm"
        >
          <div className="text-6xl mb-4">😵</div>
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/quiz" className="text-purple-400 hover:text-purple-300 text-sm">← Geri dön</Link>
        </motion.div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, -8, 8, -8, 0], y: [0, -10, 0, -5, 0] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="text-7xl mb-6 inline-block"
          >
            🎮
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.p
              key={loadingMsgIdx}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-gray-300 text-lg font-semibold mb-2"
            >
              {LOADING_MSGS[loadingMsgIdx]}
            </motion.p>
          </AnimatePresence>
          <p className="text-gray-600 text-xs">
            {(mode === '4' || mode === '5') && 'Bu mod biraz uzun sürebilir...'}
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'eliminated') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ScreenFlash flash={flash} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="glass border border-red-500/30 rounded-3xl p-10 max-w-md w-full text-center"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-7xl mb-4"
          >
            ⏰
          </motion.div>
          <h1 className="text-3xl font-black text-red-400 mb-2">Süre Bitti!</h1>
          <p className="text-gray-500 mb-6 text-sm">Zamanında cevap veremedin — elendin.</p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Toplam Puan</span>
              <span className="text-purple-400 font-black text-xl">
                <CountUp to={score} duration={1000} />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Doğru Cevap</span>
              <span className="text-green-400 font-bold">{correctCount} / {questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ulaşılan Soru</span>
              <span className="text-yellow-400 font-bold">{current + 1}. soru</span>
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
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 rounded-2xl transition-all hover:scale-[1.03] shadow-lg shadow-red-500/30"
            >
              Tekrar Dene
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

  if (phase === 'finished') {
    const pct = Math.round((correctCount / questions.length) * 100);
    const isPerfect = correctCount === questions.length;
    const isZero = correctCount === 0;

    let badge = '💪';
    if (isPerfect) badge = '🏆';
    else if (isZero) badge = '😭';
    else if (pct >= 70) badge = '🎯';
    else if (pct >= 40) badge = '👍';

    return (
      <>
        {showPerfect && <PerfectOverlay score={score} onDone={() => setShowPerfect(false)} />}
        <div className="min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className={`glass border rounded-3xl p-8 md:p-10 max-w-md w-full text-center ${
              isPerfect ? 'border-purple-500/50' : 'border-white/10'
            }`}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 250 }}
              className="text-7xl mb-3"
            >
              {badge}
            </motion.div>
            <h1 className={`text-3xl font-black mb-1 ${isPerfect ? 'animate-rainbow' : 'text-white'}`}>
              {isPerfect ? 'Mükemmel!' : 'Quiz Bitti!'}
            </h1>
            <p className="text-gray-500 mb-1 text-sm">{MODE_INFO[mode]?.title}</p>
            {isZero && (
              <p className="text-gray-600 italic text-sm mt-2">
                "0 doğru... Bu tesadüf bile olamaz" 🤔
              </p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="my-6"
            >
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Toplam Puan</p>
              <div className="text-6xl md:text-7xl font-black gradient-text glow-purple">
                <CountUp to={score} />
              </div>
            </motion.div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Doğru</p>
                <p className="text-green-400 font-bold text-lg">{correctCount} / {questions.length}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Başarı</p>
                <p className="text-yellow-400 font-bold text-lg">%{pct}</p>
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
        </div>
      </>
    );
  }

  // ── Active question ────────────────────────────────────────────
  const q = questions[current];
  const isAnswered = phase === 'answered';
  const modeNum = Number(mode);

  return (
    <div className="min-h-screen px-4 py-6 relative">
      <ScreenFlash flash={flash} />
      <AnimatePresence>
        {xpFloat && <FloatingXP key={xpFloat.id} amount={xpFloat.amount} id={xpFloat.id} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast key={toast.id} msg={toast.msg} emoji={toast.emoji} />}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">
        {/* Top bar: exit | timer + streak | score */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/quiz" className="text-gray-600 hover:text-gray-300 text-sm transition-colors">← Çık</Link>
          <div className="flex items-center gap-3">
            <CircularTimer timeLeft={timeLeft} />
            <AnimatePresence>
              {streak >= 2 && <StreakBadge streak={streak} />}
            </AnimatePresence>
          </div>
          <div className="text-right">
            <div className="text-purple-400 font-black text-xl tabular-nums">
              <CountUp to={score} duration={500} />
            </div>
            <div className="text-gray-600 text-[10px] uppercase tracking-wider">puan</div>
          </div>
        </div>

        {/* Mode label + progress */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-gray-500 text-xs font-medium">
            {MODE_INFO[mode]?.icon} {MODE_INFO[mode]?.title}
          </span>
          <span className="text-gray-600 text-xs">{current + 1} / {questions.length}</span>
        </div>
        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i < current ? 'bg-purple-500'
                  : i === current ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                  : 'bg-white/8'
              }`}
              style={i < current ? { boxShadow: '0 0 6px rgba(168,85,247,0.4)' } : {}}
            />
          ))}
        </div>

        {/* Question card + options (animated per question) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            {/* Question card */}
            <div className="glass border border-white/10 rounded-3xl overflow-hidden mb-5 shadow-xl">
              {(modeNum === 1 || modeNum === 2) && q.image && (
                <div className="relative" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={q.image}
                    alt="oyun"
                    className={`w-full h-full object-cover transition-all duration-1000 ${
                      modeNum === 2 ? PIXEL_STYLES[pixelLevel] : ''
                    }`}
                    style={modeNum === 2 ? { imageRendering: pixelLevel > 1 ? 'pixelated' : 'auto' } : {}}
                  />
                  {modeNum === 2 && (
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                      <div className="bg-black/70 backdrop-blur text-xs text-gray-300 px-2 py-1 rounded-lg">
                        Netlik {5 - pixelLevel}/5
                      </div>
                      <div className="bg-black/70 backdrop-blur text-xs px-2 py-1 rounded-lg flex gap-1">
                        {Array.from({ length: MAX_PIXEL_WRONG }).map((_, i) => (
                          <span key={i} className={`transition-all ${i < MAX_PIXEL_WRONG - wrongAttempts ? 'text-red-400' : 'text-gray-700'}`}>♥</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {modeNum === 2 && pixelWrong && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="bg-red-900/85 border border-red-500/50 text-red-300 font-bold text-lg px-6 py-3 rounded-2xl">
                        ❌ Görüntü netleşti
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {(modeNum === 3 || modeNum === 5) && (
                <div className="relative" style={{ aspectRatio: '16/9' }}>
                  {q.image && <img src={q.image} alt="oyun" className="w-full h-full object-cover opacity-40" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 to-transparent">
                    <h2 className="text-2xl md:text-3xl font-black text-white text-center px-6 drop-shadow-lg">{q.name}</h2>
                  </div>
                </div>
              )}

              {modeNum === 4 && (
                <div className="p-7 text-center">
                  <p className="text-gray-600 text-xs mb-4 uppercase tracking-widest">Bu oyunun etiketleri</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {q.description.split(' • ').map((tag, i) => (
                      <span key={i} className="bg-purple-900/30 border border-purple-700/50 text-purple-300 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-5 py-4 border-t border-white/5 bg-black/20">
                <p className="text-gray-200 font-semibold text-center">
                  {modeNum === 1 && 'Bu oyunun adı nedir?'}
                  {modeNum === 2 && 'Hangi oyun?'}
                  {modeNum === 3 && 'Bu oyunun Metacritic puanı nedir?'}
                  {modeNum === 4 && 'Bu etiketler hangi oyuna ait?'}
                  {modeNum === 5 && 'Bu oyunu hangi stüdyo geliştirdi?'}
                </p>
              </div>
            </div>

            {/* Kahoot-style A/B/C/D options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {q.options.map((opt, i) => {
                const style = OPTION_STYLES[i] || OPTION_STYLES[0];
                const isCorrect = String(opt) === String(q.correct);
                const isSelected = String(selected) === String(opt);

                let extra = '';
                let bg = `bg-gradient-to-br ${style.gradient} ${style.glow} shadow-lg`;
                if (isAnswered) {
                  if (isCorrect) {
                    bg = 'bg-gradient-to-br from-green-500 to-emerald-700 shadow-green-500/50 shadow-xl';
                    extra = 'ring-2 ring-green-300/60 scale-[1.02]';
                  } else if (isSelected) {
                    bg = 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40';
                    extra = 'opacity-90';
                  } else {
                    bg = 'bg-gray-800/40';
                    extra = 'opacity-30';
                  }
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    disabled={isAnswered}
                    whileHover={!isAnswered ? { scale: 1.025, y: -2 } : {}}
                    whileTap={!isAnswered ? { scale: 0.97 } : {}}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={`${bg} ${extra} relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 text-left transition-all border border-white/10`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/25 backdrop-blur flex-shrink-0 flex items-center justify-center font-black text-xl text-white drop-shadow-md">
                      {style.letter}
                    </div>
                    <span className="font-bold text-white text-sm md:text-base flex-1 drop-shadow leading-tight">
                      {opt}
                    </span>
                    {isAnswered && isCorrect && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                        className="text-2xl drop-shadow"
                      >
                        ✓
                      </motion.span>
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-2xl drop-shadow"
                      >
                        ✗
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
