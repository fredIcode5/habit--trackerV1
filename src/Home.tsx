import React from 'react';
import './Home.css';

import { User as FirebaseUser } from "firebase/auth";

interface HomeProps {
  onNavigate: (view: "home" | "app" | "login" | "register") => void;
  firebaseUser?: FirebaseUser | null;
}

export default function Home({ onNavigate, firebaseUser }: HomeProps) {
  return (
    <div className="home-container">
      <main className="home-hero">
        <h1 className="home-title">Entretenez la Flamme de vos Habitudes</h1>
        <p className="home-description">
          Bienvenue sur DailyFlame, l'application qui vous aide à forger une routine de fer. 
          Accomplissez vos objectifs quotidiens, gagnez de l'expérience et regardez votre flamme 
          grandir de Débutant à Légendaire. Ne laissez jamais votre feu s'éteindre !
        </p>
        
        <div className="home-features">
          <div className="home-feature-card">
            <h3>📈 Suivi Quotidien</h3>
            <p>Visualisez vos habitudes du matin, de l'après-midi et du soir en un clin d'œil.</p>
          </div>
          <div className="home-feature-card">
            <h3>🔥 Système de Rangs</h3>
            <p>Maintenez votre série de réussites pour faire évoluer votre flamme vers de nouvelles couleurs épiques.</p>
          </div>
          <div className="home-feature-card">
            <h3>📊 Statistiques Avancées</h3>
            <p>Analysez votre progression avec des graphiques détaillés et restez motivé sur le long terme.</p>
          </div>
        </div>

        <div className="home-cta-group">
          {firebaseUser ? (
            <button className="home-cta-button" onClick={() => onNavigate('app')}>
              Accéder au Dashboard 🔥
            </button>
          ) : (
            <>
              <button className="home-cta-button" onClick={() => onNavigate('register')}>
                Rejoindre l'Aventure 🔥
              </button>
              <button className="home-cta-button home-cta-outline" onClick={() => onNavigate('login')}>
                Se connecter
              </button>
            </>
          )}
        </div>
      </main>

      <footer className="home-footer">
        <div className="home-footer-links">
          <a href="#" onClick={(e) => e.preventDefault()}>À propos</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Conditions d'utilisation</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Confidentialité</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Contact</a>
        </div>
        <p className="home-footer-copy">© {new Date().getFullYear()} – DailyFlame. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
