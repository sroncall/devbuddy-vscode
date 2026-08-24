import { CustomCommand } from '../types';

export function buildDashboardHtml(commands: CustomCommand[], iconUri: string): string {
  const cards = renderCards(commands);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DevBuddy Panel</title>
  <style>${DASHBOARD_STYLES}</style>
</head>
<body>
  <main class="shell">
    ${renderHeader(iconUri)}
    ${renderToolbar()}
    ${renderCreateForm()}
    <section class="grid">${cards}</section>
  </main>

  <script>${DASHBOARD_SCRIPT}</script>
</body>
</html>`;
}

function renderCards(commands: CustomCommand[]): string {
  if (commands.length === 0) {
    return renderEmptyState();
  }

  return commands.map(renderCommandCard).join('');
}

function renderCommandCard(item: CustomCommand, index: number): string {
  const preview = escapeHtml(item.command.split(/\r?\n/, 1)[0] ?? '');

  return `
    <details class="command-item card" data-index="${index}">
      <summary class="command-summary">
        <div class="summary-copy">
          <span class="summary-title">${escapeHtml(item.name)}</span>
          <span class="summary-preview">${preview}</span>
        </div>
        <div class="summary-actions">
          <button class="run icon-button summary-run" data-action="run" data-index="${index}" type="button" title="Ejecutar comando" aria-label="Ejecutar comando">▶</button>
        </div>
      </summary>

      <div class="command-body">
        <label class="field-label" for="name-${index}">Nombre</label>
        <input id="name-${index}" class="field" value="${escapeHtml(item.name)}" />

        <label class="field-label" for="command-${index}">Comando</label>
        <textarea id="command-${index}" class="field command">${escapeHtml(item.command)}</textarea>

        <div class="actions" aria-label="Acciones del comando">
          <button class="icon-button secondary" data-action="save" data-index="${index}" type="button" title="Guardar cambios" aria-label="Guardar cambios">💾</button>
          <button class="icon-button danger" data-action="delete" data-index="${index}" type="button" title="Eliminar comando" aria-label="Eliminar comando">🗑</button>
        </div>
      </div>
    </details>
  `;
}

function renderEmptyState(): string {
  return `
    <div class="empty">
      <p>No hay comandos personalizados todavía.</p>
      <p>Usa "Crear comando" para agregar el primero.</p>
    </div>
  `;
}

function renderHeader(iconUri: string): string {
  return `
    <div class="brand">
      <span class="brand-icon" aria-hidden="true">
        <img src="${iconUri}" alt="DevBuddy Logo" width="20" height="20" />
      </span>
      <h1>DevBuddy</h1>
    </div>
    <p class="subtitle">Gestionar y ejecutar comandos personalizados.</p>
  `;
}

function renderToolbar(): string {
  return `
    <section class="toolbar">
      <button class="primary icon-button toolbar-button" id="toggle-create" type="button" title="Mostrar u ocultar formulario para crear comando" aria-label="Mostrar u ocultar formulario para crear comando">＋</button>
      <button class="secondary icon-button toolbar-button" id="import" type="button" title="Importar comandos desde JSON" aria-label="Importar comandos desde JSON">⇩</button>
      <button class="secondary icon-button toolbar-button" id="export" type="button" title="Exportar comandos a JSON" aria-label="Exportar comandos a JSON">⇪</button>
    </section>
  `;
}

function renderCreateForm(): string {
  return `
    <section class="card create-card is-hidden" id="create-form">
      <div class="create-header">
        <h2>Nuevo comando</h2>
        <button class="primary create-submit" id="create-inline" type="button">Guardar</button>
      </div>

      <label class="field-label" for="new-name">Nombre</label>
      <input id="new-name" class="field" placeholder="Ejemplo: Levantar backend" />

      <label class="field-label" for="new-command">Codigo</label>
      <textarea id="new-command" class="field command" placeholder="Ejemplo: npm run dev"></textarea>
    </section>
  `;
}

const DASHBOARD_STYLES = `
  :root {
    --bg-top: #0f1b2d;
    --bg-bottom: #173758;
    --accent: #f7b32b;
    --accent-2: #4ecdc4;
    --ink: #f5f7fa;
    --muted: #b6c5d6;
    --card: rgba(7, 16, 28, 0.68);
    --border: rgba(255, 255, 255, 0.18);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: "Trebuchet MS", "Fira Sans", sans-serif;
    color: var(--ink);
    min-height: 100vh;
    background:
      radial-gradient(circle at 8% 14%, rgba(247, 179, 43, 0.2), transparent 32%),
      radial-gradient(circle at 88% 82%, rgba(78, 205, 196, 0.22), transparent 34%),
      linear-gradient(148deg, var(--bg-top), var(--bg-bottom));
    padding: 20px;
  }

  .shell {
    max-width: 980px;
    margin: 0 auto;
    animation: fadeIn 260ms ease-out;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid var(--border);
    display: grid;
    place-items: center;
    background: rgba(7, 16, 28, 0.55);
    font-size: 16px;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.5rem, 2.8vw, 2.1rem);
    letter-spacing: 0.02em;
  }

  .subtitle {
    margin: 6px 0 18px;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .toolbar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .action-button {
    width: auto;
    height: 42px;
    border-radius: 999px;
    padding: 0 14px;
    font-size: 0.85rem;
  }

  button {
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 9px 14px;
    cursor: pointer;
    font-weight: 600;
    transition: transform 120ms ease, border-color 120ms ease, filter 120ms ease;
  }

  button:focus-visible,
  summary:focus-visible,
  .field:focus-visible {
    outline: 2px solid rgba(78, 205, 196, 0.85);
    outline-offset: 2px;
  }

  button:hover {
    transform: translateY(-1px);
    filter: brightness(1.04);
  }

  .primary {
    background: var(--accent);
    color: #1f1400;
  }

  .secondary {
    background: transparent;
    color: var(--ink);
    border-color: var(--border);
  }

  .grid {
    display: grid;
    gap: 10px;
  }

  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
    backdrop-filter: blur(5px);
    animation: riseIn 220ms ease both;
  }

  .create-card {
    margin-bottom: 12px;
  }

  .create-card.is-hidden {
    display: none;
  }

  .create-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .create-header h2 {
    margin: 0;
    font-size: 1rem;
  }

  .create-submit {
    min-width: 108px;
  }

  .field-label {
    display: block;
    margin: 0 0 4px;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .field {
    width: 100%;
    margin: 0 0 10px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: rgba(0, 0, 0, 0.22);
    color: var(--ink);
    padding: 8px 10px;
    font: inherit;
  }

  .field.command {
    resize: vertical;
    min-height: 62px;
    margin-bottom: 12px;
  }

  .command-item {
    padding: 0;
    overflow: hidden;
  }

  .command-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px;
    cursor: pointer;
    list-style: none;
  }

  .command-summary::-webkit-details-marker {
    display: none;
  }

  .summary-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .summary-title {
    font-weight: 700;
  }

  .summary-preview,
  .summary-hint {
    color: var(--muted);
    font-size: 0.85rem;
  }

  .summary-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .summary-preview {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .summary-run {
    width: 34px;
    height: 34px;
    min-width: 34px;
    font-size: 0.9rem;
  }

  .command-body {
    border-top: 1px solid var(--border);
    padding: 14px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .run {
    background: var(--accent-2);
    color: #092224;
  }

  .icon-button {
    width: 40px;
    height: 40px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    line-height: 1;
  }

  .danger {
    background: transparent;
    color: #ffb4b4;
    border-color: rgba(255, 125, 125, 0.45);
  }

  .toolbar-button {
    width: 42px;
    height: 42px;
    font-size: 1.2rem;
  }

  .empty {
    border: 1px dashed var(--border);
    border-radius: 14px;
    padding: 24px;
    text-align: center;
    color: var(--muted);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes riseIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const DASHBOARD_SCRIPT = `
  const vscode = acquireVsCodeApi();
  const createForm = document.getElementById('create-form');
  const toggleCreateButton = document.getElementById('toggle-create');
  const expandButton = document.getElementById('toggle-expand');
  const commandItems = () => Array.from(document.querySelectorAll('.command-item'));

  toggleCreateButton?.addEventListener('click', () => {
    createForm?.classList.toggle('is-hidden');
  });

  document.getElementById('create-inline')?.addEventListener('click', () => {
    const name = document.getElementById('new-name')?.value ?? '';
    const command = document.getElementById('new-command')?.value ?? '';
    vscode.postMessage({ type: 'createInline', name, command });
  });

  expandButton?.addEventListener('click', () => {
    const items = commandItems();
    const shouldExpand = items.some((item) => !item.open);

    for (const item of items) {
      item.open = false;
    }

    if (shouldExpand) {
      for (const item of items) {
        item.open = true;
      }
    }
  });

  document.addEventListener('toggle', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLDetailsElement) || !target.classList.contains('command-item') || !target.open) {
      return;
    }

    for (const item of commandItems()) {
      if (item !== target) {
        item.open = false;
      }
    }
  }, true);

  document.getElementById('refresh')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'refresh' });
  });

  document.getElementById('import')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'import' });
  });

  document.getElementById('export')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'export' });
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest('.summary-run')) {
      event.preventDefault();
    }

    const actionButton = target.closest('button[data-action]');
    if (!(actionButton instanceof HTMLButtonElement)) {
      return;
    }

    const index = Number(actionButton.getAttribute('data-index'));
    const action = actionButton.getAttribute('data-action');

    if (!Number.isInteger(index) || !action) {
      return;
    }

    if (action === 'run') {
      vscode.postMessage({ type: 'run', index });
      return;
    }

    if (action === 'save') {
      const name = document.getElementById('name-' + index)?.value ?? '';
      const command = document.getElementById('command-' + index)?.value ?? '';
      vscode.postMessage({ type: 'save', index, name, command });
      return;
    }

    if (action === 'delete') {
      vscode.postMessage({ type: 'delete', index });
    }
  });
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}