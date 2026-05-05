import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MODES = [
  { id: 1, title: 'Adını Bil',       icon: '🖼️', desc: 'Oyun kapağına bakarak adını tahmin et',
    from: 'from-blue-500/20',    border: 'border-blue-500/30 hover:border-blue-400/70',    accent: 'text-blue-300' },
  { id: 2, title: 'Pixel Quiz',      icon: '🔲', desc: 'Pikselleştirilmiş görsel netleştikçe adını bul',
    from: 'from-pink-500/20',    border: 'border-pink-500/30 hover:border-pink-400/70',    accent: 'text-pink-300' },
  { id: 3, title: 'Higher or Lower', icon: '⭐', desc: 'Metacritic puanı yüksek olanı seç, seriyi koru!',
    from: 'from-yellow-500/20',  border: 'border-yellow-500/30 hover:border-yellow-400/70', accent: 'text-yellow-300' },
  { id: 4, title: 'Açıklama Quiz',   icon: '📖', desc: 'Oyunun etiketlerini okuyarak adını bul',
    from: 'from-emerald-500/20', border: 'border-emerald-500/30 hover:border-emerald-400/70', accent: 'text-emerald-300' },
  { id: 5, title: 'Geliştirici Kim?',icon: '🏢', desc: 'Oyunu geliştiren stüdyoyu seç',
    from: 'from-purple-500/20',  border: 'border-purple-500/30 hover:border-purple-400/70', accent: 'text-purple-300' },
  { id: 6, title: 'Liste Doldur',    icon: '📋', desc: 'Türün en iyi 10 oyununu sıraya dizebilir misin?',
    from: 'from-orange-500/20',  border: 'border-orange-500/30 hover:border-orange-400/70', accent: 'text-orange-300' },
];

const PARTICLES = ['🎮', '🕹️', '👾', '🏆', '⚔️', '🎯', '💎', '🔥', '🎲', '🌟', '🛡️', '🗡️', '👑', '⚡'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const cardVariants = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

export default function Home() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        icon: PARTICLES[i % PARTICLES.length],
        left: 2 + (i * 6.3) % 96,
        duration: 11 + (i * 2.7) % 13,
        delay: (i * 1.1) % 9,
        size: 0.7 + (i % 4) * 0.25,
      }))
    );
  }, []);

  return (
    <div className="min-h-screen px-6 py-12 relative overflow-hidden">
      {/* Background ambiance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute animate-particle select-none"
            style={{
              left: `${p.left}%`, bottom: '-60px',
              fontSize: `${p.size}rem`, opacity: 0,
              animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
            }}
          >
            {p.icon}
          </div>
        ))}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full animate-orb"
             style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full animate-orb"
             style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', animationDelay: '3s' }} />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] rounded-full animate-orb"
             style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', animationDelay: '6s' }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Hero */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ y: [0, -16, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block mb-5"
          >
            <span className="text-7xl md:text-8xl">🎮</span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black mb-4 leading-none">
            <span className="animate-rainbow">GameQuiz</span>
          </h1>
          <p className="text-gray-300 text-xl mb-3">
            Video oyunu bilgini test et
          </p>
          <div className="flex items-center justify-center gap-3 text-gray-600 text-xs md:text-sm flex-wrap">
            <span className="flex items-center gap-1.5"><span>🎯</span>6 farklı mod</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="flex items-center gap-1.5"><span>⚡</span>Gerçek zamanlı puan</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="flex items-center gap-1.5"><span>🏆</span>Global leaderboard</span>
          </div>
        </motion.div>

        {/* Mode cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14"
        >
          {MODES.map((mode) => (
            <motion.div key={mode.id} variants={cardVariants}>
              <Link
                to={`/quiz/${mode.id}`}
                className="block h-full"
              >
                <motion.div
                  whileHover={{ y: -6, scale: 1.025 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className={`glass bg-gradient-to-br ${mode.from} to-transparent border ${mode.border}
                              rounded-3xl p-6 h-full card-neon relative overflow-hidden group`}
                >
                  <div
                    className="absolute -top-6 -right-6 text-7xl opacity-10 group-hover:opacity-20 transition-opacity"
                    aria-hidden
                  >
                    {mode.icon}
                  </div>

                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.15 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl mb-4 inline-block relative z-10"
                  >
                    {mode.icon}
                  </motion.div>
                  <h2 className={`text-lg font-black mb-1.5 ${mode.accent} relative z-10`}>{mode.title}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed relative z-10">{mode.desc}</p>
                  <div className={`mt-5 flex items-center gap-1 text-xs font-bold ${mode.accent} opacity-70 relative z-10`}>
                    <span>Oyna</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, type: 'spring' }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block"
          >
            <Link
              to="/quiz"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-black px-12 py-4 rounded-2xl text-lg btn-glow shadow-xl shadow-purple-500/30 transition-all"
              style={{ backgroundSize: '200% 100%' }}
            >
              <span className="text-xl">🎯</span>
              <span>Hemen Oyna</span>
            </Link>
          </motion.div>
          <p className="text-gray-700 text-xs mt-4">Ücretsiz · Kayıt gerektirmez</p>
        </motion.div>
      </div>
    </div>
  );
}
