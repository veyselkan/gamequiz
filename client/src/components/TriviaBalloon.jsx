import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import api from '../services/api';

export default function TriviaBalloon() {
  const [visible, setVisible] = useState(true);
  const [showCard, setShowCard] = useState(false);
  const [trivia, setTrivia] = useState(null);
  const controls = useAnimationControls();
  const cancelRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    cancelRef.current = false;

    const wander = async () => {
      controls.set({ x: window.innerWidth - 100, y: window.innerHeight - 180 });
      while (!cancelRef.current) {
        const x = 40 + Math.random() * (window.innerWidth - 110);
        const y = 60 + Math.random() * (window.innerHeight - 160);
        const dur = 0.6 + Math.random() * 1.2;
        await controls.start({ x, y, transition: { duration: dur, ease: 'easeInOut' } });
        if (cancelRef.current) break;
        await new Promise(r => setTimeout(r, 80 + Math.random() * 200));
      }
    };

    wander();
    return () => { cancelRef.current = true; };
  }, [visible, controls]);

  const handleClick = async () => {
    if (!visible) return;
    cancelRef.current = true;
    setVisible(false);
    setShowCard(true);
    setTrivia(null);

    try {
      const { data } = await api.get('/games/trivia');
      setTrivia(data);
    } catch {
      setTrivia({ name: 'GameQuiz', year: '', metacritic: null, genre: '', fact: 'Bilgi yüklenemedi, tekrar dene.' });
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowCard(false);
      setTrivia(null);
      setTimeout(() => setVisible(true), 400);
    }, 10000);
  };

  return (
    <>
      {/* Balloon */}
      <AnimatePresence>
        {visible && (
          <motion.button
            key="balloon"
            className="fixed z-40 cursor-pointer select-none flex flex-col items-center"
            style={{ left: 0, top: 0 }}
            animate={controls}
            exit={{ scale: 4, opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleClick}
          >
            <motion.span
              className="text-5xl drop-shadow-xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              🎈
            </motion.span>
            <motion.span
              className="text-[10px] text-white/50 font-bold"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              Tıkla!
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Trivia modal */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

            {/* Card */}
            <motion.div
              key="card"
              className="relative glass border border-purple-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/20"
              initial={{ scale: 0.6, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.1 }}
            >
              {trivia ? (
                <>
                  <div className="text-center mb-5">
                    <motion.span
                      className="text-5xl inline-block"
                      animate={{ rotate: [-6, 6, -6] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      🎈
                    </motion.span>
                  </div>

                  <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest text-center mb-3">
                    Oyun Tarihi Bilgisi
                  </p>

                  <h2 className="text-white font-black text-2xl text-center leading-tight mb-1">
                    {trivia.name}
                  </h2>

                  <div className="flex items-center justify-center gap-4 mb-5 flex-wrap">
                    {trivia.year && (
                      <span className="text-gray-500 text-sm">📅 {trivia.year}</span>
                    )}
                    {trivia.metacritic && (
                      <span className="text-yellow-400 text-sm font-bold">⭐ {trivia.metacritic}/100</span>
                    )}
                    {trivia.genre && (
                      <span className="text-gray-500 text-sm">🎮 {trivia.genre}</span>
                    )}
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
                    <p className="text-gray-200 text-sm leading-relaxed text-center italic">
                      "{trivia.fact}"
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <motion.span
                    className="text-4xl"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  >
                    ⏳
                  </motion.span>
                  <p className="text-gray-400 text-sm">Bilgi yükleniyor...</p>
                </div>
              )}

              {/* Countdown bar */}
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                />
              </div>
              <p className="text-gray-700 text-xs text-center mt-2">10 saniye sonra kaybolur</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
