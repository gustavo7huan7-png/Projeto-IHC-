/* ===================================
   TELA 1 — CLI Terminal Logic
   =================================== */

// ── Nomes válidos ──
const NOMES_VALIDOS = [
  'gustavo', 'huan', 'wellyson', 'araujo', 'barros', 'isaac', 'barbosa', 'dutra', 'arthur', 'borges', 'sousa', 'ian', 'cesar', 'paulo', 'cesar', 'santos', 'silva', 'ana', 'cláudia', 'rafael', 'cleson', 'souza', 'de', 'oliveira', 'lidia', 'cruz', 'de', 'araújo', 'carlos', 'henrique', 'da', 'silva', 'sousa', 'arthur', 'de', 'pinho', 'costa', 'juan', 'douglas', 'mariana', 'ferreira', 'de', 'sousa', 'almeida', 'mateus', 'vinicius', 'francischini', 'cambiaghi', 'asaffe', 'gonçalves', 'albert', 'leite', 'resplandes', 'ketelly', 'lhais', 'lima', 'alves', 'davylla', 'lorrany', 'leonardo', 'martins', 'léo', 'franco', 'oliveira', 'joão', 'pedro', 'sanches', 'vieira', 'gerson', 'pereira', 'carneiro', 'kamilly', 'pereira', 'da', 'silva', 'rafael', 'quirino', 'paulo', 'ricardo', 'rodrigues', 'silva', 'adriel', 'sandes', 'carol', 'soares', 'hanry', 'sousa', 'de', 'carvalho', 'ian', 'vitor', 'do', 'vale', 'moreira', 'alexandre', 'william'
];

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

  // Event listeners do input
  cliInput.addEventListener('keydown', handleCliKeydown);

  // ── Card de autocomplete clicável no mobile ──
  const autocompleteEl = document.getElementById('cli-autocomplete');
  autocompleteEl.addEventListener('click', () => {
    autocompletar();
    // Retorna o foco ao input após o toque (importante no mobile)
    setTimeout(() => cliInput.focus(), 50);
  });

  // Focar no input
  setTimeout(() => cliInput.focus(), 500);

  // Welcome message
  setTimeout(() => {
    adicionarLinhaOutput('Sistema IHC Terminal v1.0', 'info');
    adicionarLinhaOutput('Digite /help para ver os comandos disponíveis.', 'response');
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
    autocomplete.classList.remove('visible');
    return;
  }

  // Seta ↑ → Comando anterior
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (posicaoHistorico > 0) {
      posicaoHistorico--;
      cliInput.value = historicoComandos[posicaoHistorico];
    }
    return;
  }

  // Seta ↓ → Próximo comando
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (posicaoHistorico < historicoComandos.length - 1) {
      posicaoHistorico++;
      cliInput.value = historicoComandos[posicaoHistorico];
    } else {
      posicaoHistorico = historicoComandos.length;
      cliInput.value = '';
    }
    return;
  }

  // Mostrar hint de autocomplete enquanto digita
  setTimeout(() => {
    const valor = cliInput.value.trim();
    if (valor.startsWith('/') && valor.length > 1) {
      const matches = COMANDOS.filter(c => c.startsWith(valor.toLowerCase()));
      if (matches.length > 0 && matches[0] !== valor.toLowerCase()) {
        // Label adaptado: "Toque" no mobile, "Tab" no desktop
        const label = isTouchDevice() ? '👆 Toque' : 'Tab';
        autocomplete.textContent = `${label} → ${matches[0]}`;
        autocomplete.classList.add('visible');
      } else {
        autocomplete.classList.remove('visible');
      }
    } else {
      autocomplete.classList.remove('visible');
    }
  }, 0);
}

// ── Autocompletar ──
function autocompletar() {
  const valor = cliInput.value.trim().toLowerCase();
  if (!valor.startsWith('/')) return;

  const matches = COMANDOS.filter(c => c.startsWith(valor));
  if (matches.length > 0) {
    cliInput.value = matches[0] + ' ';
    document.getElementById('cli-autocomplete').classList.remove('visible');
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
  adicionarLinhaOutput('  /setnome "Nome"   → Define seu nome', 'help');
  adicionarLinhaOutput('  /setcurso "Curso" → Define seu curso', 'help');
  adicionarLinhaOutput('  /setidade "Idade" → Define idade (16-55)', 'help');
  adicionarLinhaOutput('  /continuar        → Valida e avança', 'help');
  adicionarLinhaOutput('  /limpatela        → Limpa o terminal', 'help');
  adicionarLinhaOutput('  /telabin          → Efeito Matrix', 'help');
  adicionarLinhaOutput('  /apagarsite       → Simulação de delete', 'help');
  adicionarLinhaOutput('  /help             → Mostra esta lista', 'help');
  adicionarLinhaOutput('', 'help');
  adicionarLinhaOutput('╚══════════════════════════════════════╝', 'info');
}

// ── /setnome ──
function cmdSetNome(arg) {
  if (!arg) {
    adicionarLinhaOutput('ERRO: Uso correto: /setnome "Nome"', 'error');
    return;
  }

  const nomeNorm = normalizar(arg);
  const valido = NOMES_VALIDOS.includes(nomeNorm);

  if (valido) {
    // Salvar com formatação original (capitalizada)
    estadoGlobal.nome = arg.charAt(0).toUpperCase() + arg.slice(1).toLowerCase();
    adicionarLinhaOutput(`✓ Nome definido: ${estadoGlobal.nome}`, 'success');
  } else {
    adicionarLinhaOutput(`ERRO: Nome "${arg}" não é válido.`, 'error');
  }
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
