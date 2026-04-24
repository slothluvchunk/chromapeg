import { GameProvider } from './context/GameContext';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { GameOverModal } from './components/GameOverModal';

import './styles/reset.css';
import './styles/variables.css';
import './styles/app.css';
import './styles/components/header.css';
import './styles/components/peg.css';
import './styles/components/feedback.css';
import './styles/components/guess-row.css';
import './styles/components/board.css';
import './styles/components/palette.css';
import './styles/components/modal.css';

export function App() {
  return (
    <GameProvider>
      <div className="app">
        <Header />
        <Board />
        <GameOverModal />
      </div>
    </GameProvider>
  );
}
