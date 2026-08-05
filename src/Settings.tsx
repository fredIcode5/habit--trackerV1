import React, { useState } from 'react';
import './Settings.css';

export default function Settings() {
  const [username, setUsername] = useState('EmberHero42');
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save
    alert("Paramètres sauvegardés (simulation)");
  };

  return (
    <main className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">⚙️ Paramètres du compte</h1>
        
        <div className="settings-content">
          <section className="settings-section profile-section">
            <div className="profile-picture-container">
              <div className="profile-picture">🔥</div>
              <button className="change-picture-btn">Changer la photo</button>
            </div>
            
            <form className="settings-form" onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="username">Pseudo</label>
                <input 
                  type="text" 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Adresse E-mail</label>
                <input 
                  type="email" 
                  id="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
              
              <h3 className="section-subtitle">Changer le mot de passe</h3>
              
              <div className="form-group">
                <label htmlFor="password">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  id="password" 
                  placeholder="Laisser vide pour ne pas changer"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  placeholder="Confirmer"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
              </div>
              
              <div className="settings-actions">
                <button type="button" className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer les modifications</button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
