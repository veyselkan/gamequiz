import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MODE_INFO = {
  1: { title: 'Adını Bil', icon: '🖼️' },
  2: { title: 'Pixel Quiz', icon: '🔲' },
  3: { title: 'Puan Tahmini', icon: '⭐' },
  4: { title: 'Açıklama Quiz', icon: '📖' },
  5: { title: 'Geliştirici Kim?', icon: '🏢' },
};

const PIXEL_STYLES = ['blur-none', 'blur-sm', 'blur', 'blur-md', 'blur-lg'];

// ── Easter egg content ──────────────────────────────────────────────
const LOADING_MSGS = [
  "RAWG API'ye rüşvet veriyoruz... 💸",
  "Sunucu uyuyordu, zorla uyandırdık ☕",
  "En zor soruları seçiyoruz 😈",
  "Oyun veritabanını hackledik... şaka 🙃",
  "Kahve molasından dönüyoruz, sabır...",
  "Bu ekran uzun sürüyorsa Wi-Fi suçlu",
  "Sorular alfabetik sıralandı, vazgeçildi",
];

const WRONG_STREAK_TOASTS = {
  2: { msg: "Bro...", emoji: "😬" },
  3: { msg: "Bu oyunları hiç oynamadın değil mi?", emoji: "😅" },
  4: { msg: "En kötü ihtimalle öğrenmiş olursun 💀", emoji: "💀" },
  5: { msg: "Bro bu quiz, dedektiflik değil 🕵️", emoji: "🕵️" },
  6: { msg: "Tamam artık google açabilirsin 🙏", emoji: "🙏" },
};

const DANCE_CHARS = ['🎮', '🕹️', '👾', '🏆', '⚔️', '🎯', '💎', '🌟'];

function Toast({ msg, emoji }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast pointer-events-none">
      <div className="glass border border-white/15 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
        <span className="text-2xl">{emoji}</span>
        <span className="text-white font-semibold text-sm whitespace-nowrap">{msg}</span>
      </div>
    </div>
  );
}

function PerfectScoreOverlay({ score, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
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
      <h2 className="text-5xl font-black animate-rainbow mb-2">MÜKEMMEL!</h2>
      <p className="text-gray-300 text-lg mb-3">Tüm soruları doğru cevapladın!</p>
      <p className="text-purple-300 font-bold text-3xl">{score} puan</p>
      <p className="text-gray-600 text-xs mt-6">Sonuç ekranı birazdan...</p>
    </div>
  );
}

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

  // Easter egg state
  const [toast, setToast] = useState(null);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [showPerfect, setShowPerfect] = useState(false);
  const [btnAnim, setBtnAnim] = useState({}); // { optionIdx: 'correct'|'wrong' }
  const questionStartRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg, emoji, ms = 2800) => {
    clearTimeout(toastTimerRef.current);
    setToast({ msg, emoji });
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
      .then(({ data }) => { setQuestions(data); setPhase('question'); })
      .catch(err => { if (!controller.signal.aborted) setError('Sorular yüklenemedi, lütfen tekrar dene.'); });
    return () => controller.abort();
  }, [mode]);

  // Track when question starts
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
      setBtnAnim({});
      setPhase('question');
    }
  }, [current, questions.length]);

  const handleAnswer = useCallback((answer) => {
    if (phase !== 'question') return;

    const q = questions[current];
    const isCorrect = answer !== null && String(answer) === String(q.correct);
    const answerSec = questionStartRef.current
      ? (Date.now() - questionStartRef.current) / 1000
      : 10;

    if (answer === null) {
      setPhase('eliminated');
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
        return;
      }
      setWrongAttempts(newWrong);
    }

    setPhase('answered');
    setSelected(answer);

    const optIdx = q.options.findIndex(o => String(o) === String(answer));
    const corrIdx = q.options.findIndex(o => String(o) === String(q.correct));

    if (isCorrect) {
      const timeBonus = timeLeft * 5;
      const pixelBonus = mode === '2' ? pixelLevel * 25 : 0;
      setScore(s => s + 100 + timeBonus + pixelBonus);
      setCorrectCount(c => c + 1);
      setWrongStreak(0);
      setBtnAnim({ [optIdx]: 'correct' });

      // Speed easter egg
      if (answerSec < 2) showToast('Speedrun başladı! 🏃', '⚡');
    } else {
      const newStreak = wrongStreak + 1;
      setWrongStreak(newStreak);
      setBtnAnim({ [optIdx]: 'wrong' });

      const streakToast = WRONG_STREAK_TOASTS[Math.min(newStreak, 6)];
      if (streakToast) showToast(streakToast.msg, streakToast.emoji);
      else if (answerSec < 2) showToast('Çok hızlısın... googladın değil mi? 👀', '👀');
    }

    // Last-second save
    if (timeLeft <= 1 && isCorrect) showToast('Son saniyede! Matrix gibi görüyorsun 🕶️', '🕶️');

    setTimeout(goNext, 2000);
  }, [phase, questions, current, timeLeft, pixelLevel, mode, goNext, wrongAttempts, wrongStreak, showToast]);

  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;

  // Countdown timer
  useEffect(() => {
    if (phase !== 'question') return;
    if (timeLeft <= 0) { handleAnswerRef.current(null); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase]);

  // Pixel reveal every 5 s
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

  // Trigger perfect score overlay
  useEffect(() => {
    if (phase === 'finished' && correctCount === questions.length && questions.length > 0) {
      setShowPerfect(true);
    }
  }, [phase, correctCount, questions.length]);

  // ── Render states ──────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass border border-white/10 rounded-2xl p-10 max-w-sm">
          <div className="text-5xl mb-4">😵</div>
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/quiz" className="text-purple-400 hover:text-purple-300 text-sm">← Geri dön</Link>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-5 animate-float inline-block">🎮</div>
          <p className="text-gray-300 text-lg font-semibold mb-2 min-h-[1.8rem] transition-all">
            {LOADING_MSGS[loadingMsgIdx]}
          </p>
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
        <div className="glass border border-red-500/30 rounded-2xl p-10 max-w-md w-full text-center animate-fade-in-up">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-3xl font-black text-red-400 mb-2">Süre Bitti!</h1>
          <p className="text-gray-500 mb-1">Zamanında cevap veremedin — elendin.</p>
          {wrongStreak >= 4 && (
            <p className="text-gray-600 text-sm italic mb-2">"Hiç sorun değil, öğrenmek için oynuyoruz" 🙃</p>
          )}

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 mt-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Toplam Puan</span>
              <span className="text-purple-400 font-bold text-lg">{score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Doğru Cevap</span>
              <span className="text-green-400 font-semibold">{correctCount} / {questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ulaşılan Soru</span>
              <span className="text-yellow-400 font-semibold">{current + 1}. soru</span>
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
              className="flex-1 bg-red-700/70 hover:bg-red-600/80 border border-red-600/40 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02]"
            >
              Tekrar Dene
            </button>
            <Link
              to="/leaderboard"
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-all text-center"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'finished') {
    const pct = Math.round((correctCount / questions.length) * 100);
    const isPerfect = correctCount === questions.length;
    const isZero = correctCount === 0;

    return (
      <>
        {showPerfect && <PerfectScoreOverlay score={score} onDone={() => setShowPerfect(false)} />}
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className={`glass border rounded-2xl p-10 max-w-md w-full text-center animate-fade-in-up ${
            isPerfect ? 'border-purple-500/50' : 'border-white/10'
          }`}>
            <div className="text-6xl mb-4">
              {isPerfect ? '🏆' : isZero ? '😭' : pct >= 70 ? '👍' : '💪'}
            </div>
            <h1 className={`text-3xl font-black mb-1 ${isPerfect ? 'animate-rainbow' : 'text-white'}`}>
              {isPerfect ? 'Mükemmel!' : 'Quiz Bitti!'}
            </h1>
            <p className="text-gray-500 mb-1 text-sm">{MODE_INFO[mode]?.title}</p>
            {isZero && (
              <p className="text-gray-600 italic text-sm mb-2">
                "0 doğru... Bu tesadüf bile olamaz" 🤔
              </p>
            )}

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 mt-5 space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-gray-500">Toplam Puan</span>
                <span className="text-purple-400 font-bold">{score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Doğru Cevap</span>
                <span className="text-green-400 font-semibold">{correctCount} / {questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Başarı Oranı</span>
                <span className="text-yellow-400 font-semibold">%{pct}</span>
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
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] btn-glow"
              >
                Tekrar Oyna
              </button>
              <Link
                to="/leaderboard"
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-all text-center"
              >
                Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Active question ────────────────────────────────────────────────
  const q = questions[current];
  const isAnswered = phase === 'answered';
  const modeNum = Number(mode);

  return (
    <div className="min-h-screen px-4 py-8">
      {toast && <Toast msg={toast.msg} emoji={toast.emoji} />}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <Link to="/quiz" className="text-gray-600 hover:text-gray-300 text-sm transition-colors">← Çık</Link>
          <span className="text-gray-400 text-sm font-medium">
            {MODE_INFO[mode]?.icon} {MODE_INFO[mode]?.title}
          </span>
          <span className="text-purple-400 font-bold">{score} puan</span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i < current ? 'bg-purple-500' : i === current ? 'bg-purple-400' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Timer row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600 text-sm">Soru {current + 1} / {questions.length}</span>
          <div className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-all ${
            timeLeft <= 5
              ? 'bg-red-900/40 text-red-400 border border-red-800/50 animate-pulse'
              : 'bg-white/5 border border-white/10 text-white'
          }`}>
            ⏱ {timeLeft}s
          </div>
        </div>

        {/* Question card */}
        <div className="glass border border-white/10 rounded-2xl overflow-hidden mb-5">

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
                  <div className="bg-black/70 text-xs text-gray-300 px-2 py-1 rounded-lg">
                    Netlik: {5 - pixelLevel}/5
                  </div>
                  <div className="bg-black/70 text-xs px-2 py-1 rounded-lg flex gap-1">
                    {Array.from({ length: MAX_PIXEL_WRONG }).map((_, i) => (
                      <span key={i} className={`transition-all ${i < MAX_PIXEL_WRONG - wrongAttempts ? 'text-red-400' : 'text-gray-700'}`}>♥</span>
                    ))}
                  </div>
                </div>
              )}
              {modeNum === 2 && pixelWrong && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-900/85 text-red-300 font-bold text-lg px-6 py-3 rounded-xl animate-slide-down">
                    ❌ Yanlış! Görüntü netleşti
                  </div>
                </div>
              )}
            </div>
          )}

          {(modeNum === 3 || modeNum === 5) && (
            <div className="relative" style={{ aspectRatio: '16/9' }}>
              {q.image && <img src={q.image} alt="oyun" className="w-full h-full object-cover opacity-40" />}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 to-transparent">
                <h2 className="text-2xl font-bold text-white text-center px-6 drop-shadow-lg">{q.name}</h2>
              </div>
            </div>
          )}

          {modeNum === 4 && (
            <div className="p-6 text-center">
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

          <div className="px-5 py-3 border-t border-white/5">
            <p className="text-gray-300 font-medium text-center text-sm">
              {modeNum === 1 && 'Bu oyunun adı nedir?'}
              {modeNum === 2 && 'Hangi oyun?'}
              {modeNum === 3 && 'Bu oyunun Metacritic puanı nedir?'}
              {modeNum === 4 && 'Bu etiketler hangi oyuna ait?'}
              {modeNum === 5 && 'Bu oyunu hangi stüdyo geliştirdi?'}
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            const isCorrect = String(opt) === String(q.correct);
            const isSelected = String(selected) === String(opt);
            const anim = btnAnim[i];

            let cls = 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-purple-500/40';
            if (isAnswered) {
              if (isCorrect) cls = 'bg-green-700/60 border-green-500/60 text-white shadow-[0_0_15px_rgba(74,222,128,0.2)]';
              else if (isSelected) cls = 'bg-red-700/50 border-red-500/50 text-white';
              else cls = 'bg-white/[0.03] text-gray-600 border border-white/5 opacity-50';
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={isAnswered}
                className={`${cls} ${anim === 'correct' ? 'animate-correct' : ''} ${anim === 'wrong' ? 'animate-wrong' : ''} rounded-xl px-4 py-3.5 font-medium text-sm transition-all border`}
              >
                {opt}
                {isAnswered && isCorrect && <span className="ml-2 text-green-400">✓</span>}
                {isAnswered && isSelected && !isCorrect && <span className="ml-2 text-red-400">✗</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
