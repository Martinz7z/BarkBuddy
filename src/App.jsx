import React, { useState } from 'react';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (email, password, userType) => {
    console.log(`Login: ${email} as ${userType}`);
    setIsLoggedIn(true);
  };

  const handleRegister = (userData) => {
    console.log('Register:', userData);
    setIsLoggedIn(true);
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-card p-8 text-center max-w-md w-full shadow-card">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-primary text-2xl">🐕</span>
          </div>
          <h1 className="text-2xl font-heading font-semibold text-text mb-2">
            Successfully Logged In!
          </h1>
          <p className="text-muted mb-6">
            Bark Buddy dashboard would appear here.
          </p>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="px-6 py-3 bg-primary text-white rounded-button hover:bg-primary/90 transition-colors shadow-button"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return showRegister ? (
    <RegisterPage 
      onGoToLogin={() => setShowRegister(false)}
      onRegister={handleRegister}
    />
  ) : (
    <LoginPage 
      onGoToRegister={() => setShowRegister(true)}
      onLogin={handleLogin}
    />
  );
}

export default App;