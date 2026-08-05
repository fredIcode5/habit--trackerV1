import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import './Auth.css';

interface ConnexionProps {
  onNavigate: (view: 'home' | 'app' | 'login' | 'register') => void;
}

export default function Connexion({ onNavigate }: ConnexionProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function getFirebaseErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cette adresse e-mail.';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect.';
      case 'auth/invalid-email':
        return 'L\'adresse e-mail n\'est pas valide.';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives échouées. Veuillez réessayer plus tard.';
      case 'auth/network-request-failed':
        return 'Erreur réseau. Vérifiez votre connexion internet.';
      case 'auth/invalid-credential':
        return 'E-mail ou mot de passe incorrect.';
      default:
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Veuillez entrer votre adresse e-mail.');
      return;
    }
    if (!password) {
      setError('Veuillez entrer votre mot de passe.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setLoading(false);
      setSuccess('✅ Connexion réussie ! Redirection en cours...');
      setTimeout(() => onNavigate('app'), 1000);
    } catch (err: any) {
      setLoading(false);
      setError(getFirebaseErrorMessage(err.code));
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">
          <h1>🔥 Connexion</h1>

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-form-group">
              <label htmlFor="email">Adresse e-mail</label>
              <input
                type="email"
                id="email"
                placeholder="exemple@feu.com"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password">Mot de passe</label>
              <div className="auth-password-row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Afficher le mot de passe"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              <a href="#" className="auth-forgot-link">Mot de passe oublié ?</a>
            </div>

            <div className="auth-remember-group">
              <input type="checkbox" id="remember" name="remember" />
              <label htmlFor="remember">Se souvenir de moi</label>
            </div>

            <button
              type="submit"
              className={`auth-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Connexion en cours…' : 'Raviver la flamme 🔥'}
            </button>

            {error && <p className="auth-msg error">{error}</p>}
            {success && <p className="auth-msg success">{success}</p>}
          </form>

          <div className="auth-separator">ou se connecter avec</div>

          <div className="auth-social-auth">
            <button className="auth-btn-social auth-btn-google" type="button">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="" />
              Continuer avec Google
            </button>
            <button className="auth-btn-social auth-btn-facebook" type="button">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" width="18" alt="" />
              Continuer avec Facebook
            </button>
          </div>

          <p className="auth-account-link">
            Pas encore de compte ? <a onClick={(e) => { e.preventDefault(); onNavigate('register'); }}>S'inscrire</a>
          </p>
        </div>
      </main>
    </div>
  );
}
