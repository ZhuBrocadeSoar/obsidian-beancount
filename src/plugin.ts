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

export type InstructionType = 'txn' | 'balance' | 'price';

export interface Transaction {
  file?: string;
  date?: string;
  payee?: string;
  description?: string;
  flow?: Array<TransactionFlow>;
  inst?: InstructionType; // 指令类型：普通交易、balance 对账 或 price 价格
}

export interface IObsidianBeancountSettings {
  main: string;
  lastTransaction?: Transaction;
  template?: string; // 模板文件路径
}
