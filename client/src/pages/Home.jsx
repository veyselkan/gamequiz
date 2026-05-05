import { Link } from 'react-router-dom';

const MODES = [
  {
    id: 1,
    title: 'Adını Bil',
    desc: 'Oyun kapağına bakarak adını tahmin et',
    icon: '🖼️',
    color: 'from-blue-600 to-blue-800',
  },
  {
    id: 2,
    title: 'Pixel Quiz',
    desc: 'Pikselleştirilmiş görsel netleştikçe adını bul',
    icon: '🔲',
    color: 'from-pink-600 to-pink-800',
  },
  {
    id: 3,
    title: 'Higher or Lower',
    desc: 'İki oyundan Metacritic puanı yüksek olanı seç, seriyi koru!',
    icon: '⭐',
    color: 'from-yellow-600 to-yellow-800',
  },
  {
    id: 4,
    title: 'Açıklama Quiz',
    desc: 'Oyunun açıklamasını okuyarak adını bul',
    icon: '📖',
    color: 'from-green-600 to-green-800',
  },
  {
    id: 5,
    title: 'Geliştirici Kim?',
    desc: 'Oyunu geliştiren stüdyoyu seç',
    icon: '🏢',
    color: 'from-purple-600 to-purple-800',
  },
  {
    id: 6,
    title: 'Liste Doldur',
    desc: 'Türün en iyi 10 oyununu Metacritic sırasına göre tahmin et',
    icon: '📋',
    color: 'from-orange-600 to-orange-800',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          🎮 <span className="text-purple-400">GameQuiz</span>
        </h1>
        <p className="text-gray-400 text-lg mb-12">
          Video oyunu bilgini test et, liderboard'da yerini al!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {MODES.map((mode) => (
            <Link
              key={mode.id}
              to={`/quiz/${mode.id}`}
              className={`bg-gradient-to-br ${mode.color} rounded-2xl p-6 text-left hover:scale-105 transition-transform cursor-pointer border border-white/10`}
            >
              <div className="text-4xl mb-3">{mode.icon}</div>
              <h2 className="text-xl font-bold text-white mb-1">{mode.title}</h2>
              <p className="text-white/70 text-sm">{mode.desc}</p>
            </Link>
          ))}
        </div>

        <Link
          to="/quiz"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-10 py-4 rounded-2xl text-lg transition-colors"
        >
          Hemen Oyna
        </Link>
      </div>
    </div>
  );
}
