import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function TriviaBalloon() {
  const [trivia, setTrivia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.get('/games/trivia');
      setTrivia(data);
      setOpen(true);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating balloon */}
      <motion.button
        className="fixed bottom-28 right-6 z-40 flex flex-col items-center cursor-pointer select-none"
        animate={{ x: [0, -25, 15, -40, 8, 0], y: [0, -20, 30, -35, 12, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.88 }}
        onClick={handleClick}
        title="Oyun tarihi bilgisi için tıkla!"
      >
        <motion.span
          className="text-5xl drop-shadow-xl"
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {loading ? '⏳' : '🎈'}
        </motion.span>
        <motion.span
          className="text-[10px] text-white/50 font-bold mt-0.5 tracking-wide"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          Tıkla!
        </motion.span>
      </motion.button>

      {/* Trivia modal */}
      <AnimatePresence>
        {open && trivia && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              className="relative glass border border-purple-500/30 rounded-3xl p-7 max-w-sm w-full shadow-2xl shadow-purple-500/20"
              initial={{ scale: 0.6, y: 60, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <motion.span
                  className="text-5xl inline-block"
                  animate={{ rotate: [-6, 6, -6] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  🎈
                </motion.span>
              </div>

              <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold text-center mb-2">
                Oyun Tarihi Bilgisi
              </p>

              <h2 className="text-white font-black text-lg leading-tight text-center mb-2">
                {trivia.name}
              </h2>

              <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                <span className="text-gray-500 text-xs">📅 {trivia.year}</span>
                {trivia.metacritic && (
                  <span className="text-yellow-400 text-xs">⭐ {trivia.metacritic}/100</span>
                )}
                {trivia.genre && (
                  <span className="text-gray-500 text-xs">🎮 {trivia.genre}</span>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5">
                <p className="text-gray-300 text-sm leading-relaxed text-center italic">
                  "{trivia.fact}"
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="w-full text-gray-600 hover:text-gray-400 text-xs transition-colors"
              >
                Kapat ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
