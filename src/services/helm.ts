import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

export async function createHelmYaml(resource?: vscode.Uri): Promise<void> {
  try {
    let gitCwd: string;
    let helmDir: string;

    if (resource && path.basename(resource.fsPath) === '.helm') {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(resource);
      if (!workspaceFolder) {
        vscode.window.showWarningMessage('La carpeta .helm seleccionada no pertenece a un workspace abierto.');
        return;
      }

      gitCwd = workspaceFolder.uri.fsPath;
      helmDir = resource.fsPath;
    } else {
      const folder = await getWorkspaceFolder();
      if (!folder) {
        vscode.window.showWarningMessage('No hay carpeta de trabajo abierta.');
        return;
      }

      gitCwd = folder.uri.fsPath;
      helmDir = path.join(folder.uri.fsPath, '.helm');
    }

    const rawBranch = await getCurrentBranch(gitCwd);
    const branchName = sanitizeBranchName(rawBranch);

    if (!branchName) {
      vscode.window.showErrorMessage('No se pudo construir un nombre valido a partir de la rama actual.');
      return;
    }

    const filePath = path.join(helmDir, `${branchName}-environment.yaml`);

    await fs.mkdir(helmDir, { recursive: true });

    if (await exists(filePath)) {
      const choice = await vscode.window.showWarningMessage(
        `El archivo ya existe: ${filePath}`,
        'Sobrescribir',
        'Abrir existente',
        'Cancelar'
      );

      if (choice === 'Abrir existente') {
        const existingDoc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(existingDoc);
      }

      if (choice !== 'Sobrescribir') {
        return;
      }
    }

    const yamlTemplate = await buildHelmYamlTemplate(gitCwd);
    await fs.writeFile(filePath, yamlTemplate, 'utf8');

    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(`YAML creado en .helm: ${path.basename(filePath)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`No se pudo crear el YAML en .helm. ${message}`);
  }
}

async function getWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const folders = vscode.workspace.workspaceFolders;

  if (!folders || folders.length === 0) {
    return undefined;
  }

  if (folders.length === 1) {
    return folders[0];
  }

  const picked = await vscode.window.showQuickPick(
    folders.map((folder) => ({
      label: folder.name,
      description: folder.uri.fsPath,
      folder
    })),
    {
      placeHolder: 'Selecciona el workspace donde se ejecutara el comando'
    }
  );

  return picked?.folder;
}

async function getCurrentBranch(cwd: string): Promise<string> {
  const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd });
  const branch = stdout.trim();

  if (!branch || branch === 'HEAD') {
    throw new Error('No se detecto una rama de Git activa.');
  }

  return branch;
}

function sanitizeBranchName(branch: string): string {
  return branch
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function buildHelmYamlTemplate(workspaceRoot: string): Promise<string> {
  const examplePath = path.join(workspaceRoot, 'custom-environment.yaml.example');

  if (await exists(examplePath)) {
    return fs.readFile(examplePath, 'utf8');
  }

  return ['# Archivo generado automaticamente por DevBuddy', ''].join('\n');
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}