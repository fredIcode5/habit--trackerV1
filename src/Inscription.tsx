import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import './Auth.css';

interface InscriptionProps {
  onNavigate: (view: 'home' | 'app' | 'login' | 'register') => void;
}

export default function Inscription({ onNavigate }: InscriptionProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cgu, setCgu] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength calculation
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { w: '0%',   bg: 'transparent', label: '' },
    { w: '25%',  bg: '#ff4444',     label: '⚠ Très faible' },
    { w: '50%',  bg: '#ff8c00',     label: '🔶 Faible' },
    { w: '75%',  bg: '#ffcc00',     label: '🔥 Moyen' },
    { w: '100%', bg: '#6fcf6f',     label: '✅ Fort' },
  ];

  const strength = password.length === 0 ? levels[0] : (levels[score] || levels[1]);

  function getFirebaseErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Cette adresse e-mail est déjà utilisée par un autre compte.';
      case 'auth/invalid-email':
        return 'L\'adresse e-mail n\'est pas valide.';
      case 'auth/weak-password':
        return 'Le mot de passe est trop faible. Utilisez au moins 6 caractères.';
      case 'auth/network-request-failed':
        return 'Erreur réseau. Vérifiez votre connexion internet.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Veuillez réessayer plus tard.';
      default:
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation locale
    if (username.trim().length < 3) {
      setError('Le nom d\'utilisateur doit contenir au moins 3 caractères.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Veuillez entrer une adresse e-mail valide (ex: nom@domaine.com).');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Le mot de passe doit contenir au moins 1 majuscule et 1 chiffre.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!cgu) {
      setError('Vous devez accepter les CGU pour continuer.');
      return;
    }

    setLoading(true);

    try {
      // 1. Créer le compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Mettre à jour le profil avec le nom d'utilisateur
      await updateProfile(user, { displayName: username.trim() });

      // 3. Sauvegarder les infos dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: username.trim(),
        email: email.trim(),
        xpTotal: 0,
        createdAt: serverTimestamp(),
        lastActive: new Date().toISOString().slice(0, 10),
      });

      setLoading(false);
      setSuccess('🎉 Inscription réussie ! Bienvenue dans l\'aventure.');
      
      // Rediriger vers le dashboard après 1.5s
      setTimeout(() => onNavigate('app'), 1500);

    } catch (err: any) {
      setLoading(false);
      setError(getFirebaseErrorMessage(err.code));
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">
          <h1>🔥 Inscription</h1>

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                type="text"
                id="username"
                placeholder="EmberHero42"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                required
                minLength={3}
              />
            </div>

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
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                minLength={8}
              />
              <div className="auth-strength-bar-wrap">
                <div 
                  className="auth-strength-bar" 
                  style={{ width: strength.w, backgroundColor: strength.bg }}
                ></div>
              </div>
              <div className="auth-strength-label">{strength.label}</div>
              <div className="auth-input-hint">Minimum 8 caractères, 1 majuscule et 1 chiffre.</div>
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirm_password">Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirm_password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                className={error.includes('correspondent pas') ? 'input-error' : ''}
                required
              />
            </div>

            <div className="auth-cgu-group">
              <input 
                type="checkbox" 
                id="cgu" 
                checked={cgu}
                onChange={(e) => { setCgu(e.target.checked); setError(''); }}
                required 
              />
              <label htmlFor="cgu">
                J'accepte les <a href="#">Conditions Générales d'Utilisation</a> et la <a href="#">Politique de confidentialité</a>.
              </label>
            </div>

            <button
              type="submit"
              className={`auth-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Inscription en cours…' : 'Allumer la flamme 🔥'}
            </button>

            {error && <p className="auth-msg error">{error}</p>}
            {success && <p className="auth-msg success">{success}</p>}
          </form>

          <div className="auth-separator">ou s'inscrire avec</div>

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
            Déjà un compte ? <a onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>Se connecter</a>
          </p>
        </div>
      </main>
    </div>
  );
}
