import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import QuizSelect from './pages/QuizSelect';
import Quiz from './pages/Quiz';
import HigherLower from './pages/HigherLower';
import ListQuiz from './pages/ListQuiz';
import Recommend from './pages/Recommend';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quiz" element={<QuizSelect />} />
          <Route path="/quiz/3" element={<HigherLower />} />
          <Route path="/quiz/6" element={<ListQuiz />} />
          <Route path="/quiz/:mode" element={<Quiz />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
