import * as vscode from 'vscode';

const DEV_BUDDY_TERMINAL_NAME = 'DevBuddy';

export function getOrCreateDevBuddyTerminal(): vscode.Terminal {
  const existing = vscode.window.terminals.find((terminal) => terminal.name === DEV_BUDDY_TERMINAL_NAME);
  if (existing) {
    return existing;
  }

  return vscode.window.createTerminal(DEV_BUDDY_TERMINAL_NAME);
}