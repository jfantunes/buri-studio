import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Analytics from './components/Analytics.jsx';
import PageTransition from './components/PageTransition.jsx';
import { useLenis } from './hooks/useLenis.js';

export default function App() {
  const lenisRef = useLenis();
  return (
    <div className="app">
      <Analytics />
      <Header />
      <PageTransition lenisRef={lenisRef} />
      <Footer />
    </div>
  );
}
