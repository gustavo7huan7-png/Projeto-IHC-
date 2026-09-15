/* ===================================
   TELA 1 — CLI Terminal Logic
   =================================== */


// ── Comandos disponíveis ──
const COMANDOS = ['/help', '/setnome', '/setcurso', '/setidade', '/continuar', '/limpatela', '/telabin', '/apagarsite', '/gestorsite'];

// ── Histórico de comandos ──
let historicoComandos = [];
let posicaoHistorico = -1;

// ── Referências DOM ──
let cliOutput, cliInput;

// ── Detectar dispositivo touch ──
const isTouchDevice = () =>
  ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

function initTela1() {
  cliOutput = document.getElementById('cli-output');
  cliInput  = document.getElementById('cli-input');

  // Animação do título
  animarTitulo();

  // Event listeners do input — 'input' é essencial para teclados virtuais mobile (Gboard, iOS, etc.)
  cliInput.addEventListener('keydown', handleCliKeydown);
  cliInput.addEventListener('input', atualizarAutocompleteHint);
  cliInput.addEventListener('keyup', atualizarAutocompleteHint);

  // ── Card de autocomplete clicável / tocável no mobile e desktop ──
  const autocompleteEl = document.getElementById('cli-autocomplete');
  if (autocompleteEl) {
    const acionarSugestao = (e) => {
      // e.preventDefault() no pointerdown/touchstart é fundamental:
      // impede que o input perca o foco (blur) e impede que o teclado virtual feche/pule a tela!
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      autocompletar();
    };

    autocompleteEl.addEventListener('pointerdown', acionarSugestao);
    autocompleteEl.addEventListener('touchstart', acionarSugestao, { passive: false });
    autocompleteEl.addEventListener('click', acionarSugestao);
  }

  // ── Permitir clicar em comandos dentro do terminal (ex: /help, /setnome) ──
  if (cliOutput) {
    cliOutput.addEventListener('click', (e) => {
      const cmdLink = e.target.closest('.cli-cmd-link');
      if (cmdLink && cmdLink.dataset.cmd) {
        cliInput.value = cmdLink.dataset.cmd + ' ';
        cliInput.focus();
        const len = cliInput.value.length;
        cliInput.setSelectionRange(len, len);
        atualizarAutocompleteHint();
      }
    });
  }

  // Focar no input
  setTimeout(() => cliInput.focus(), 500);

  // Welcome message
  setTimeout(() => {
    adicionarLinhaOutput('Sistema IHC Terminal v1.0', 'info');
    adicionarHtmlOutput('Digite <span class="cli-cmd-link" data-cmd="/help">/help</span> para ver os comandos disponíveis.', 'response');
    adicionarLinhaOutput('', 'response');
  }, 1800);
}

// ── Animação título letra por letra ──
function animarTitulo() {
  const titulo = document.getElementById('cli-title-text');
  const texto = '<IHC- CLI Estilo Paradigma direta>';
  titulo.innerHTML = '';
  let i = 0;

  const cursor = document.createElement('span');
  cursor.className = 'cli-cursor-blink';

  const interval = setInterval(() => {
    if (i < texto.length) {
      titulo.textContent += texto[i];
      titulo.appendChild(cursor);
      i++;
    } else {
      clearInterval(interval);
      // Remove cursor after full text
      setTimeout(() => {
        if (cursor.parentNode) cursor.remove();
      }, 2000);
    }
  }, 40);
}

// ── Adicionar linha ao output ──
function adicionarLinhaOutput(texto, tipo = 'response') {
  const linha = document.createElement('div');
  linha.className = `line line-${tipo}`;
  linha.textContent = texto;
  cliOutput.appendChild(linha);
  cliOutput.scrollTop = cliOutput.scrollHeight;
}

// ── Adicionar HTML ao output ──
function adicionarHtmlOutput(html, tipo = 'response') {
  const linha = document.createElement('div');
  linha.className = `line line-${tipo}`;
  linha.innerHTML = html;
  cliOutput.appendChild(linha);
  cliOutput.scrollTop = cliOutput.scrollHeight;
}

// ── Handler de teclado do CLI ──
function handleCliKeydown(e) {
  const autocomplete = document.getElementById('cli-autocomplete');

  // Tab → Autocompletar
  if (e.key === 'Tab') {
    e.preventDefault();
    autocompletar();
    return;
  }

  // Enter → Executar comando
  if (e.key === 'Enter') {
    e.preventDefault();
    const cmd = cliInput.value.trim();
    if (cmd) {
      historicoComandos.push(cmd);
      posicaoHistorico = historicoComandos.length;
      executarComando(cmd);
      cliInput.value = '';
    }
    if (autocomplete) {
      autocomplete.classList.remove('visible');
      autocomplete.dataset.cmd = '';
    }
    return;
  }

  // Seta ↑ → Comando anterior
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (posicaoHistorico > 0) {
      posicaoHistorico--;
      cliInput.value = historicoComandos[posicaoHistorico];
      atualizarAutocompleteHint();
    }
    return;
  }

  // Seta ↓ → Próximo comando
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (posicaoHistorico < historicoComandos.length - 1) {
      posicaoHistorico++;
      cliInput.value = historicoComandos[posicaoHistorico];
      atualizarAutocompleteHint();
    } else {
      posicaoHistorico = historicoComandos.length;
      cliInput.value = '';
      atualizarAutocompleteHint();
    }
    return;
  }
}

// ── Atualizar hint de autocomplete em tempo real ──
function atualizarAutocompleteHint() {
  const autocomplete = document.getElementById('cli-autocomplete');
  if (!autocomplete || !cliInput) return;

  const valor = cliInput.value.trim();
  if (valor.startsWith('/')) {
    const matches = COMANDOS.filter(c => c.startsWith(valor.toLowerCase()));
    if (matches.length > 0 && matches[0] !== valor.toLowerCase()) {
      const match = matches[0];
      autocomplete.dataset.cmd = match;
      const label = isTouchDevice() ? '👆 Toque aqui para autocompletar' : 'Tab ou clique';
      autocomplete.innerHTML = `<span>${label} → <strong>${match}</strong></span>`;
      autocomplete.classList.add('visible');
      return;
    }
  }

  autocomplete.classList.remove('visible');
  autocomplete.dataset.cmd = '';
}

// ── Autocompletar ──
function autocompletar() {
  const autocomplete = document.getElementById('cli-autocomplete');
  const targetCmd = autocomplete ? autocomplete.dataset.cmd : null;
  let cmdFinal = targetCmd;

  if (!cmdFinal) {
    const valor = cliInput.value.trim().toLowerCase();
    if (valor.startsWith('/')) {
      const matches = COMANDOS.filter(c => c.startsWith(valor));
      if (matches.length > 0) cmdFinal = matches[0];
    }
  }

  if (cmdFinal) {
    cliInput.value = cmdFinal + ' ';
    if (autocomplete) {
      autocomplete.classList.remove('visible');
      autocomplete.dataset.cmd = '';
    }
    cliInput.focus();
    const len = cliInput.value.length;
    cliInput.setSelectionRange(len, len);
  }
}

// ── Parser de comando ──
function parseComando(input) {
  // Extrair comando e argumento entre aspas
  const matchComAspas = input.match(/^(\/\w+)\s+"([^"]+)"$/);
  if (matchComAspas) {
    return { cmd: matchComAspas[1].toLowerCase(), arg: matchComAspas[2] };
  }

  // Extrair comando e argumento sem aspas
  const matchSemAspas = input.match(/^(\/\w+)\s+(.+)$/);
  if (matchSemAspas) {
    return { cmd: matchSemAspas[1].toLowerCase(), arg: matchSemAspas[2].trim() };
  }

  // Apenas comando
  const matchSoCmd = input.match(/^(\/\w+)\s*$/);
  if (matchSoCmd) {
    return { cmd: matchSoCmd[1].toLowerCase(), arg: null };
  }

  return { cmd: null, arg: null };
}

// ── Executar comando ──
function executarComando(input) {
  adicionarLinhaOutput(`> ${input}`, 'cmd');

  const { cmd, arg } = parseComando(input);

  switch (cmd) {
    case '/help':
      cmdHelp();
      break;
    case '/setnome':
      cmdSetNome(arg);
      break;
    case '/setcurso':
      cmdSetCurso(arg);
      break;
    case '/setidade':
      cmdSetIdade(arg);
      break;
    case '/continuar':
      cmdContinuar();
      break;
    case '/limpatela':
      cmdLimpaTela();
      break;
    case '/telabin':
      cmdTelaBin();
      break;
    case '/apagarsite':
      cmdApagarSite();
      break;
    case '/gestorsite':
      cmdGestorSite();
      break;
    default:
      adicionarLinhaOutput(`ERRO: Comando "${input}" não reconhecido. Use /help.`, 'error');
  }
}

// ── /help ──
function cmdHelp() {
  adicionarLinhaOutput('╔══════════════════════════════════════╗', 'info');
  adicionarLinhaOutput('║     COMANDOS DISPONÍVEIS             ║', 'info');
  adicionarLinhaOutput('╠══════════════════════════════════════╣', 'info');
  adicionarLinhaOutput('', 'help');
  adicionarHtmlOutput('&nbsp;&nbsp;<span class="cli-cmd-link" data-cmd="/setnome">/setnome "Nome"</span>&nbsp;&nbsp;&nbsp;→ Define seu nome', 'help');
  adicionarHtmlOutput('&nbsp;&nbsp;<span class="cli-cmd-link" data-cmd="/setcurso">/setcurso "Curso"</span>&nbsp;&nbsp;→ Define seu curso', 'help');
  adicionarHtmlOutput('&nbsp;&nbsp;<span class="cli-cmd-link" data-cmd="/setidade">/setidade "Idade"</span>&nbsp;&nbsp;→ Define idade (16-55)', 'help');
  adicionarHtmlOutput('&nbsp;&nbsp;<span class="cli-cmd-link" data-cmd="/continuar">/continuar</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Valida e avança', 'help');
  adicionarHtmlOutput('&nbsp;&nbsp;<span class="cli-cmd-link" data-cmd="/limpatela">/limpatela</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Limpa o terminal', 'help');
  adicionarHtmlOutput('&nbsp;&nbsp;<span class="cli-cmd-link" data-cmd="/telabin">/telabin</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Efeito Matrix', 'help');
  adicionarHtmlOutput('&nbsp;&nbsp;<span class="cli-cmd-link" data-cmd="/apagarsite">/apagarsite</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Simulação de delete', 'help');
  adicionarHtmlOutput('&nbsp;&nbsp;<span class="cli-cmd-link" data-cmd="/help">/help</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Mostra esta lista', 'help');
  adicionarLinhaOutput('', 'help');
  adicionarLinhaOutput('╚══════════════════════════════════════╝', 'info');
}

// ── /setnome ──
function cmdSetNome(arg) {
  if (!arg || arg.trim().length < 2) {
    adicionarLinhaOutput('ERRO: Uso correto: /setnome "Nome" (mínimo 2 caracteres)', 'error');
    return;
  }
  if (arg.trim().length > 60) {
    adicionarLinhaOutput('ERRO: Nome muito longo. Máximo de 60 caracteres.', 'error');
    return;
  }

  // Capitaliza a primeira letra, mantém o resto como digitado
  const nome = arg.trim();
  estadoGlobal.nome = nome.charAt(0).toUpperCase() + nome.slice(1);
  adicionarLinhaOutput(`✓ Nome definido: ${estadoGlobal.nome}`, 'success');
}

// ── /setcurso ──
function cmdSetCurso(arg) {
  if (!arg) {
    adicionarLinhaOutput('ERRO: Uso correto: /setcurso "Curso"', 'error');
    return;
  }
  estadoGlobal.curso = arg;
  adicionarLinhaOutput(`✓ Curso definido: ${estadoGlobal.curso}`, 'success');
}

// ── /setidade ──
function cmdSetIdade(arg) {
  if (!arg) {
    adicionarLinhaOutput('ERRO: Uso correto: /setidade "Idade"', 'error');
    return;
  }

  const idade = parseInt(arg, 10);
  if (isNaN(idade) || idade < 16 || idade > 55) {
    adicionarLinhaOutput(`ERRO: Idade deve ser um número entre 16 e 55. Recebido: "${arg}"`, 'error');
    return;
  }

  estadoGlobal.idade = idade;
  adicionarLinhaOutput(`✓ Idade definida: ${estadoGlobal.idade}`, 'success');
}

// ── /continuar ──
async function cmdContinuar() {
  const erros = [];

  if (!estadoGlobal.nome) erros.push('nome (use /setnome)');
  if (!estadoGlobal.curso) erros.push('curso (use /setcurso)');
  if (!estadoGlobal.idade) erros.push('idade (use /setidade)');

  if (erros.length > 0) {
    adicionarLinhaOutput(`ERRO-001: Dados incompletos. Faltam: ${erros.join(', ')}`, 'error');
    return;
  }

  adicionarLinhaOutput('Enviando dados para o servidor...', 'info');

  // Tenta enviar para a API
  const payload = {
    nome: estadoGlobal.nome,
    curso: estadoGlobal.curso,
    idade: estadoGlobal.idade
  };

  const resultado = await apiFetch('/api/usuarios', {
    method: 'POST',
    body: payload
  });

  if (resultado.ok && resultado.data && resultado.data.id) {
    estadoGlobal.id = resultado.data.id;
    if (typeof salvarSessao === 'function') salvarSessao();
    adicionarLinhaOutput(`✓ Cadastro realizado! ID: ${estadoGlobal.id}`, 'success');
    adicionarLinhaOutput('Redirecionando para confirmação de dados...', 'info');
    setTimeout(() => {
      navegarPara('tela-2');
    }, 1000);
  } else {
    // Modo offline — gerar ID local
    estadoGlobal.id = gerarId();
    if (typeof salvarSessao === 'function') salvarSessao();
    adicionarLinhaOutput('⚠ Servidor indisponível — modo offline ativado.', 'info');
    adicionarLinhaOutput(`✓ ID local gerado: ${estadoGlobal.id}`, 'success');
    adicionarLinhaOutput('Redirecionando para confirmação de dados...', 'info');
    setTimeout(() => {
      navegarPara('tela-2');
    }, 1000);
  }
}

// ── /limpatela ──
function cmdLimpaTela() {
  cliOutput.innerHTML = '';
  adicionarLinhaOutput('Terminal limpo.', 'info');
}

// ── /telabin — Matrix Rain ──
function cmdTelaBin() {
  adicionarLinhaOutput('Iniciando Matrix Rain por 5 segundos...', 'info');

  const tela = document.getElementById('tela-1');
  const canvas = document.createElement('canvas');
  canvas.className = 'cli-matrix-canvas';
  tela.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = tela.offsetWidth;
  canvas.height = tela.offsetHeight;

  const fontSize = 14;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = new Array(columns).fill(1);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

  let animFrameId;
  let lastFrame = 0;
  const FPS_INTERVAL = 1000 / 30; // 30 FPS

  function drawMatrix(timestamp) {
    animFrameId = requestAnimationFrame(drawMatrix);

    if (timestamp - lastFrame < FPS_INTERVAL) return;
    lastFrame = timestamp;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00FF00';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillStyle = Math.random() > 0.96 ? '#FFFFFF' : '#00FF00';
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  animFrameId = requestAnimationFrame(drawMatrix);

  // Parar após 5 segundos
  setTimeout(() => {
    cancelAnimationFrame(animFrameId);
    canvas.remove();
    adicionarLinhaOutput('Matrix Rain finalizado.', 'success');
  }, 5000);
}

// ── /apagarsite — Progress bar ──
function cmdApagarSite() {
  adicionarLinhaOutput('Iniciando protocolo de destruição...', 'error');

  const container = document.createElement('div');
  container.className = 'cli-progress-container';

  const bar = document.createElement('div');
  bar.className = 'cli-progress-bar';

  const text = document.createElement('div');
  text.className = 'cli-progress-text';
  text.textContent = '0%';

  container.appendChild(bar);
  container.appendChild(text);
  cliOutput.appendChild(container);
  cliOutput.scrollTop = cliOutput.scrollHeight;

  let progresso = 0;
  const interval = setInterval(() => {
    progresso += Math.random() * 3 + 0.5;
    if (progresso >= 100) {
      progresso = 100;
      clearInterval(interval);

      bar.style.width = '100%';
      text.textContent = '100%';

      setTimeout(() => {
        adicionarLinhaOutput('', 'response');
        adicionarLinhaOutput('████████████████████████████████████████', 'error');
        adicionarLinhaOutput('  ACESSO NEGADO — PERMISSÃO INSUFICIENTE', 'error');
        adicionarLinhaOutput('  Nice try, bobó! 😎', 'info');
        adicionarLinhaOutput('████████████████████████████████████████', 'error');
        adicionarLinhaOutput('', 'response');
      }, 500);
    } else {
      bar.style.width = `${progresso}%`;
      text.textContent = `${Math.floor(progresso)}%`;
    }
  }, 60);
}

// ── /gestorsite — Navegar para Dashboard ──
function cmdGestorSite() {
  adicionarLinhaOutput('Abrindo painel do Gestor do Site...', 'info');
  setTimeout(() => {
    navegarPara('tela-4');
  }, 500);
}
