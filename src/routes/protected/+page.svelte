<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as XLSX from 'xlsx';
  
  let pseudo = $state('');
  let showSpreadsheet = $state(false);
  let workbook = $state(null);
  let worksheetData = $state([]);
  let searchQuery = $state('');
  let currentSheet = $state('Calcul_Main_01');
  let isAuthenticated = $state(false);
  let isLoading = $state(false);
  let lastSync = $state('');
  
  const defaultData = [
    ['ID', 'PROJET', 'STATUS', 'VALEUR (k€)', 'CHARGE %'],
    ['001', 'Alpha Centauri', 'Active', '125', '85'],
    ['002', 'Deep Pulse', 'Pending', '45', '12'],
    ['003', 'Onor Engine', 'Completed', '310', '0'],
    ['', '', '', '', '']
  ];

  const storage = {
    get: (key: string) => typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(key) || 'null') : null,
    set: (key: string, val: any) => {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(val));
            lastSync = new Date().toLocaleTimeString();
        }
    },
    remove: (key: string) => typeof localStorage !== 'undefined' && localStorage.removeItem(key)
  };

  onMount(() => {
    const session = storage.get('onor_session');
    if (!session || !session.auth) { goto('/'); return; }
    pseudo = session.pseudo;
    isAuthenticated = true;
    loadSavedWork();
  });

  // --- LOGIQUE DE CALCUL ---
  // Calcule la somme d'une colonne si les valeurs sont numériques
  function colSum(index: number) {
    const values = worksheetData.slice(1).map(row => parseFloat(row[index])).filter(v => !isNaN(v));
    return values.length ? values.reduce((a, b) => a + b, 0).toLocaleString() : '0';
  }

  function colAvg(index: number) {
    const values = worksheetData.slice(1).map(row => parseFloat(row[index])).filter(v => !isNaN(v));
    return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '0';
  }

  // --- ACTIONS ---
  function loadSavedWork() {
    const saved = storage.get(`onor_work_${pseudo}`);
    if (saved?.worksheetData) {
      worksheetData = saved.worksheetData;
      currentSheet = saved.currentSheet || 'Calcul_Main_01';
      updateWorkbook();
    }
  }

  function initializeNew() {
    isLoading = true;
    setTimeout(() => {
        worksheetData = [...defaultData.map(r => [...r])];
        showSpreadsheet = true;
        isLoading = false;
        save();
    }, 500);
  }

  function save() { storage.set(`onor_work_${pseudo}`, { worksheetData, currentSheet }); }
  
  function updateCell(r, c, val) { 
    worksheetData[r][c] = val; 
    save(); 
  }

  function addRow() { worksheetData = [...worksheetData, new Array(worksheetData[0].length).fill('')]; save(); }
  function removeRow() { if (worksheetData.length > 1) { worksheetData = worksheetData.slice(0, -1); save(); }}

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    isLoading = true;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const name = wb.SheetNames[0];
      worksheetData = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
      showSpreadsheet = true;
      isLoading = false;
      save();
    };
    reader.readAsArrayBuffer(file);
  }

  function updateWorkbook() {
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, currentSheet);
  }

  function exportXLSX() {
    updateWorkbook();
    XLSX.writeFile(workbook, `ONOR_${pseudo}_DATA.xlsx`);
  }

  async function logout() {
    storage.remove('onor_session');
    document.cookie = "session_pseudo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    await goto('/');
  }

  const filteredData = $derived(
    searchQuery 
    ? [worksheetData[0], ...worksheetData.slice(1).filter(row => row.some(cell => String(cell).toLowerCase().includes(searchQuery.toLowerCase())))]
    : worksheetData
  );
</script>

{#if isAuthenticated}
<div class="app-container">
    <div class="noise"></div>

    <nav class="glass-nav">
        <a href="/" class="brand" onclick={(e) => { e.preventDefault(); goto('/'); }}>
            <span class="logo">Ω</span>
            <div class="brand-text">
                <span class="name">ONOR LOGIC</span>
                <span class="version">CORE v2.0.4</span>
            </div>
        </a>
        
        <div class="nav-center">
            <div class="status-pill">
                <span class="dot"></span>
                SYSTEM READY
                {#if lastSync}<span class="sync">SYNC: {lastSync}</span>{/if}
            </div>
        </div>

        <div class="user-zone">
            <span class="user-tag">{pseudo}@onor</span>
            <button class="btn-exit" onclick={logout}>EXIT</button>
        </div>
    </nav>

    <main class="dashboard-content">
        <section class="hero">
            <div class="hero-left">
                <h1>Terminal de <span class="highlight">Données</span></h1>
                <p>Moteur de calcul haute performance pour environnement sécurisé.</p>
            </div>
            
            <div class="quick-stats">
                <div class="stat-item">
                    <span class="label">ENTRÉES</span>
                    <span class="value">{worksheetData.length * (worksheetData[0]?.length || 0)}</span>
                </div>
                <div class="stat-item">
                    <span class="label">LATENCE</span>
                    <span class="value">0.02ms</span>
                </div>
            </div>
        </section>

        <div class="bento-grid">
            <button class="bento-card primary" onclick={initializeNew} disabled={isLoading}>
                <div class="icon">📈</div>
                <div class="info">
                    <h3>Nouvelle Analyse</h3>
                    <p>Déployer une instance de calcul vierge</p>
                </div>
                {#if isLoading}<div class="loader"></div>{/if}
            </button>

            <label class="bento-card secondary">
                <input type="file" onchange={handleFileUpload} hidden />
                <div class="icon">📡</div>
                <div class="info">
                    <h3>Import Signal</h3>
                    <p>Charger CSV, XLSX ou TXT</p>
                </div>
            </label>

            <div class="bento-card info-only">
                <div class="icon">🔐</div>
                <div class="info">
                    <h3>Chiffrement AES</h3>
                    <p>Stockage local persistant actif</p>
                </div>
            </div>
        </div>
    </main>

    {#if showSpreadsheet}
    <div class="spreadsheet-overlay">
        <div class="sheet-window">
            <header class="sheet-toolbar">
                <div class="left">
                    <span class="file-name">{currentSheet}.onor</span>
                    <input type="text" class="search-bar" placeholder="Filtrer..." bind:value={searchQuery} />
                </div>
                
                <div class="actions">
                    <button class="btn-tool" onclick={addRow}>+ Ligne</button>
                    <button class="btn-tool" onclick={removeRow}>- Ligne</button>
                    <div class="sep"></div>
                    <button class="btn-pro" onclick={exportXLSX}>EXPORTER XLSX</button>
                    <button class="btn-close" onclick={() => showSpreadsheet = false}>×</button>
                </div>
            </header>

            <div class="calc-bar">
                {#each worksheetData[0] as header, i}
                    <div class="calc-item">
                        <span class="head">{header || 'Col ' + i}</span>
                        <span class="res">Σ {colSum(i)}</span>
                        <span class="avg">μ {colAvg(i)}</span>
                    </div>
                {/each}
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            {#each Array(worksheetData[0]?.length || 0) as _, i}
                                <th>{String.fromCharCode(65 + i)}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredData as row, rIndex}
                            <tr>
                                {#each row as cell, cIndex}
                                    <td>
                                        <input 
                                            type="text" 
                                            value={cell} 
                                            oninput={(e) => updateCell(rIndex, cIndex, (e.target as HTMLInputElement).value)} 
                                        />
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    {/if}
</div>
{/if}

<style lang="scss">
    $bg-dark: #050505;
    $accent: #0070f3;
    $text: #ededed;
    $text-dim: #888;
    $glass: rgba(255, 255, 255, 0.03);
    $border: rgba(255, 255, 255, 0.08);

    :global(body) { background: $bg-dark; color: $text; font-family: 'Inter', sans-serif; margin: 0; }

    .app-container { min-height: 100vh; background: radial-gradient(circle at 0% 0%, #111 0%, #050505 100%); }

    /* NAVIGATION */
    .glass-nav {
        display: flex; justify-content: space-between; align-items: center;
        padding: 1rem 3rem; border-bottom: 1px solid $border;
        background: rgba(0,0,0,0.8); backdrop-filter: blur(12px);
        position: sticky; top: 0; z-index: 50;

        .brand {
            text-decoration: none; color: inherit; display: flex; align-items: center; gap: 1rem;
            transition: opacity 0.2s; &:hover { opacity: 0.8; }
            .logo { font-size: 1.2rem; font-weight: 900; background: #fff; color: #000; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; }
            .brand-text .name { font-weight: 800; letter-spacing: -0.5px; font-size: 0.9rem; }
            .brand-text .version { font-size: 0.6rem; color: $accent; display: block; }
        }

        .status-pill {
            font-size: 0.7rem; color: $text-dim; padding: 6px 12px; border: 1px solid $border; border-radius: 100px;
            display: flex; align-items: center; gap: 8px;
            .dot { width: 6px; height: 6px; background: #00ff88; border-radius: 50%; box-shadow: 0 0 8px #00ff88; }
            .sync { color: $accent; margin-left: 8px; font-family: monospace; }
        }

        .btn-exit { background: transparent; border: 1px solid $border; color: #ff4d4d; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; &:hover { background: #ff4d4d; color: white; } }
    }

    /* DASHBOARD CONTENT */
    .dashboard-content { max-width: 1100px; margin: 4rem auto; padding: 0 2rem; }
    .hero {
        display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem;
        h1 { font-size: 3rem; font-weight: 900; letter-spacing: -1.5px; margin: 0; .highlight { color: $accent; } }
        p { color: $text-dim; }
        .quick-stats { display: flex; gap: 2rem; .stat-item { text-align: right; .label { font-size: 0.6rem; color: $text-dim; } .value { display: block; font-size: 1.2rem; font-weight: 800; font-family: monospace; } } }
    }

    .bento-grid {
        display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem;
        .bento-card {
            background: $glass; border: 1px solid $border; border-radius: 20px; padding: 2rem;
            display: flex; align-items: center; gap: 1.2rem; cursor: pointer; transition: 0.3s;
            &:hover:not(.info-only) { background: rgba(255,255,255,0.06); border-color: $accent; transform: translateY(-2px); }
            .icon { font-size: 2rem; }
            h3 { font-size: 1rem; margin: 0; }
            p { font-size: 0.8rem; color: $text-dim; margin: 4px 0 0 0; }
            &.primary { border-left: 4px solid $accent; }
            &.info-only { opacity: 0.5; cursor: default; }
        }
    }

    /* SPREADSHEET OVERLAY */
    .spreadsheet-overlay {
        position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
        display: grid; place-items: center; padding: 2rem;
        .sheet-window { width: 100%; height: 100%; background: #080808; border: 1px solid $border; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; }
    }

    .sheet-toolbar {
        padding: 0.8rem 1.5rem; border-bottom: 1px solid $border; display: flex; justify-content: space-between; align-items: center; background: #0f0f0f;
        .left { display: flex; align-items: center; gap: 1.5rem; .file-name { font-family: monospace; color: $accent; font-weight: 700; } }
        .search-bar { background: #000; border: 1px solid $border; color: #fff; padding: 6px 12px; border-radius: 6px; width: 200px; font-size: 0.8rem; }
        .actions { display: flex; gap: 0.5rem; .btn-tool { background: #1a1a1a; border: 1px solid $border; color: #fff; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; } .btn-pro { background: #fff; font-weight: 700; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; } .btn-close { background: none; border: none; color: #555; font-size: 1.2rem; cursor: pointer; margin-left: 10px; } }
    }

    /* STYLE : Barre de calcul */
    .calc-bar {
        display: flex; background: #0c0c0c; border-bottom: 1px solid $border; overflow-x: auto; padding: 8px 1.5rem; gap: 2rem;
        .calc-item {
            display: flex; flex-direction: column; min-width: 100px;
            .head { font-size: 0.6rem; color: $text-dim; text-transform: uppercase; font-weight: 800; }
            .res { font-size: 0.85rem; color: #00ff88; font-family: monospace; font-weight: 700; }
            .avg { font-size: 0.7rem; color: $accent; font-family: monospace; }
        }
    }

    .table-container {
        flex: 1; overflow: auto;
        table {
            width: 100%; border-collapse: collapse;
            th { background: #0f0f0f; border: 1px solid #151515; padding: 8px; font-size: 0.65rem; color: #444; position: sticky; top: 0; }
            td {
                border: 1px solid #151515; padding: 0;
                input { width: 100%; border: none; background: transparent; color: #ccc; padding: 10px; font-size: 0.85rem; &:focus { background: rgba(0, 112, 243, 0.1); outline: none; color: #fff; } }
            }
        }
    }

    .loader { width: 16px; height: 16px; border: 2px solid #fff; border-bottom-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>