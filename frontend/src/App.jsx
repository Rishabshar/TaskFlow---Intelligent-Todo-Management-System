import { BrowserRouter as Router } from 'react-router-dom';
import Layout from './Layout';
import { DarkModeProvider } from './context/DarkModeContext';
import './App.css';

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <Layout />
      </Router>
    </DarkModeProvider>
  );
}

export default App;