import * as vscode from 'vscode';
import { CustomCommand } from '../types';
import { getOrCreateDevBuddyTerminal } from './terminal';

const CONFIG_SECTION = 'myCommandExtension';
const CONFIG_KEY = 'customCommands';

export async function runCustomCommand(): Promise<void> {
  const commands = readCustomCommands();

  if (commands.length === 0) {
    vscode.window.showInformationMessage(
      'No hay comandos configurados. Define myCommandExtension.customCommands en Settings.'
    );
    return;
  }

  const selection = await vscode.window.showQuickPick(
    commands.map((item) => ({
      label: item.name,
      description: item.command,
      command: item.command
    })),
    {
      placeHolder: 'Selecciona un comando para ejecutar'
    }
  );

  if (!selection) {
    return;
  }

  const terminal = getOrCreateDevBuddyTerminal();
  terminal.show(true);
  terminal.sendText(selection.command, true);
}

export async function runCustomCommandByIndex(index: number): Promise<void> {
  const commands = readCustomCommands();
  const selected = commands[index];

  if (!selected) {
    vscode.window.showWarningMessage('El comando seleccionado ya no existe. Refresca el panel.');
    return;
  }

  const terminal = getOrCreateDevBuddyTerminal();
  terminal.show(true);
  terminal.sendText(selected.command, true);
}

export async function createCustomCommand(): Promise<void> {
  const name = (await vscode.window.showInputBox({
    prompt: 'Nombre del comando personalizado',
    placeHolder: 'Ejemplo: Levantar backend',
    ignoreFocusOut: true
  }))?.trim();

  if (!name) {
    return;
  }

  const command = (await vscode.window.showInputBox({
    prompt: 'Comando a ejecutar en terminal',
    placeHolder: 'Ejemplo: npm run dev',
    ignoreFocusOut: true
  }))?.trim();

  if (!command) {
    return;
  }

  const target = await pickConfigurationTarget();
  if (!target) {
    return;
  }

  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const updatedCommands = [...readCustomCommands(), { name, command }];

  await config.update(CONFIG_KEY, updatedCommands, target);
  vscode.window.showInformationMessage(`Comando guardado: ${name}`);
}

export async function createCustomCommandInline(rawName?: string, rawCommand?: string): Promise<void> {
  const name = (rawName ?? '').trim();
  const command = (rawCommand ?? '').trim();

  if (!name || !command) {
    vscode.window.showWarningMessage('Completa nombre y comando para crear el item.');
    return;
  }

  const target = resolvePreferredConfigurationTarget();
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const updatedCommands = [...readCustomCommands(), { name, command }];

  await config.update(CONFIG_KEY, updatedCommands, target);
  vscode.window.showInformationMessage(`Comando guardado: ${name}`);
}

export async function updateCustomCommandByIndex(index: number, rawName?: string, rawCommand?: string): Promise<void> {
  const commands = readCustomCommands();
  const selected = commands[index];

  if (!selected) {
    vscode.window.showWarningMessage('El comando seleccionado ya no existe. Refresca el panel.');
    return;
  }

  const name = (rawName ?? '').trim();
  const command = (rawCommand ?? '').trim();

  if (!name || !command) {
    vscode.window.showWarningMessage('Nombre y comando son obligatorios para actualizar.');
    return;
  }

  commands[index] = { name, command };

  const target = resolvePreferredConfigurationTarget();
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  await config.update(CONFIG_KEY, commands, target);
  vscode.window.showInformationMessage(`Comando actualizado: ${name}`);
}

export async function deleteCustomCommandByIndex(index: number): Promise<void> {
  const commands = readCustomCommands();
  const selected = commands[index];

  if (!selected) {
    vscode.window.showWarningMessage('El comando seleccionado ya no existe. Refresca el panel.');
    return;
  }

  commands.splice(index, 1);

  const target = resolvePreferredConfigurationTarget();
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  await config.update(CONFIG_KEY, commands, target);
  vscode.window.showInformationMessage(`Comando eliminado: ${selected.name}`);
}

export async function listCustomCommands(): Promise<void> {
  const commands = readCustomCommands();

  if (commands.length === 0) {
    vscode.window.showInformationMessage(
      'No hay comandos configurados. Usa "DevBuddy: Crear comando personalizado" para agregar uno.'
    );
    return;
  }

  const content = [
    '# Comandos personalizados',
    '',
    ...commands.flatMap((item, index) => [`${index + 1}. ${item.name}`, `   ${item.command}`, ''])
  ].join('\n');

  const doc = await vscode.workspace.openTextDocument({
    language: 'markdown',
    content
  });

  await vscode.window.showTextDocument(doc, { preview: true });
}

export async function exportCustomCommands(): Promise<void> {
  const commands = readCustomCommands();

  const destination = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file('devbuddy-commands.json'),
    filters: {
      JSON: ['json']
    },
    saveLabel: 'Exportar comandos'
  });

  if (!destination) {
    return;
  }

  const content = JSON.stringify(commands, null, 2);
  await vscode.workspace.fs.writeFile(destination, Buffer.from(content, 'utf8'));
  vscode.window.showInformationMessage(`Comandos exportados: ${destination.fsPath}`);
}

export async function importCustomCommands(): Promise<void> {
  const selectedFiles = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters: {
      JSON: ['json']
    },
    openLabel: 'Importar comandos'
  });

  const fileUri = selectedFiles?.[0];
  if (!fileUri) {
    return;
  }

  const rawContent = await vscode.workspace.fs.readFile(fileUri);
  const parsed = JSON.parse(Buffer.from(rawContent).toString('utf8')) as unknown;
  const importedCommands = normalizeCustomCommands(parsed);

  if (importedCommands.length === 0) {
    vscode.window.showWarningMessage('El archivo no contiene comandos validos para importar.');
    return;
  }

  const mode = await vscode.window.showQuickPick(
    [
      {
        label: 'Reemplazar',
        detail: 'Sustituye la lista actual por la importada.',
        value: 'replace'
      },
      {
        label: 'Combinar',
        detail: 'Agrega los comandos importados y evita duplicados exactos.',
        value: 'merge'
      }
    ],
    {
      placeHolder: 'Como quieres importar los comandos'
    }
  );

  if (!mode) {
    return;
  }

  const target = resolvePreferredConfigurationTarget();
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const nextCommands =
    mode.value === 'replace'
      ? importedCommands
      : dedupeCommands([...readCustomCommands(), ...importedCommands]);

  await config.update(CONFIG_KEY, nextCommands, target);
  vscode.window.showInformationMessage(`Comandos importados: ${importedCommands.length}`);
}

export function readCustomCommands(): CustomCommand[] {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const value = config.get<unknown[]>(CONFIG_KEY, []);

  return normalizeCustomCommands(value);
}

function normalizeCustomCommands(value: unknown): CustomCommand[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is CustomCommand => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const candidate = item as Partial<CustomCommand>;
      return typeof candidate.name === 'string' && typeof candidate.command === 'string';
    })
    .map((item) => ({
      name: item.name.trim(),
      command: item.command.trim()
    }))
    .filter((item) => item.name.length > 0 && item.command.length > 0);
}

function dedupeCommands(commands: CustomCommand[]): CustomCommand[] {
  const seen = new Set<string>();

  return commands.filter((item) => {
    const key = `${item.name}\u0000${item.command}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function pickConfigurationTarget(): Promise<vscode.ConfigurationTarget | undefined> {
  const options: Array<{
    label: string;
    detail: string;
    target: vscode.ConfigurationTarget;
  }> = [
    {
      label: 'Usuario',
      detail: 'Disponible en todos los workspaces.',
      target: vscode.ConfigurationTarget.Global
    }
  ];

  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    options.unshift({
      label: 'Workspace',
      detail: 'Solo disponible en el workspace actual.',
      target: vscode.ConfigurationTarget.Workspace
    });
  }

  const picked = await vscode.window.showQuickPick(options, {
    placeHolder: 'Donde deseas guardar el comando personalizado'
  });

  return picked?.target;
}

function resolvePreferredConfigurationTarget(): vscode.ConfigurationTarget {
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    return vscode.ConfigurationTarget.Workspace;
  }

  return vscode.ConfigurationTarget.Global;
}