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

const PIXEL_STYLES = [
  'blur-none',
  'blur-sm',
  'blur',
  'blur-md',
  'blur-lg',
];

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

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/quiz/${mode}`, { signal: controller.signal })
      .then(({ data }) => {
        setQuestions(data);
        setPhase('question');
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError('Sorular yüklenemedi, lütfen tekrar dene.');
        }
      });
    return () => controller.abort();
  }, [mode]);

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
    const isCorrect = answer !== null && String(answer) === String(q.correct);

    if (answer === null) {
      setPhase('eliminated');
      return;
    }

    // Pixel Quiz: yanlış cevapta görüntüyü netleştir, aynı soruda kal (maks 3 hak)
    if (mode === '2' && !isCorrect && answer !== null) {
      const newWrong = wrongAttempts + 1;
      if (newWrong < MAX_PIXEL_WRONG) {
        setPixelLevel(l => Math.max(0, l - 1));
        setWrongAttempts(newWrong);
        setPixelWrong(true);
        setTimeout(() => setPixelWrong(false), 1000);
        return;
      }
      // 3. yanlışta soru biter
      setWrongAttempts(newWrong);
    }

    setPhase('answered');
    setSelected(answer);

    if (isCorrect) {
      const timeBonus = timeLeft * 5;
      const pixelBonus = mode === '2' ? pixelLevel * 25 : 0;
      setScore(s => s + 100 + timeBonus + pixelBonus);
      setCorrectCount(c => c + 1);
    }

    setTimeout(goNext, 2000);
  }, [phase, questions, current, timeLeft, pixelLevel, mode, goNext]);

  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;

  // Countdown timer
  useEffect(() => {
    if (phase !== 'question') return;
    if (timeLeft <= 0) {
      handleAnswerRef.current(null);
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase]);

  // Pixel reveal every 5 seconds
  useEffect(() => {
    if (phase !== 'question' || mode !== '2' || pixelLevel <= 0) return;
    const t = setTimeout(() => setPixelLevel(l => l - 1), 5000);
    return () => clearTimeout(t);
  }, [pixelLevel, phase, mode]);

  // Save score when finished or eliminated
  useEffect(() => {
    if ((phase !== 'finished' && phase !== 'eliminated') || !user) return;
    api.post('/scores', {
      mode: Number(mode),
      score,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
    }).catch(() => {});
  }, [phase]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link to="/quiz" className="text-purple-400 hover:underline">← Geri dön</Link>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎮</div>
          <p className="text-gray-400 text-lg">Sorular yükleniyor...</p>
          {(mode === '4' || mode === '5') && (
            <p className="text-gray-500 text-sm mt-2">Bu mod biraz uzun sürebilir</p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'eliminated') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-red-700 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-3xl font-bold text-red-400 mb-2">Süre Bitti!</h1>
          <p className="text-gray-400 mb-6">Zamanında cevap veremedin — elendin.</p>

          <div className="bg-gray-800 rounded-xl p-6 mb-6 space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-gray-400">Toplam Puan</span>
              <span className="text-purple-400 font-bold">{score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Doğru Cevap</span>
              <span className="text-green-400 font-semibold">{correctCount} / {questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ulaşılan Soru</span>
              <span className="text-yellow-400 font-semibold">{current + 1}. soru</span>
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
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Tekrar Dene
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
  }

  if (phase === 'finished') {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-purple-700 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{pct >= 70 ? '🏆' : pct >= 40 ? '👍' : '💪'}</div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Bitti!</h1>
          <p className="text-gray-400 mb-6">{MODE_INFO[mode]?.title}</p>

          <div className="bg-gray-800 rounded-xl p-6 mb-6 space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-gray-400">Toplam Puan</span>
              <span className="text-purple-400 font-bold">{score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Doğru Cevap</span>
              <span className="text-green-400 font-semibold">{correctCount} / {questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Başarı Oranı</span>
              <span className="text-yellow-400 font-semibold">%{pct}</span>
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
  }

  const q = questions[current];
  const isAnswered = phase === 'answered';
  const modeNum = Number(mode);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/quiz" className="text-gray-500 hover:text-gray-300 text-sm">← Çık</Link>
          <span className="text-gray-400 font-medium">
            {MODE_INFO[mode]?.icon} {MODE_INFO[mode]?.title}
          </span>
          <span className="text-purple-400 font-bold">{score} puan</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < current ? 'bg-purple-500' : i === current ? 'bg-purple-300' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm">Soru {current + 1} / {questions.length}</span>
          <div className={`text-lg font-bold px-4 py-1 rounded-lg ${
            timeLeft <= 5 ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-white'
          }`}>
            ⏱ {timeLeft}s
          </div>
        </div>

        {/* Question card */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden mb-6">

          {/* Mode 1 & 2: Image */}
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
                  <div className="bg-black/70 text-xs text-gray-300 px-2 py-1 rounded">
                    Netlik: {5 - pixelLevel}/5
                  </div>
                  <div className="bg-black/70 text-xs px-2 py-1 rounded flex gap-1">
                    {Array.from({ length: MAX_PIXEL_WRONG }).map((_, i) => (
                      <span key={i} className={i < MAX_PIXEL_WRONG - wrongAttempts ? 'text-red-400' : 'text-gray-600'}>♥</span>
                    ))}
                  </div>
                </div>
              )}
              {modeNum === 2 && pixelWrong && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-900/80 text-red-300 font-bold text-lg px-6 py-3 rounded-xl">
                    ❌ Yanlış! Görüntü netleşti
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Score — image + game name */}
          {modeNum === 3 && (
            <div className="relative" style={{ aspectRatio: '16/9' }}>
              {q.image && (
                <img src={q.image} alt="oyun" className="w-full h-full object-cover opacity-50" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <h2 className="text-2xl font-bold text-white text-center px-4 drop-shadow-lg">{q.name}</h2>
              </div>
            </div>
          )}

          {/* Mode 4: Tags */}
          {modeNum === 4 && (
            <div className="p-6 text-center">
              <p className="text-gray-400 text-xs mb-3 uppercase tracking-widest">Bu oyunun etiketleri</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {q.description.split(' • ').map((tag, i) => (
                  <span key={i} className="bg-purple-900/50 border border-purple-700 text-purple-300 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mode 5: Developer — image + game name */}
          {modeNum === 5 && (
            <div className="relative" style={{ aspectRatio: '16/9' }}>
              {q.image && (
                <img src={q.image} alt="oyun" className="w-full h-full object-cover opacity-50" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <h2 className="text-2xl font-bold text-white text-center px-4 drop-shadow-lg">{q.name}</h2>
              </div>
            </div>
          )}

          <div className="p-4">
            <p className="text-gray-300 font-medium text-center">
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

            let btnClass = 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700';
            if (isAnswered) {
              if (isCorrect) btnClass = 'bg-green-700 border-green-500 text-white';
              else if (isSelected) btnClass = 'bg-red-700 border-red-500 text-white';
              else btnClass = 'bg-gray-800 text-gray-500 border border-gray-700 opacity-50';
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={isAnswered}
                className={`${btnClass} rounded-xl px-4 py-3 font-medium text-sm transition-all border`}
              >
                {opt}
                {isAnswered && isCorrect && ' ✓'}
                {isAnswered && isSelected && !isCorrect && ' ✗'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
