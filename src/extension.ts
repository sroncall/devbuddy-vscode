import * as vscode from 'vscode';
import {
  createCustomCommand,
  listCustomCommands,
  readCustomCommands,
  runCustomCommand
} from './services/customCommands';
import { createHelmYaml } from './services/helm';
import { DevBuddySidebarViewProvider, openDashboard } from './ui/dashboard';

export function activate(context: vscode.ExtensionContext): void {
  const sidebarProvider = new DevBuddySidebarViewProvider(context.extensionUri);
  const sidebarViewDisposable = vscode.window.registerWebviewViewProvider(
    'devBuddySidebarView',
    sidebarProvider
  );

  const openDashboardDisposable = vscode.commands.registerCommand(
    'myCommandExtension.openDashboard',
    async () => {
      await openDashboard(context);
    }
  );

  const createHelmYamlDisposable = vscode.commands.registerCommand(
    'myCommandExtension.createHelmYaml',
    async (resource?: vscode.Uri) => {
      await createHelmYaml(resource);
    }
  );

  const runCustomCommandDisposable = vscode.commands.registerCommand(
    'myCommandExtension.runCustomCommand',
    async () => {
      await runCustomCommand();
    }
  );

  const createCustomCommandDisposable = vscode.commands.registerCommand(
    'myCommandExtension.createCustomCommand',
    async () => {
      await createCustomCommand();
    }
  );

  const listCustomCommandsDisposable = vscode.commands.registerCommand(
    'myCommandExtension.listCustomCommands',
    async () => {
      await listCustomCommands();
    }
  );

  context.subscriptions.push(
    sidebarViewDisposable,
    openDashboardDisposable,
    createHelmYamlDisposable,
    runCustomCommandDisposable,
    createCustomCommandDisposable,
    listCustomCommandsDisposable
  );

  const configurationChangeDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('myCommandExtension.customCommands')) {
      sidebarProvider.refresh();
    }
  });

  context.subscriptions.push(configurationChangeDisposable);
}

export function deactivate(): void {
  // No resources to dispose explicitly.
}
