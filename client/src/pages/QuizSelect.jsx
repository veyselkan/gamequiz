import { Link } from 'react-router-dom';

const MODES = [
  { id: 1, title: 'Adını Bil', desc: 'Oyun kapağından adını seç', icon: '🖼️', color: 'border-blue-500 hover:bg-blue-900/30' },
  { id: 2, title: 'Pixel Quiz', desc: 'Pikselleştirilmiş görsel netleşir', icon: '🔲', color: 'border-pink-500 hover:bg-pink-900/30' },
  { id: 3, title: 'Higher or Lower', desc: 'Hangi oyunun puanı daha yüksek?', icon: '⭐', color: 'border-yellow-500 hover:bg-yellow-900/30' },
  { id: 4, title: 'Açıklama Quiz', desc: 'Açıklamadan oyunu bul', icon: '📖', color: 'border-green-500 hover:bg-green-900/30' },
  { id: 5, title: 'Geliştirici Kim?', desc: 'Hangi stüdyo yaptı?', icon: '🏢', color: 'border-purple-500 hover:bg-purple-900/30' },
  { id: 6, title: 'Liste Doldur', desc: 'Türün en iyi 10 oyununu tahmin et', icon: '📋', color: 'border-orange-500 hover:bg-orange-900/30' },
];

export default function QuizSelect() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-2">Quiz Seç</h1>
        <p className="text-gray-400 text-center mb-10">Hangi modda oynamak istiyorsun?</p>

        <div className="flex flex-col gap-4">
          {MODES.map((mode) => (
            <Link
              key={mode.id}
              to={`/quiz/${mode.id}`}
              className={`flex items-center gap-5 bg-gray-900 border ${mode.color} rounded-2xl p-5 transition-all`}
            >
              <span className="text-4xl">{mode.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{mode.title}</h2>
                <p className="text-gray-400 text-sm">{mode.desc}</p>
              </div>
              <span className="ml-auto text-gray-500 text-2xl">›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
