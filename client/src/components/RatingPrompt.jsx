import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const ESCAPE_TAUNTS = [
  null,
  null,
  'Tutamazsın 😏',
  'Vazgeç artık...',
  'Bunu tasarlayan bizdik 🤓',
  'Hayır basamazsın, evet basabilirsin. Karar senin.',
  'Saygı duyuyorum azmine 🫡',
  'Tamam tamam, fareni bırak biraz dinlen ☕',
  'Sen kazandın. Yine de hayır basamayacaksın 💀',
];

export default function RatingPrompt() {
  const [open, setOpen] = useState(false);
  const [thanked, setThanked] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [escapes, setEscapes] = useState(0);
  const noBtnRef = useRef(null);

  // Reset everything when modal is closed
  useEffect(() => {
    if (!open) {
      setThanked(false);
      setPos({ x: 0, y: 0 });
      setEscapes(0);
    }
  }, [open]);

  const dodge = () => {
    const btn = noBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 40;
    // Move to a random spot inside the viewport (not too close to edges)
    const targetX = Math.random() * (vw - rect.width - margin * 2) + margin;
    const targetY = Math.random() * (vh - rect.height - margin * 2) + margin;
    // Translate relative to current center
    setPos({
      x: targetX - (rect.left + rect.width / 2) + pos.x,
      y: targetY - (rect.top + rect.height / 2) + pos.y,
    });
    setEscapes(c => c + 1);
  };

  const handleYes = () => {
    setThanked(true);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#fbbf24'],
    });
    if (navigator.vibrate) navigator.vibrate(40);
  };

  const taunt = ESCAPE_TAUNTS[Math.min(escapes, ESCAPE_TAUNTS.length - 1)];

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08, y: -3 }}
        whileTap={{ scale: 0.94 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
        className="fixed bottom-5 right-5 z-40 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-4 py-2.5 rounded-full shadow-lg shadow-purple-500/40 text-sm flex items-center gap-2 btn-glow"
        title="Bizi değerlendirir misin?"
      >
        <span className="text-base">⭐</span>
        <span className="hidden sm:inline">Bizi Değerlendir</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              className="glass border border-purple-500/40 rounded-3xl p-7 md:p-9 max-w-md w-full text-center shadow-2xl shadow-purple-500/20 relative overflow-hidden"
            >
              {/* Close (X) */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-4 text-gray-500 hover:text-white text-xl transition-colors"
                aria-label="Kapat"
              >
                ×
              </button>

              {!thanked ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                    className="text-6xl mb-3 inline-block"
                  >
                    ⭐
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-black gradient-text mb-2">
                    Bizi Değerlendirir misin?
                  </h2>
                  <p className="text-gray-400 text-sm mb-7">
                    GameQuiz'i beğendin mi? Dürüst ol... ama çok dürüst olma.
                  </p>

                  <div className="flex items-center justify-center gap-4 mb-2">
                    <motion.button
                      onClick={handleYes}
                      whileHover={{ scale: 1.06, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black px-8 py-3 rounded-2xl shadow-lg shadow-green-500/40 text-base"
                    >
                      ✅ Evet
                    </motion.button>

                    <motion.button
                      ref={noBtnRef}
                      onMouseEnter={dodge}
                      onMouseDown={dodge}
                      onTouchStart={dodge}
                      onClick={dodge}
                      animate={{ x: pos.x, y: pos.y }}
                      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                      style={{ position: 'relative' }}
                      className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-black px-8 py-3 rounded-2xl shadow-lg shadow-red-500/40 text-base"
                    >
                      ❌ Hayır
                    </motion.button>
                  </div>

                  <div className="h-6 mt-4">
                    <AnimatePresence mode="wait">
                      {taunt && (
                        <motion.p
                          key={escapes}
                          initial={{ y: 8, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -8, opacity: 0 }}
                          className="text-pink-300 text-xs italic"
                        >
                          {taunt}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {escapes >= 5 && (
                    <p className="text-gray-600 text-[10px] mt-3">
                      ipucu: kaçma sayın → {escapes}
                    </p>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="text-7xl mb-4 inline-block"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-3xl font-black animate-rainbow mb-3">
                    Teşekkürler!
                  </h2>
                  <p className="text-gray-300 mb-2">
                    Sayende hocadan tam not alıyoruz 😎
                  </p>
                  <p className="text-purple-300 text-sm font-semibold mb-6">
                    Karma seninle olsun ✨
                  </p>
                  <button
                    onClick={() => setOpen(false)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-2.5 rounded-2xl text-sm transition-all hover:scale-105"
                  >
                    Süper, kapat
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
