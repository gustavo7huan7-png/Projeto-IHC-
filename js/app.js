/* ===================================
   APP.JS — Estado Global, Navegação, Socket.io
   =================================== */

// ── Estado Global ──
const estadoGlobal = {
  nome: null,
  curso: null,
  idade: null,
  id: null,
  telaAtual: 'tela-1'
};

// ── Socket.io (graceful fallback se servidor não estiver disponível) ──
let socket = null;
try {
  if (typeof io !== 'undefined') {
    socket = io();
    console.log('[Socket.io] Conectando...');
  } else {
    console.warn('[Socket.io] Biblioteca não disponível — modo offline');
  }
} catch (e) {
  console.warn('[Socket.io] Erro ao conectar:', e.message);
}

// ── Navegação SPA ──
function navegarPara(telaId) {
  const telas = document.querySelectorAll('.tela');
  telas.forEach(tela => tela.classList.remove('active'));

  const alvo = document.getElementById(telaId);
  if (alvo) {
    alvo.classList.add('active');
    estadoGlobal.telaAtual = telaId;
    console.log(`[Nav] → ${telaId}`);

    // Chamar hook de inicialização da tela
    if (telaId === 'tela-2' && typeof initTela2 === 'function') initTela2();
    if (telaId === 'tela-3' && typeof initTela3 === 'function') initTela3();
    if (telaId === 'tela-4' && typeof initTela4 === 'function') initTela4();
  }
}

// ── Fetch wrapper com tratamento de erro ──
async function apiFetch(url, options = {}) {
  try {
    const defaults = {
      headers: { 'Content-Type': 'application/json' }
    };
    const config = { ...defaults, ...options };
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.warn(`[API] Erro em ${url}:`, error.message);
    return { ok: false, error: error.message };
  }
}

// ── Visual Viewport handler (teclado virtual no mobile) ──
function setupViewportHandler() {
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const vh = window.visualViewport.height;
      document.documentElement.style.setProperty('--viewport-h', `${vh}px`);
    });
    document.documentElement.style.setProperty('--viewport-h', `${window.visualViewport.height}px`);
  }
}

// ── Utility: Normalizar string (remover acentos, lowercase) ──
function normalizar(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// ── Utility: Timestamp formatado ──
function formatarHora() {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ── Utility: Gerar ID simples (usado em modo offline) ──
function gerarId() {
  return 'local_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ── Socket.io: listeners globais ──
function setupSocketListeners() {
  if (!socket) return;

  socket.on('connect', () => {
    console.log('[Socket.io] Conectado — ID:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('[Socket.io] Desconectado');
  });

  // Listener: o administrador excluiu este usuário → volta à Tela 1
  socket.on('usuarioDeletado', (data) => {
    if (data && data.id === estadoGlobal.id) {
      limparSessao();
      estadoGlobal.nome = null;
      estadoGlobal.curso = null;
      estadoGlobal.idade = null;
      estadoGlobal.id = null;
      navegarPara('tela-1');
      if (typeof adicionarLinhaOutput === 'function') {
        adicionarLinhaOutput('Você foi removido pelo administrador. Faça login novamente.', 'error');
      }
    }
  });
}

// ── Persistência de Sessão — localStorage ──
function salvarSessao() {
  try {
    localStorage.setItem('ihc_usuario', JSON.stringify({
      id: estadoGlobal.id,
      nome: estadoGlobal.nome,
      curso: estadoGlobal.curso,
      idade: estadoGlobal.idade
    }));
    console.log('[Storage] Sessão salva:', estadoGlobal.nome);
  } catch (e) {
    console.warn('[Storage] Erro ao salvar sessão:', e);
  }
}

function carregarSessao() {
  try {
    const salvo = localStorage.getItem('ihc_usuario');
    if (salvo) {
      const dados = JSON.parse(salvo);
      if (dados && dados.nome) {
        estadoGlobal.id = dados.id || null;
        estadoGlobal.nome = dados.nome || null;
        estadoGlobal.curso = dados.curso || null;
        estadoGlobal.idade = dados.idade || null;
        console.log('[Storage] Sessão recuperada:', estadoGlobal.nome);
      }
    }
  } catch (e) {
    console.warn('[Storage] Erro ao carregar sessão:', e);
  }
}

function limparSessao() {
  try {
    localStorage.removeItem('ihc_usuario');
    console.log('[Storage] Sessão apagada.');
  } catch (e) {
    console.warn('[Storage] Erro ao limpar sessão:', e);
  }
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  setupViewportHandler();
  carregarSessao();
  setupSocketListeners();

  // Iniciar sempre na Tela 1
  navegarPara('tela-1');

  // Inicializar CLI
  if (typeof initTela1 === 'function') {
    initTela1();
  }
});
