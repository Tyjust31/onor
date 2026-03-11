<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  let pseudo = $state('');
  let password = $state('');
  let message = $state('');
  let isLoading = $state(false);

  const storage = {
    get: (key: string) => browser ? JSON.parse(localStorage.getItem(key) || 'null') : null,
    set: (key: string, val: any) => browser && localStorage.setItem(key, JSON.stringify(val))
  };

 /* onMount(() => {
    const session = storage.get('onor_session');
    if (session?.auth) goto('/protected');
  });*/

async function handleAction(type: 'login' | 'register') {
    if (!pseudo || !password) { message = "Champs requis"; return; }
    isLoading = true;
    message = '';

    await new Promise(r => setTimeout(r, 800));

    const users: any[] = storage.get('onor_users') || [];

    if (type === 'login') {
      const user = users.find(u => u.pseudo === pseudo && u.password === password);
      if (user) {
        // 1. Sauvegarde LocalStorage (pour ton UI côté client)
        storage.set('onor_session', { pseudo, auth: true, isAuthenticated: true, loginTime: new Date().toISOString() });
        
        // 2. NOUVEAU : Création du cookie pour autoriser le passage de la fonction load()
        document.cookie = `session_pseudo=${pseudo}; path=/; max-age=86400`; // Expire dans 1 jour
        
        await goto('/protected');
      } else {
        message = "Identifiants invalides";
        isLoading = false;
      }
    }

    else if (type === 'register') {
      if (password.length < 6) {
        message = "Password trop court (min 6)";
        isLoading = false;
      } else if (users.find(u => u.pseudo === pseudo)) {
        message = "Ce pseudo existe déjà";
        isLoading = false;
      } else {
        users.push({ pseudo, password });
        
        // 1. Sauvegarde LocalStorage
        storage.set('onor_users', users);
        storage.set('onor_session', { pseudo, auth: true, isAuthenticated: true, loginTime: new Date().toISOString() });
        
        // 2. NOUVEAU : Création du cookie pour la fonction load()
        document.cookie = `session_pseudo=${pseudo}; path=/; max-age=86400`;
        
        await goto('/protected');
      }
    }
  }
</script>

<div class="auth-page">
  <div class="noise-overlay"></div>
  
  <div class="main-layout">
    <section class="info-side">
      <div class="badge">v2.0 • Quantum Edition</div>
      <h1>Système de calcul <br/><span class="gradient-text">Onor Logic</span></h1>
      <p class="description">L'interface de calcul haute performance pour les ingénieurs et chercheurs du futur.</p>
      
      <div class="bento-features">
        <div class="bento-item">
          <span class="val">0.4ms</span>
          <span class="lab">Latence</span>
        </div>
        <div class="bento-item">
          <span class="val">∞</span>
          <span class="lab">Capacité</span>
        </div>
      </div>
    </section>

    <section class="form-side">
      <div class="auth-card">
        <div class="card-header">
          <div class="logo-circle">Ω</div>
          <h2>Authentification</h2>
          <p>Entrez dans le terminal sécurisé</p>
        </div>

        <div class="inputs">
          <input type="text" bind:value={pseudo} placeholder="Username" disabled={isLoading} />
          <input type="password" bind:value={password} placeholder="Password" disabled={isLoading} />
        </div>

        {#if message}
          <div class="status-msg" class:error={message.includes('invalide') || message.includes('court') || message.includes('déjà') || message.includes('requis')}>
            {message}
          </div>
        {/if}

        <div class="actions">
          <button class="primary" onclick={() => handleAction('login')} disabled={isLoading}>
            {#if isLoading}<span class="loader"></span>{:else}Se connecter{/if}
          </button>
          <button class="secondary" onclick={() => handleAction('register')} disabled={isLoading}>
            {#if isLoading}<span class="loader-secondary"></span>{:else}Créer un accès{/if}
          </button>
        </div>
      </div>
    </section>
  </div>
</div>

<style lang="scss">
  $bg: #050505;
  $card-bg: #0c0c0e;
  $text-main: #f8fafc;
  $text-secondary: #94a3b8;
  $border: #1e293b;

  :global(body) {
    background: $bg;
    color: $text-main;
    font-family: 'Inter', sans-serif;
    margin: 0;
    min-height: 100vh;
  }

  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 50% -20%, #1e293b 0%, #050505 80%);
    padding: 20px;
  }

  .main-layout {
    display: grid;
    grid-template-columns: 1fr 420px;
    width: 100%;
    max-width: 1100px;
    gap: 80px;
    z-index: 10;
  }

  .info-side {
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      background: rgba(255,255,255,0.05);
      border: 1px solid $border;
      padding: 6px 14px;
      border-radius: 100px;
      margin-bottom: 24px;
      color: $text-secondary;
    }
    h1 {
      font-size: 3.5rem;
      font-weight: 900;
      margin-bottom: 24px;
      line-height: 1.1;
      .gradient-text {
        background: linear-gradient(to right, #fff, $text-secondary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
    .description {
      color: $text-secondary;
      font-size: 1.15rem;
      line-height: 1.6;
      margin-bottom: 48px;
    }
    .bento-features {
      display: flex;
      gap: 16px;
      .bento-item {
        background: rgba(255,255,255,0.02);
        border: 1px solid $border;
        padding: 24px;
        border-radius: 20px;
        flex: 1;
        .val { display: block; font-size: 1.8rem; font-weight: 800; color: #fff; }
        .lab { font-size: 0.85rem; color: $text-secondary; text-transform: uppercase; letter-spacing: 1px; }
      }
    }
  }

  .auth-card {
    background: $card-bg;
    border: 1px solid $border;
    border-radius: 32px;
    padding: 48px;
    box-shadow: 0 50px 100px rgba(0,0,0,0.8);

    .card-header {
      text-align: center;
      margin-bottom: 32px;
      .logo-circle {
        width: 56px; height: 56px;
        border: 2px solid #fff;
        border-radius: 50%;
        margin: 0 auto 24px;
        display: grid; place-items: center;
        font-size: 1.5rem; font-weight: 800;
      }
      h2 { font-size: 1.6rem; margin-bottom: 8px; }
      p { color: $text-secondary; font-size: 0.9rem; }
    }

    .inputs {
      display: flex; flex-direction: column; gap: 16px;
      input {
        background: #000;
        border: 1px solid $border;
        padding: 16px;
        border-radius: 14px;
        color: #fff;
        font-size: 1rem;
        transition: all 0.2s;
        font-family: inherit;
        &:focus { border-color: $text-secondary; outline: none; background: #050505; }
        &::placeholder { color: #475569; }
      }
    }

    .status-msg {
      margin-top: 20px; text-align: center; font-size: 0.85rem; font-weight: 600;
      color: #00ffaa;
      &.error { color: #ff4d6d; }
    }

    .actions {
      margin-top: 32px; display: flex; flex-direction: column; gap: 12px;
      button {
        padding: 16px; border-radius: 14px; font-weight: 700; cursor: pointer;
        transition: 0.2s; border: none; display: flex; justify-content: center;
        align-items: center; font-family: inherit; font-size: 1rem;
        &.primary { background: #fff; color: #000; &:hover:not(:disabled) { background: $text-secondary; } }
        &.secondary { background: transparent; border: 1px solid $border; color: #fff; &:hover:not(:disabled) { background: $border; } }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
    }
  }

  .loader {
    width: 20px; height: 20px; border: 3px solid #000;
    border-bottom-color: transparent; border-radius: 50%;
    display: inline-block; animation: spin 0.8s linear infinite;
  }
  .loader-secondary {
    @extend .loader;
    border-color: #fff; border-bottom-color: transparent;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 1000px) {
    .main-layout { grid-template-columns: 1fr; text-align: center; gap: 40px; }
    .info-side { align-items: center; h1 { font-size: 2.8rem; } }
    .auth-page { padding: 40px 20px; align-items: flex-start; }
    .auth-card { padding: 32px 24px; }
    .info-side .bento-features { flex-direction: column; width: 100%; max-width: 400px; }
  }
</style>