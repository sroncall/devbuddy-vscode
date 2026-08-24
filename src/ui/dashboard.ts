import * as vscode from 'vscode';
import {
  createCustomCommand,
  createCustomCommandInline,
  deleteCustomCommandByIndex,
  exportCustomCommands,
  importCustomCommands,
  listCustomCommands,
  readCustomCommands,
  runCustomCommandByIndex,
  updateCustomCommandByIndex
} from '../services/customCommands';
import { DashboardMessage } from '../types';
import { buildDashboardHtml } from './dashboardHtml';

export class DevBuddySidebarViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')]
    };

    this.refresh();

    view.webview.onDidReceiveMessage(async (message: DashboardMessage) => {
      await handleDashboardMessage(message, () => {
        this.refresh();
      });
    });
  }

  refresh(): void {
    if (!this.view) {
      return;
    }

    const iconUri = this.view.webview
      .asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'devbuddy.svg'))
      .toString();

    this.view.webview.html = buildDashboardHtml(readCustomCommands(), iconUri);
  }
}

export async function openDashboard(context: vscode.ExtensionContext): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    'devBuddyDashboard',
    '🧰 DevBuddy: Panel',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
      retainContextWhenHidden: true
    }
  );

  const render = (): void => {
    const iconUri = panel.webview
      .asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'devbuddy.svg'))
      .toString();

    panel.webview.html = buildDashboardHtml(readCustomCommands(), iconUri);
  };

  const messageDisposable = panel.webview.onDidReceiveMessage(async (message: DashboardMessage) => {
    await handleDashboardMessage(message, render);
  });

  panel.onDidDispose(() => {
    messageDisposable.dispose();
  });

  context.subscriptions.push(messageDisposable);
  render();
}

async function handleDashboardMessage(message: DashboardMessage, render: () => void): Promise<void> {
  if (message.type === 'create') {
    await createCustomCommand();
    render();
    return;
  }

  if (message.type === 'createInline') {
    await createCustomCommandInline(message.name, message.command);
    render();
    return;
  }

  if (message.type === 'run' && typeof message.index === 'number') {
    await runCustomCommandByIndex(message.index);
    return;
  }

  if (message.type === 'save' && typeof message.index === 'number') {
    await updateCustomCommandByIndex(message.index, message.name, message.command);
    render();
    return;
  }

  if (message.type === 'delete' && typeof message.index === 'number') {
    await deleteCustomCommandByIndex(message.index);
    render();
    return;
  }

  if (message.type === 'list') {
    await listCustomCommands();
    return;
  }

  if (message.type === 'export') {
    await exportCustomCommands();
    return;
  }

  if (message.type === 'import') {
    await importCustomCommands();
    render();
    return;
  }

  if (message.type === 'refresh') {
    render();
    return;
  }
}