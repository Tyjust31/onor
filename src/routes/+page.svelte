<script lang="ts">
  let pseudo = $state('');
  let password = $state('');
  let message = $state('');
  let isLoading = $state(false);
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  // Fonction pour gérer le localStorage de manière sécurisée
  function setLocalStorage(key: string, value: any) {
    if (!browser) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Erreur localStorage:', e);
    }
  }

  function getLocalStorage(key: string): any {
    if (!browser) return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Erreur lecture localStorage:', e);
      return null;
    }
  }

  function removeLocalStorage(key: string) {
    if (!browser) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Erreur suppression localStorage:', e);
    }
  }

  // Charger les utilisateurs depuis localStorage au démarrage
  let users: Array<{pseudo: string, password: string, createdAt: string}> = [];
  
  $effect(() => {
    if (browser) {
      const savedUsers = getLocalStorage('onor_users');
      if (savedUsers && Array.isArray(savedUsers)) {
        users = savedUsers;
      }

      // Vérifier si l'utilisateur est déjà connecté
      const session = getLocalStorage('onor_session');
      if (session && session.pseudo) {
        message = `Vous êtes déjà connecté en tant que ${session.pseudo}.`;
        // Optionnel: redirection automatique après 2 secondes
        setTimeout(() => {
          safeRedirect('/protected');
        }, 2000);
      }
    }
  });

  // Sauvegarder les utilisateurs dans localStorage
  function saveUsersToStorage() {
    setLocalStorage('onor_users', users);
  }

  // Fonction de redirection sécurisée
  async function safeRedirect(path: string) {
    if (!browser) return false;
    
    try {
      await goto(path, { replaceState: true });
      return true;
    } catch (error) {
      console.warn('Erreur avec goto, essai avec window.location:', error);
      
      try {
        window.location.href = path;
        return true;
      } catch (locationError) {
        console.error('Erreur de redirection complète:', locationError);
        return false;
      }
    }
  }

  function handleLogin() {
    if (!pseudo || !password) {
      message = 'Veuillez remplir tous les champs';
      return;
    }

    isLoading = true;
    message = '';

    // Simuler un délai de connexion
    setTimeout(async () => {
      // Vérifier si l'utilisateur existe
      const user = users.find((u) => u.pseudo === pseudo && u.password === password);
      
      if (user) {
        // Connexion réussie - créer la session
        const sessionData = {
          pseudo: pseudo,
          loginTime: new Date().toISOString(),
          isAuthenticated: true
        };
        
        setLocalStorage('onor_session', sessionData);
        
        message = 'Connexion réussie !';
        
        // Redirection vers la page protégée
        setTimeout(async () => {
          const redirectSuccess = await safeRedirect('/protected');
          
          if (!redirectSuccess) {
            message = 'Connexion réussie ! Veuillez naviguer manuellement vers la page protégée.';
          }
        }, 1500);
      } else {
        message = 'Nom d\'utilisateur ou mot de passe incorrect';
      }
      
      isLoading = false;
    }, 1000);
  }

  function handleRegister() {
    if (!pseudo || !password) {
      message = 'Veuillez remplir tous les champs';
      return;
    }

    if (password.length < 6) {
      message = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    isLoading = true;
    message = '';

    // Simuler un délai d'inscription
    setTimeout(() => {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = users.find((u) => u.pseudo === pseudo);
      
      if (existingUser) {
        message = 'Ce nom d\'utilisateur existe déjà';
      } else {
        // Ajouter le nouvel utilisateur
        const newUser = {
          pseudo: pseudo,
          password: password,
          createdAt: new Date().toISOString()
        };
        
        users = [...users, newUser];
        
        // Sauvegarder dans localStorage
        saveUsersToStorage();
        
        message = 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.';
        
        // Vider les champs
        pseudo = '';
        password = '';
      }
      
      isLoading = false;
    }, 1000);
  }

  // Fonction pour se déconnecter (utile pour les tests)
  function handleLogout() {
    removeLocalStorage('onor_session');
    message = 'Déconnexion réussie';
    
    if (browser) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  // Fonction pour effacer tous les utilisateurs (pour les tests)
  function clearAllUsers() {
    if (confirm('Êtes-vous sûr de vouloir supprimer tous les utilisateurs et données ?')) {
      users = [];
      removeLocalStorage('onor_users');
      removeLocalStorage('onor_session');
      
      // Supprimer aussi toutes les données de travail sauvegardées
      if (browser) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('onor_work_')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      message = 'Tous les utilisateurs et données ont été supprimés';
    }
  }

  // Fonction pour tester la navigation manuellement
  function testNavigation() {
    message = 'Test de navigation...';
    setTimeout(async () => {
      const success = await safeRedirect('/protected');
      if (!success) {
        message = 'Erreur de navigation. Vérifiez que la route /protected existe.';
      }
    }, 500);
  }
</script>

<div class="hero">
  <!-- Animated Background -->
  <div class="bg-animation">
    <div class="floating-orb orb-1"></div>
    <div class="floating-orb orb-2"></div>
    <div class="floating-orb orb-3"></div>
    <div class="mesh-gradient"></div>
  </div>

  <!-- Hero Content Container -->
  <div class="hero-container">
    
    <!-- Left Side - Hero Text -->
    <div class="hero-text">
      <div class="logo-section">
        <div class="logo">
          <div class="logo-symbol">Ω</div>
          <div class="logo-pulse"></div>
        </div>
        <div class="brand-info">
          <div class="brand-name">Onor Calcul</div>
          <div class="brand-subtitle">Advanced Computing</div>
        </div>
      </div>
      
      <div class="title-section">
        <h1 class="main-title">
          <span class="title-word">Révolutionnez</span>
          <span class="title-word accent">vos calculs</span>
          <span class="title-word">avancés</span>
        </h1>
        <div class="title-underline"></div>
      </div>
      
      <h2 class="sub-title">
        La puissance du calcul scientifique <br/>
        <span class="highlight">redéfinie par l'IA</span>
      </h2>
      
      <p class="description">
        Explorez une nouvelle dimension du calcul avec notre plateforme intelligente. 
        Conçue pour les visionnaires qui repoussent les limites de la science et de l'innovation.
      </p>
      
      <div class="features-container">
        <div class="feature-item">
          <div class="feature-icon">⚡</div>
          <span>Calculs instantanés</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🚀</div>
          <span>Performance quantique</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔮</div>
          <span>IA intégrée</span>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat">
          <div class="stat-number">99.9%</div>
          <div class="stat-label">Précision</div>
        </div>
        <div class="stat">
          <div class="stat-number">10M+</div>
          <div class="stat-label">Calculs/sec</div>
        </div>
        <div class="stat">
          <div class="stat-number">24/7</div>
          <div class="stat-label">Disponibilité</div>
        </div>
      </div>
    </div>

    <!-- Right Side - Login Form -->
    <div class="form-container">
      <div class="form-glow"></div>
      
      <div class="form-header">
        <div class="form-icon">
          <div class="icon-circle">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
        <h3 class="form-title">Accès Sécurisé</h3>
        <p class="form-subtitle">Entrez dans l'écosystème Onor</p>
      </div>
      
      <div class="form-content">
        <div class="input-container">
          <div class="input-wrapper">
            <input 
              type="text" 
              bind:value={pseudo} 
              placeholder="Nom d'utilisateur" 
              autocomplete="username"
              class="form-input"
              disabled={isLoading}
            />
            <div class="input-highlight"></div>
          </div>
        </div>

        <div class="input-container">
          <div class="input-wrapper">
            <input 
              type="password" 
              bind:value={password} 
              placeholder="Mot de passe" 
              autocomplete="current-password"
              class="form-input"
              disabled={isLoading}
            />
            <div class="input-highlight"></div>
          </div>
        </div>

        <div class="form-actions">
          <button 
            class="btn-primary" 
            onclick={handleLogin}
            disabled={isLoading}
          >
            {#if isLoading}
              <div class="loading-spinner"></div>
              <span class="btn-text">Connexion...</span>
            {:else}
              <span class="btn-text">Se connecter</span>
            {/if}
            <div class="btn-glow"></div>
          </button>
          
          <div class="divider">
            <span>ou</span>
          </div>
          
          <button 
            class="btn-secondary enhanced" 
            onclick={handleRegister}
            disabled={isLoading}
          >
            {#if isLoading}
              <div class="loading-spinner secondary"></div>
              <span class="btn-text">Création...</span>
            {:else}
              <span class="btn-text">✨ Créer un compte</span>
              <div class="btn-icon">→</div>
            {/if}
          </button>
        </div>

        {#if message}
          <div class="message-container">
            <div class="message {message.includes('succès') || message.includes('Connexion réussie') || message.includes('déjà connecté') ? 'success' : 'error'}">{message}</div>
          </div>
        {/if}

        {#if users.length > 0}
          <div class="debug-info">
            <small>Utilisateurs enregistrés: {users.length}</small>
          </div>
        {/if}

        <!-- Debug/Test buttons (remove in production)
        <div class="debug-actions">
          <button class="debug-btn" onclick={handleLogout}>🔓 Déconnexion</button>
          <button class="debug-btn" onclick={clearAllUsers}>🗑️ Effacer tout</button>
          <button class="debug-btn" onclick={testNavigation}>🧪 Test Navigation</button>
        </div> -->
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-content">
      <div class="copyright">© 2025 Onor Calcul - Tous droits réservés</div>
      <div class="version">v1.0.0 • Quantum Edition</div>
    </div>
  </div>
</div>

<style lang="scss">
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .hero {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    min-height: 100vh;
    background: 
      radial-gradient(ellipse at top, #1e1b4b 0%, #0f0f23 50%, #000 100%);
    position: relative;
    overflow: hidden;
    color: white;

    .bg-animation {
      position: absolute;
      inset: 0;
      z-index: 0;

      .floating-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(40px);
        animation: float 20s ease-in-out infinite;

        &.orb-1 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        &.orb-2 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%);
          top: 60%;
          right: 20%;
          animation-delay: -7s;
        }

        &.orb-3 {
          width: 150px;
          height: 150px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
          bottom: 20%;
          left: 30%;
          animation-delay: -14s;
        }
      }

      .mesh-gradient {
        position: absolute;
        inset: 0;
        background: 
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
        animation: meshMove 15s ease-in-out infinite;
      }
    }

    .hero-container {
      display: grid;
      grid-template-columns: 1.2fr 500px;
      gap: 6rem;
      align-items: center;
      min-height: 100vh;
      padding: 2rem 5rem;
      position: relative;
      z-index: 1;
    }

    .hero-text {
      .logo-section {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 3rem;

        .logo {
          position: relative;
          width: 80px;
          height: 80px;

          .logo-symbol {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 900;
            color: white;
            position: relative;
            z-index: 2;
            box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
          }

          .logo-pulse {
            position: absolute;
            inset: -10px;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            border-radius: 25px;
            opacity: 0.3;
            animation: pulse 2s ease-in-out infinite;
          }
        }

        .brand-info {
          .brand-name {
            font-size: 2.2rem;
            font-weight: 800;
            background: linear-gradient(135deg, #ffffff, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
          }

          .brand-subtitle {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
        }
      }

      .title-section {
        margin-bottom: 2rem;
        position: relative;

        .main-title {
          font-size: 4.5rem;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.04em;
          margin-bottom: 1rem;

          .title-word {
            display: inline-block;
            background: linear-gradient(135deg, #ffffff, #e2e8f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-right: 0.3em;

            &.accent {
              background: linear-gradient(135deg, #8b5cf6, #3b82f6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              position: relative;
              
              &::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                border-radius: 2px;
                opacity: 0.7;
              }
            }
          }
        }
      }

      .sub-title {
        font-size: 1.5rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 1.5rem;
        line-height: 1.4;

        .highlight {
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 600;
        }
      }

      .description {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.7;
        margin-bottom: 3rem;
        max-width: 500px;
      }

      .features-container {
        display: flex;
        gap: 2rem;
        margin-bottom: 3rem;

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(139, 92, 246, 0.3);
            transform: translateY(-2px);
          }

          .feature-icon {
            font-size: 1.2rem;
          }

          span {
            font-size: 0.9rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
          }
        }
      }

      .stats-row {
        display: flex;
        gap: 3rem;

        .stat {
          text-align: center;

          .stat-number {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
          }

          .stat-label {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
        }
      }
    }

    .form-container {
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      overflow: hidden;
      transition: all 0.4s ease;

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 40px 80px rgba(139, 92, 246, 0.2);
        border-color: rgba(139, 92, 246, 0.3);
      }

      .form-glow {
        position: absolute;
        inset: -2px;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
        border-radius: 24px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover .form-glow {
        opacity: 1;
      }

      .form-header {
        text-align: center;
        padding: 3rem 2.5rem 2rem;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        .form-icon {
          margin-bottom: 1.5rem;

          .icon-circle {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);

            svg {
              width: 24px;
              height: 24px;
              color: white;
            }
          }
        }

        .form-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: white;
        }

        .form-subtitle {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
        }
      }

      .form-content {
        padding: 2.5rem;

        .input-container {
          margin-bottom: 1.5rem;

          .input-wrapper {
            position: relative;

            .form-input {
              width: 100%;
              padding: 1.2rem 1.5rem;
              background: rgba(255, 255, 255, 0.08);
              border: 1px solid rgba(255, 255, 255, 0.15);
              border-radius: 16px;
              font-size: 1rem;
              color: white;
              outline: none;
              transition: all 0.3s ease;
              backdrop-filter: blur(10px);

              &::placeholder {
                color: rgba(255, 255, 255, 0.5);
              }

              &:focus {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(139, 92, 246, 0.5);
                box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                transform: translateY(-2px);
              }

              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            }

            .input-highlight {
              position: absolute;
              bottom: 0;
              left: 50%;
              width: 0;
              height: 2px;
              background: linear-gradient(135deg, #8b5cf6, #3b82f6);
              transition: all 0.3s ease;
              transform: translateX(-50%);
            }

            .form-input:focus + .input-highlight {
              width: 100%;
            }
          }
        }

        .form-actions {
          margin-top: 2.5rem;

          .btn-primary {
            width: 100%;
            position: relative;
            padding: 1.2rem 1.5rem;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            border: none;
            border-radius: 16px;
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            overflow: hidden;
            transition: all 0.3s ease;
            margin-bottom: 1.5rem;
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;

            &:hover:not(:disabled) {
              transform: translateY(-3px);
              box-shadow: 0 20px 40px rgba(139, 92, 246, 0.4);
            }

            &:disabled {
              opacity: 0.7;
              cursor: not-allowed;
              transform: none;
            }

            .btn-glow {
              position: absolute;
              inset: 0;
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
              opacity: 0;
              transition: opacity 0.3s ease;
            }

            &:hover:not(:disabled) .btn-glow {
              opacity: 1;
            }
          }

          .divider {
            text-align: center;
            margin: 1.5rem 0;
            position: relative;

            &::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 0;
              right: 0;
              height: 1px;
              background: rgba(255, 255, 255, 0.1);
            }

            span {
              background: rgba(15, 15, 35, 0.9);
              padding: 0 1rem;
              color: rgba(255, 255, 255, 0.5);
              font-size: 0.85rem;
              position: relative;
            }
          }

          .btn-secondary {
            width: 100%;
            padding: 1.2rem 1.5rem;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            position: relative;
            overflow: hidden;

            &.enhanced {
              background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1));
              border-color: rgba(16, 185, 129, 0.3);
              color: rgba(16, 185, 129, 0.9);
              font-weight: 600;

              .btn-icon {
                background: linear-gradient(135deg, #10b981, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-size: 1.2rem;
                font-weight: 700;
                transition: transform 0.3s ease;
              }

              &:hover:not(:disabled) {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2));
                border-color: rgba(16, 185, 129, 0.5);
                color: rgba(16, 185, 129, 1);
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);

                .btn-icon {
                  transform: translateX(4px);
                }
              }
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
              transform: none;
            }
          }
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;

          &.secondary {
            border-top-color: #10b981;
          }
        }

        .message-container {
          margin-top: 1.5rem;
          animation: slideIn 0.3s ease;

          .message {
            padding: 1rem 1.5rem;
            border-radius: 12px;
            font-size: 0.9rem;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid;

            &.error {
              background: rgba(239, 68, 68, 0.1);
              border-color: rgba(239, 68, 68, 0.3);
              color: #fca5a5;
            }

            &.success {
              background: rgba(16, 185, 129, 0.1);
              border-color: rgba(16, 185, 129, 0.3);
              color: #6ee7b7;
            }
          }
        }

        .debug-info {
          margin-top: 1rem;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.75rem;
        }
      }
    }

    .footer {
      position: absolute;
      bottom: 2rem;
      left: 5rem;
      right: 5rem;
      z-index: 1;

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.85rem;

        .copyright {
          font-weight: 400;
        }

        .version {
          font-weight: 500;
          color: rgba(139, 92, 246, 0.6);
        }
      }
    }
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(30px, -30px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.1); opacity: 0.6; }
  }

  @keyframes meshMove {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.1) rotate(2deg); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 1200px) {
    .hero .hero-container {
      grid-template-columns: 1fr 450px;
      gap: 4rem;
      padding: 2rem 3rem;
    }

    .hero .hero-text .title-section .main-title {
      font-size: 3.5rem;
    }
  }

  @media (max-width: 968px) {
    .hero .hero-container {
      grid-template-columns: 1fr;
      gap: 4rem;
      padding: 2rem;
      text-align: center;
    }

    .hero .form-container {
      max-width: 450px;
      margin: 0 auto;
    }

    .hero .hero-text .features-container {
      justify-content: center;
      flex-wrap: wrap;
    }

    .hero .hero-text .stats-row {
      justify-content: center;
    }

    .hero .footer {
      position: relative;
      left: auto;
      right: auto;
      margin-top: 3rem;
      text-align: center;
    }
    .hero .footer {
      position: relative;
      left: auto;
      right: auto;
      margin-top: 3rem;
      text-align: center;
    }

    .hero .footer .footer-content {
      flex-direction: column;
      gap: 0.5rem;
    }
  }

  @media (max-width: 768px) {
    .hero .hero-container {
      padding: 1.5rem;
    }

    .hero .hero-text .title-section .main-title {
      font-size: 2.8rem;
    }

    .hero .hero-text .sub-title {
      font-size: 1.3rem;
    }

    .hero .hero-text .features-container .feature-item {
      padding: 0.8rem 1.2rem;
    }

    .hero .form-container .form-content {
      padding: 2rem 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .hero .hero-text .logo-section {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }

    .hero .hero-text .title-section .main-title {
      font-size: 2.2rem;
    }

    .hero .hero-text .features-container {
      flex-direction: column;
      align-items: center;
    }

    .hero .hero-text .stats-row {
      gap: 2rem;
    }

    .hero .form-container .form-content {
      padding: 1.5rem 1rem;
    }
  }
</style>