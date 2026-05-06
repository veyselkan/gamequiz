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

      {/* Trivia card */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            key="card"
            className="fixed bottom-8 right-6 z-40 w-72"
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.15 }}
          >
            <div className="glass border border-purple-500/30 rounded-2xl p-5 shadow-xl shadow-purple-500/20">
              {trivia ? (
                <>
                  <div className="flex gap-3">
                    <span className="text-2xl flex-shrink-0">🎮</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-purple-400 font-black uppercase tracking-widest mb-1">
                        Oyun Tarihi Bilgisi
                      </p>
                      <h3 className="text-white font-black text-sm leading-tight">
                        {trivia.name}
                        {trivia.year && (
                          <span className="text-gray-500 font-normal text-xs ml-1">({trivia.year})</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {trivia.metacritic && (
                          <span className="text-yellow-400 text-xs">⭐ {trivia.metacritic}/100</span>
                        )}
                        {trivia.genre && (
                          <span className="text-gray-600 text-xs">{trivia.genre}</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed mt-2 italic">
                        "{trivia.fact}"
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <motion.span
                    className="text-2xl"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⏳
                  </motion.span>
                  <p className="text-gray-400 text-sm">Bilgi yükleniyor...</p>
                </div>
              )}

              {/* Countdown bar */}
              <div className="mt-3 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
