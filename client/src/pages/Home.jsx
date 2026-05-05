import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const MODES = [
  {
    id: 1, title: 'Adını Bil', icon: '🖼️',
    desc: 'Oyun kapağına bakarak adını tahmin et',
    from: 'from-blue-500/15', border: 'border-blue-500/25 hover:border-blue-400/60',
    accent: 'text-blue-400',
  },
  {
    id: 2, title: 'Pixel Quiz', icon: '🔲',
    desc: 'Pikselleştirilmiş görsel netleştikçe adını bul',
    from: 'from-pink-500/15', border: 'border-pink-500/25 hover:border-pink-400/60',
    accent: 'text-pink-400',
  },
  {
    id: 3, title: 'Higher or Lower', icon: '⭐',
    desc: 'Metacritic puanı yüksek olanı seç, seriyi koru!',
    from: 'from-yellow-500/15', border: 'border-yellow-500/25 hover:border-yellow-400/60',
    accent: 'text-yellow-400',
  },
  {
    id: 4, title: 'Açıklama Quiz', icon: '📖',
    desc: 'Oyunun etiketlerini okuyarak adını bul',
    from: 'from-emerald-500/15', border: 'border-emerald-500/25 hover:border-emerald-400/60',
    accent: 'text-emerald-400',
  },
  {
    id: 5, title: 'Geliştirici Kim?', icon: '🏢',
    desc: 'Oyunu geliştiren stüdyoyu seç',
    from: 'from-purple-500/15', border: 'border-purple-500/25 hover:border-purple-400/60',
    accent: 'text-purple-400',
  },
  {
    id: 6, title: 'Liste Doldur', icon: '📋',
    desc: 'Türün en iyi 10 oyununu sıraya dizebilir misin?',
    from: 'from-orange-500/15', border: 'border-orange-500/25 hover:border-orange-400/60',
    accent: 'text-orange-400',
  },
];

const PARTICLES = ['🎮', '🕹️', '👾', '🏆', '⚔️', '🎯', '💎', '🔥', '🎲', '🌟', '🛡️', '🗡️'];

export default function Home() {
  const [hovered, setHovered] = useState(null);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        icon: PARTICLES[i % PARTICLES.length],
        left: 3 + (i * 7) % 94,
        duration: 10 + (i * 3.7) % 14,
        delay: (i * 1.3) % 10,
        size: 0.75 + (i % 3) * 0.25,
      }))
    );
  }, []);

  return (
    <div className="min-h-screen px-6 py-14 relative overflow-hidden">

      {/* Background ambiance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute animate-particle select-none"
            style={{
              left: `${p.left}%`,
              bottom: '-60px',
              fontSize: `${p.size}rem`,
              opacity: 0,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            {p.icon}
          </div>
        ))}
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full animate-orb"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full animate-orb"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', animationDelay: '3s' }}
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Hero */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block mb-5">
            <span className="text-7xl md:text-8xl animate-float inline-block">🎮</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-4 leading-none">
            <span className="animate-rainbow">GameQuiz</span>
          </h1>
          <p className="text-gray-400 text-xl mb-3">
            Video oyunu bilgini test et
          </p>
          <div className="flex items-center justify-center gap-4 text-gray-600 text-sm">
            <span>6 farklı mod</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>Gerçek zamanlı puan</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>Global leaderboard</span>
          </div>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {MODES.map((mode, idx) => (
            <Link
              key={mode.id}
              to={`/quiz/${mode.id}`}
              onMouseEnter={() => setHovered(mode.id)}
              onMouseLeave={() => setHovered(null)}
              className={`
                glass bg-gradient-to-br ${mode.from} to-transparent
                border ${mode.border}
                rounded-2xl p-6 text-left
                hover:scale-[1.03] transition-all duration-300
                card-neon animate-fade-in-up
              `}
              style={{ animationDelay: `${0.05 + idx * 0.07}s` }}
            >
              <div className={`text-4xl mb-4 inline-block transition-all duration-300 ${hovered === mode.id ? 'animate-dance' : ''}`}>
                {mode.icon}
              </div>
              <h2 className={`text-lg font-bold mb-1.5 ${mode.accent}`}>{mode.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{mode.desc}</p>
              <div className={`mt-5 flex items-center gap-1 text-xs font-semibold ${mode.accent} opacity-60`}>
                <span>Oyna</span>
                <span className={`transition-transform duration-300 ${hovered === mode.id ? 'translate-x-1.5' : ''}`}>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <Link
            to="/quiz"
            className="inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-500 text-white font-black px-12 py-4 rounded-2xl text-lg transition-all hover:scale-105 btn-glow animate-pulse-glow"
          >
            <span>🎯</span>
            <span>Hemen Oyna</span>
          </Link>
          <p className="text-gray-700 text-xs mt-4">Ücretsiz · Kayıt gerektirmez</p>
        </div>
      </div>
    </div>
  );
}
