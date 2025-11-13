import { Plugin } from 'obsidian';

export interface IObsidianBeancountPlugin extends Plugin {
  readonly settings: IObsidianBeancountSettings;
  saveSettings(): Promise<void>;

  updateSetting(key: keyof IObsidianBeancountSettings, value: string): void;
}

export interface TransactionFlow {
  account?: string;
  amount?: string;
  currency?: string;
  cost?: string;
  costCurrency?: string;
  convMark?: '' | '@' | '@@';
  convAmount?: string;
  convCurrency?: string;
}

export interface Transaction {
  file?: string;
  date?: string;
  payee?: string;
  description?: string;
  flow?: Array<TransactionFlow>
}

export interface IObsidianBeancountSettings {
  main: string;
  lastTransaction?: Transaction;
}
