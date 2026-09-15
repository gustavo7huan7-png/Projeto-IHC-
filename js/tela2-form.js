/* ===================================
   TELA 2 — Formulário de Confirmação de Dados
   =================================== */

// ── Referências DOM ──
let formNome, formCurso, formIdade, formSubmitBtn;
let tela2Initialized = false;

// ── Regras de validação ──
const FORM_RULES = {
  nome: {
    validate: (v) => v.trim().length >= 2 && v.trim().length <= 60,
    msgInvalid: 'Nome deve ter entre 2 e 60 caracteres.',
    msgValid:   'Nome válido ✓'
  },
  curso: {
    validate: (v) => v.trim().length >= 2 && v.trim().length <= 80,
    msgInvalid: 'Curso deve ter entre 2 e 80 caracteres.',
    msgValid:   'Curso válido ✓'
  },
  idade: {
    validate: (v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 16 && n <= 55;
    },
    msgInvalid: 'Idade deve ser um número entre 16 e 55.',
    msgValid:   'Idade válida ✓'
  }
};

// ── Inicialização da Tela 2 ──
function initTela2() {
  formNome      = document.getElementById('form-nome');
  formCurso     = document.getElementById('form-curso');
  formIdade     = document.getElementById('form-idade');
  formSubmitBtn = document.getElementById('form-submit-btn');

  // Pré-preencher com os dados vindos do CLI
  formNome.value  = estadoGlobal.nome  || '';
  formCurso.value = estadoGlobal.curso || '';
  formIdade.value = estadoGlobal.idade || '';

  // Registrar listeners apenas uma vez
  if (!tela2Initialized) {
    formNome.addEventListener('input',  () => validarCampo('nome',  formNome.value));
    formCurso.addEventListener('input', () => validarCampo('curso', formCurso.value));
    formIdade.addEventListener('input', () => validarCampo('idade', formIdade.value));

    document.getElementById('form-dados').addEventListener('submit', handleFormSubmit);

    tela2Initialized = true;
  }

  // Disparar validação visual para os dados já preenchidos
  if (formNome.value)  validarCampo('nome',  formNome.value);
  if (formCurso.value) validarCampo('curso', formCurso.value);
  if (formIdade.value) validarCampo('idade', formIdade.value);

  // Focar no primeiro campo inválido ou no botão de confirmar
  setTimeout(() => {
    const invalido = [formNome, formCurso, formIdade].find(el => !el.value.trim());
    if (invalido) {
      invalido.focus();
    } else {
      formSubmitBtn.focus();
    }
  }, 350);
}

// ── Validação individual de campo ──
function validarCampo(campo, valor) {
  const rule     = FORM_RULES[campo];
  const fieldEl  = document.getElementById(`field-${campo}`);
  const feedback = document.getElementById(`feedback-${campo}`);

  if (!rule || !fieldEl || !feedback) return false;

  const ok = valor.trim() !== '' && rule.validate(valor);

  fieldEl.classList.remove('valid', 'invalid');
  feedback.textContent = '';

  if (valor.trim() === '') {
    // Campo vazio — sem estado ainda
    return false;
  }

  if (ok) {
    fieldEl.classList.add('valid');
    feedback.textContent = rule.msgValid;
  } else {
    fieldEl.classList.add('invalid');
    feedback.textContent = rule.msgInvalid;
  }

  return ok;
}

// ── Validar todos os campos ──
function validarTodos() {
  const okNome  = validarCampo('nome',  formNome.value);
  const okCurso = validarCampo('curso', formCurso.value);
  const okIdade = validarCampo('idade', formIdade.value);
  return okNome && okCurso && okIdade;
}

// ── Handler de submit ──
async function handleFormSubmit(e) {
  e.preventDefault();

  if (!validarTodos()) {
    // Agitar o card para indicar erro
    const card = document.getElementById('form-card');
    card.style.transition = 'transform 80ms ease';
    const shakes = ['-6px', '6px', '-4px', '4px', '0px'];
    let i = 0;
    const shake = () => {
      if (i >= shakes.length) { card.style.transform = ''; return; }
      card.style.transform = `translateX(${shakes[i++]})`;
      setTimeout(shake, 80);
    };
    shake();
    return;
  }

  // Sincronizar estado global com os valores editados no formulário
  estadoGlobal.nome  = formNome.value.trim();
  estadoGlobal.curso = formCurso.value.trim();
  estadoGlobal.idade = Number(formIdade.value);

  // Desabilitar botão durante o envio
  formSubmitBtn.disabled = true;
  formSubmitBtn.textContent = 'Enviando...';

  const payload = {
    nome:  estadoGlobal.nome,
    curso: estadoGlobal.curso,
    idade: estadoGlobal.idade
  };

  // PUT /api/usuarios/:id — atualizar os dados no servidor
  if (estadoGlobal.id) {
    await apiFetch(`/api/usuarios/${estadoGlobal.id}`, {
      method: 'PUT',
      body: payload
    });
  }

  // Persistir sessão
  if (typeof salvarSessao === 'function') salvarSessao();

  // Feedback visual de sucesso no botão
  formSubmitBtn.textContent = '✓ Confirmado!';

  setTimeout(() => {
    formSubmitBtn.disabled    = false;
    formSubmitBtn.textContent = 'Confirmar e Continuar';
    navegarPara('tela-3');
  }, 700);
}
