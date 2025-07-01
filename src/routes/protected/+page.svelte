<script lang="ts">
  import { onMount } from 'svelte';
  import * as XLSX from 'xlsx';
  
  let pseudo = $state('');
  let showSpreadsheet = $state(false);
  let workbook = $state(null);
  let worksheetData = $state([]);
  let currentSheet = $state('Feuille1');
  let fileInput;
  let isAuthenticated = $state(false);
  let sessionInfo = $state(null);
  
  // Données d'exemple
  const defaultData = [
    ['Nom', 'Prénom', 'Age', 'Ville', 'Salaire'],
    ['Dupont', 'Jean', 25, 'Paris', 35000],
    ['Martin', 'Marie', 30, 'Lyon', 42000],
    ['Durand', 'Pierre', 28, 'Marseille', 38000],
    ['', '', '', '', '']  // Ligne vide pour permettre l'édition
  ];
  
  // Fonctions utilitaires pour localStorage
  function getLocalStorage(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Erreur lecture localStorage:', e);
      return null;
    }
  }

  function setLocalStorage(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Erreur écriture localStorage:', e);
    }
  }

  function removeLocalStorage(key: string) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Erreur suppression localStorage:', e);
    }
  }
  
  // Vérifier l'authentification au montage du composant
  onMount(() => {
    checkAuthentication();
  });
  
  function checkAuthentication() {
    const session = getLocalStorage('onor_session');
    
    if (!session || !session.pseudo || !session.isAuthenticated) {
      // Rediriger vers la page de connexion si pas de session valide
      console.log('Session invalide, redirection vers la page de connexion');
      window.location.href = '/';
      return;
    }
    
    try {
      pseudo = session.pseudo;
      sessionInfo = session;
      isAuthenticated = true;
      
      // Vérifier si la session n'est pas trop ancienne (optionnel)
      const loginTime = new Date(session.loginTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      // Session expire après 24 heures (optionnel)
      if (hoursDiff > 24) {
        console.log('Session expirée');
        logout();
        return;
      }
      
      console.log(`Utilisateur authentifié: ${pseudo}`);
      
      // Charger automatiquement les données sauvegardées s'il y en a
      loadSavedWork();
      
    } catch (error) {
      console.error('Erreur lors de la lecture de la session:', error);
      logout();
    }
  }
  
  function logout() {
    // Sauvegarder les données de travail avant de se déconnecter
    if (workbook && pseudo) {
      saveWorkToLocal();
    }
    
    // Supprimer la session du localStorage
    removeLocalStorage('onor_session');
    
    // Rediriger vers la page de connexion
    window.location.href = '/';
  }
  
  function loadSavedWork() {
    const savedWork = getLocalStorage(`onor_work_${pseudo}`);
    
    if (savedWork) {
      try {
        console.log('Données sauvegardées trouvées pour', pseudo);
        // Charger automatiquement les données sauvegardées
        if (savedWork.workbook) {
          workbook = savedWork.workbook;
          worksheetData = savedWork.worksheetData || [];
          currentSheet = savedWork.currentSheet || 'Feuille1';
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données sauvegardées:', error);
      }
    }
  }
  
  function initializeSpreadsheet() {
    // Vérifier s'il y a des données sauvegardées pour cet utilisateur
    const savedWork = getLocalStorage(`onor_work_${pseudo}`);
    
    if (savedWork && savedWork.workbook) {
      const shouldLoad = confirm('Des données sauvegardées ont été trouvées. Voulez-vous les charger ?');
      
      if (shouldLoad) {
        try {
          workbook = savedWork.workbook;
          worksheetData = savedWork.worksheetData || [];
          currentSheet = savedWork.currentSheet || 'Feuille1';
          
          // Si les données sont vides, utiliser les données par défaut
          if (!worksheetData || worksheetData.length === 0) {
            worksheetData = defaultData;
            updateWorkbook();
          }
          
          showSpreadsheet = true;
          return;
        } catch (error) {
          console.error('Erreur lors du chargement des données sauvegardées:', error);
        }
      }
    }
    
    // Créer un nouveau classeur avec des données par défaut
    const ws = XLSX.utils.aoa_to_sheet(defaultData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentSheet);
    
    workbook = wb;
    worksheetData = defaultData;
    showSpreadsheet = true;
    saveWorkToLocal(); // Sauvegarder immédiatement
  }
  
  function addRow() {
    const newRow = new Array(worksheetData[0]?.length || 5).fill('');
    worksheetData = [...worksheetData, newRow];
    updateWorkbook();
    saveWorkToLocal();
  }
  
  function addColumn() {
    worksheetData = worksheetData.map(row => [...row, '']);
    updateWorkbook();
    saveWorkToLocal();
  }
  
  function updateCell(rowIndex, colIndex, value) {
    worksheetData[rowIndex][colIndex] = value;
    updateWorkbook();
    saveWorkToLocal();
  }
  
  function updateWorkbook() {
    if (workbook) {
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      workbook.Sheets[currentSheet] = ws;
    }
  }
  
  function saveWorkToLocal() {
    if (pseudo) {
      const workData = {
        pseudo: pseudo,
        workbook: workbook,
        worksheetData: worksheetData,
        currentSheet: currentSheet,
        lastModified: new Date().toISOString()
      };
      setLocalStorage(`onor_work_${pseudo}`, workData);
      console.log('Données sauvegardées pour', pseudo);
    }
  }
  
  function downloadExcel() {
    if (workbook) {
      XLSX.writeFile(workbook, `${pseudo}_feuille_calcul.xlsx`);
    }
  }
  
  function downloadCSV() {
    if (workbook) {
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[currentSheet]);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${pseudo}_feuille_calcul.csv`;
      link.click();
    }
  }
  
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          workbook = wb;
          
          // Charger la première feuille
          const firstSheetName = wb.SheetNames[0];
          currentSheet = firstSheetName;
          const ws = wb.Sheets[firstSheetName];
          worksheetData = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
          
          showSpreadsheet = true;
          saveWorkToLocal();
          
          // Réinitialiser l'input file
          if (fileInput) {
            fileInput.value = '';
          }
        } catch (error) {
          console.error('Erreur lors du chargement du fichier:', error);
          alert('Erreur lors du chargement du fichier. Vérifiez que le fichier est valide.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }
  
  function calculateSum(colIndex) {
    let sum = 0;
    for (let i = 1; i < worksheetData.length; i++) {
      const value = parseFloat(worksheetData[i][colIndex]);
      if (!isNaN(value)) {
        sum += value;
      }
    }
    return sum;
  }
  
  function calculateAverage(colIndex) {
    let sum = 0;
    let count = 0;
    for (let i = 1; i < worksheetData.length; i++) {
      const value = parseFloat(worksheetData[i][colIndex]);
      if (!isNaN(value)) {
        sum += value;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }
  
  function clearSavedWork() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données sauvegardées ?')) {
      removeLocalStorage(`onor_work_${pseudo}`);
      workbook = null;
      worksheetData = [];
      showSpreadsheet = false;
      alert('Données sauvegardées supprimées.');
    }
  }
  
  function closeSpreadsheet() {
    saveWorkToLocal();
    showSpreadsheet = false;
  }
  
  function getSessionDuration() {
    if (!sessionInfo || !sessionInfo.loginTime) return 'Inconnu';
    
    const loginTime = new Date(sessionInfo.loginTime);
    const now = new Date();
    const diffMs = now.getTime() - loginTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }
</script>
<style lang="scss">
/* Variables de couleurs */
$primary-gradient: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
$secondary-gradient: linear-gradient(135deg, #2575fc 0%, #6a11cb 100%);
$white: #ffffff;
$black: #2d3436;
$light-gray: #f5f6fa;
$dark-gray: #636e72;
$success: #00b894;
$info: #0984e3;
$warning: #fdcb6e;
$danger: #d63031;

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Styles de base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
  background-color: $light-gray;
  color: $black;
  line-height: 1.6;
}

/* Conteneur principal */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: $primary-gradient;
  color: $white;
  padding: 2rem;
  animation: fadeIn 0.5s ease-out;
  
  .box {
    background: $white;
    color: $black;
    padding: 2.5rem;
    border-radius: 1.5rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    text-align: center;
    width: 100%;
    max-width: 800px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.2);
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
      font-weight: 700;
      background: $secondary-gradient;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 4px;
        background: $secondary-gradient;
        border-radius: 2px;
      }
    }
    
    .button-group {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
      margin: 2rem 0;
    }
    
    button {
      padding: 0.85rem 1.75rem;
      border: none;
      border-radius: 50px;
      background: $info;
      color: $white;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 10px rgba($info, 0.3);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba($info, 0.4);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      &.excel-btn {
        background: $success;
        box-shadow: 0 4px 10px rgba($success, 0.3);
        
        &:hover {
          box-shadow: 0 6px 15px rgba($success, 0.4);
        }
      }
      
      &.upload-btn {
        background: $warning;
        color: $black;
        box-shadow: 0 4px 10px rgba($warning, 0.3);
        
        &:hover {
          box-shadow: 0 6px 15px rgba($warning, 0.4);
        }
      }
      
      &.danger-btn {
        background: $danger;
        box-shadow: 0 4px 10px rgba($danger, 0.3);
        
        &:hover {
          box-shadow: 0 6px 15px rgba($danger, 0.4);
        }
      }
    }
    
    .file-input {
      margin: 2rem 0;
      width: 100%;
      
      label {
        display: block;
        margin-bottom: 0.75rem;
        font-weight: 600;
        color: $dark-gray;
      }
      
      input[type="file"] {
        width: 100%;
        padding: 1rem;
        border: 2px dashed rgba($info, 0.5);
        border-radius: 1rem;
        background: rgba($light-gray, 0.5);
        transition: all 0.3s ease;
        cursor: pointer;
        
        &:hover {
          border-color: $info;
          background: rgba($info, 0.1);
        }
        
        &::file-selector-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 50px;
          background: $info;
          color: $white;
          cursor: pointer;
          font-weight: 600;
          margin-right: 1rem;
          transition: all 0.3s ease;
          
          &:hover {
            background: darken($info, 10%);
          }
        }
      }
    }
    
    .session-info {
      margin-top: 2rem;
      padding: 1.25rem;
      background: rgba($info, 0.1);
      border-radius: 1rem;
      font-size: 0.95rem;
      color: $info;
      border-left: 4px solid $info;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      &::before {
        content: 'ⓘ';
        font-size: 1.2rem;
      }
    }
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: $primary-gradient;
  color: $white;
  font-size: 1.75rem;
  font-weight: 600;
  
  &::after {
    content: '...';
    animation: dots 1.5s steps(5, end) infinite;
  }
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}

.spreadsheet-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: $white;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.4s ease-out;
  
  .spreadsheet-header {
    background: $primary-gradient;
    color: $white;
    padding: 1.25rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    
    h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      &::before {
        content: '📊';
        font-size: 1.5rem;
      }
    }
    
    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      
      button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 50px;
        background: $white;
        color: $info;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        &:active {
          transform: translateY(0);
        }
        
        &.close-btn {
          background: $danger;
          color: $white;
          
          &:hover {
            background: darken($danger, 10%);
          }
        }
      }
    }
  }
  
  .toolbar {
    background: $light-gray;
    padding: 1rem;
    border-bottom: 1px solid rgba($dark-gray, 0.1);
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-shrink: 0;
    
    button {
      padding: 0.5rem 1rem;
      border: 1px solid rgba($dark-gray, 0.2);
      border-radius: 50px;
      background: $white;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      &:hover {
        background: $info;
        color: $white;
        border-color: $info;
      }
    }
    
    .stats {
      margin-left: auto;
      font-size: 0.9rem;
      color: $dark-gray;
      font-weight: 600;
      display: flex;
      gap: 1.5rem;
      
      span {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        &::before {
          font-size: 1.1rem;
        }
        
        &:nth-child(1)::before { content: '📈'; }
        &:nth-child(2)::before { content: '📉'; }
        &:nth-child(3)::before { content: '∑'; }
        &:nth-child(4)::before { content: 'μ'; }
      }
    }
  }
  
  .spreadsheet-content {
    flex: 1;
    overflow: auto;
    padding: 1.5rem;
    background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
    
    .table-container {
      overflow: auto;
      border: 1px solid rgba($dark-gray, 0.1);
      border-radius: 1rem;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      max-height: calc(100vh - 200px);
      
      table {
        width: 100%;
        border-collapse: collapse;
        background: $white;
        min-width: 800px;
        
        th, td {
          border: 1px solid rgba($dark-gray, 0.1);
          padding: 0.75rem;
          text-align: left;
          min-width: 120px;
          transition: background 0.2s ease;
          
          input {
            width: 100%;
            border: none;
            padding: 0.5rem;
            font-size: 0.95rem;
            background: transparent;
            transition: all 0.3s ease;
            
            &:focus {
              outline: none;
              background: rgba($info, 0.05);
              box-shadow: 0 0 0 2px rgba($info, 0.3);
              border-radius: 4px;
            }
          }
        }
        
        th {
          background: rgba($info, 0.1);
          font-weight: 700;
          color: $info;
          position: sticky;
          top: 0;
          z-index: 10;
          
          &::before {
            content: attr(data-col);
            display: block;
            font-size: 0.7rem;
            color: rgba($info, 0.7);
            margin-bottom: 0.25rem;
          }
        }
        
        tr:nth-child(even) {
          background: rgba($light-gray, 0.3);
        }
        
        tr:hover {
          background: rgba($info, 0.05);
          
          td {
            background: rgba($info, 0.03);
          }
        }
      }
    }
  }
}

/* Effets visuels supplémentaires */
.pulse-effect {
  animation: pulse 1.5s infinite;
}

.shake-effect {
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    padding: 1.5rem;
    
    .box {
      padding: 1.75rem;
      
      h1 {
        font-size: 2rem;
      }
      
      .button-group {
        gap: 1rem;
        
        button {
          padding: 0.75rem 1.25rem;
          font-size: 0.9rem;
        }
      }
    }
  }
  
  .spreadsheet-container {
    .spreadsheet-header {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      
      h2 {
        font-size: 1.5rem;
      }
      
      .header-actions {
        width: 100%;
        justify-content: space-between;
        
        button {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }
      }
    }
    
    .toolbar {
      flex-wrap: wrap;
      
      .stats {
        width: 100%;
        justify-content: space-between;
        margin-top: 0.5rem;
      }
    }
  }
}
</style>
{#if !isAuthenticated}
  <div class="loading">
    Vérification de l'authentification...
  </div>
{:else}
  <div class="container">
    <div class="box">
      <h1>Bienvenue {pseudo} 👋</h1>
      
      <div class="button-group">
        <button class="excel-btn" onclick={initializeSpreadsheet}>
          📊 Nouvelle feuille Excel
        </button>
        <button onclick={logout}>Se déconnecter</button>
        <button class="danger-btn" onclick={clearSavedWork}>
          🗑️ Effacer données
        </button>
      </div>
      
      <div class="file-input">
        <label for="file-upload">📁 Ou importer un fichier Excel/CSV :</label>
        <input 
          id="file-upload"
          type="file" 
          accept=".xlsx,.xls,.csv" 
          onchange={handleFileUpload}
          bind:this={fileInput}
        />
      </div>
      
      <div class="session-info">
        🔐 Session active - Vos données sont automatiquement sauvegardées localement
      </div>
    </div>
  </div>

  {#if showSpreadsheet}
    <div class="spreadsheet-container">
      <div class="spreadsheet-header">
        <h2>📊 {currentSheet} - {pseudo}</h2>
        <div class="header-actions">
          <button onclick={downloadExcel}>💾 Télécharger Excel</button>
          <button onclick={downloadCSV}>📄 Télécharger CSV</button>
          <button class="close-btn" onclick={closeSpreadsheet}>✕ Fermer</button>
        </div>
      </div>
      
      <div class="toolbar">
        <button onclick={addRow}>➕ Ligne</button>
        <button onclick={addColumn}>➕ Colonne</button>
        <div class="stats">
          Lignes: {worksheetData.length} | 
          Colonnes: {worksheetData[0]?.length || 0}
          {#if worksheetData.length > 1 && worksheetData[0]?.length > 4}
            | Somme col 5: {calculateSum(4).toLocaleString('fr-FR')} | 
            Moyenne col 5: {calculateAverage(4).toFixed(2)}
          {/if}
        </div>
      </div>
      
      <div class="spreadsheet-content">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                {#each Array(Math.max(5, worksheetData[0]?.length || 0)) as _, colIndex}
                  <th>{String.fromCharCode(65 + colIndex)}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each worksheetData as row, rowIndex}
                <tr>
                  {#each Array(Math.max(5, worksheetData[0]?.length || 0)) as _, colIndex}
                    <td>
                      <input 
                        type="text" 
                        value={row[colIndex] || ''} 
                        oninput={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        placeholder={rowIndex === 0 ? 'En-tête' : 'Valeur'}
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
{/if}