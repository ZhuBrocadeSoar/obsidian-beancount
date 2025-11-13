import { Notice, Plugin, TFile } from 'obsidian';
import { parseBeancountMain } from './parser/parse-bean-count-main';
import {
  IObsidianBeancountPlugin,
  IObsidianBeancountSettings,
  TransactionFlow,
  Transaction,
} from './plugin';
import { ObsidianBeancountSettingsTab } from './setting';
import { TransactionModal } from './transaction-modal';

export class ObsidianBeancountPlugin
  extends Plugin
  implements IObsidianBeancountPlugin
{
  settings: IObsidianBeancountSettings = {
    main: 'main.bean',
  };

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new ObsidianBeancountSettingsTab(this.app, this));
    this.addRibbonIcon('dollar-sign', 'Save transaction', async () => {
      try {
        const data = await parseBeancountMain(
          this.settings.main,
          this.readFile
        );
        new TransactionModal(
          this.app,
          data,
          this.settings.lastTransaction || {},
          this.doSave
        ).open();
      } catch (error) {
        new Notice('Error: ' + error);
      }
    });
  }

  private readFile = async (name: string) => {
    const file = this.app.vault.getAbstractFileByPath(name);
    if (file instanceof TFile) {
      return await this.app.vault.read(file);
    }
    return null;
  };

  private doSave = async (transaction: Transaction): Promise<void> => {
    const { file, date, payee, description, flow } = transaction;
    console.log(transaction)

    if (!file) {
      throw new Error('File is required');
    }
    const fileToSave = this.app.vault.getAbstractFileByPath(file);

    if (!date) {
      throw new Error('Date is required');
    }
    // if (!amount) {
    //   throw new Error('Amount is required');
    // }
    // if (isNaN(parseFloat(amount))) {
    //   throw new Error('Amount is not a number');
    // }
    // if (!currency) {
    //   throw new Error('Currency is required');
    // }
    // if (!from) {
    //   throw new Error('From account is required');
    // }
    // if (!to) {
    //   throw new Error('To account is required');
    // }
    let message = `"${description}"`;
    if (payee) {
      message = `"${payee}" "${description}"`;
    }
    // const res = `
    // ${date} * ${message}          
    //   ${from} ${-parseFloat(amount).toFixed(2)} ${currency}
    //   ${to} ${parseFloat(amount).toFixed(2)} ${currency}
    //           `.trim();
    let flowList: Array<TransactionFlow> = flow || []
    if (flowList.length < 2) {
      throw new Error('Two of line is required');
    }
    let countAccount = 0;
    let countAmount = 0;
    for (let i = 0; i < flowList.length; i++) {
      let flow = flowList[i];
      if (flow.account !== undefined && flow.account !== '') {
        countAccount += 1;
      }
      if (flow.amount !== undefined  && !isNaN(parseFloat(flow.amount))) {
        if (flow.currency === undefined || flow.currency === '') {
          throw new Error('Currency is required');
        }
        countAmount += 1;
      }
    }
    // console.log(`countAccount=${countAccount}, flowList.length=${flowList.length}`);
    if (countAccount !== flowList.length) {
      throw new Error('Account is required for every line');
    }
    if (countAmount < flowList.length - 1) {
      throw new Error('Amount is required');
    }
    // 找到最长的账户名长度，用于对齐金额
    let maxAccountLength = 0;
    for (let i = 0; i < flowList.length; i++) {
      let flow = flowList[i];
      if (flow.account && flow.account.length > maxAccountLength) {
        maxAccountLength = flow.account.length;
      }
    }
    
    let list = '';
    for (let i = 0; i < flowList.length; i++) {
      let flow = flowList[i];
      let cost = '';
      if (flow.cost !== undefined && !isNaN(parseFloat(flow.cost))) {
        if (flow.costCurrency === undefined || flow.costCurrency === '') {
          throw new Error('Currency for cost part is required');
        }
        cost = `{ ${flow.cost} ${flow.costCurrency} }`;
      }
      let conv = '';
      if (flow.convMark !== undefined && flow.convMark !== '') {
        if (flow.convMark !== '@' && flow.convMark !== '@@') {
          throw new Error('Invalid conversion mark, use `@` or `@@`');
        }
        if (flow.convAmount === undefined || isNaN(parseFloat(flow.convAmount))) {
          throw new Error('Conversion amount is required');
        }
        if (flow.convCurrency === undefined || flow.convCurrency === '') {
          throw new Error('Conversion Currency is required');
        }
        conv = `${flow.convMark} ${flow.convAmount} ${flow.convCurrency}`;
      }
      // 使用 padEnd 对齐账户名，使金额列对齐
      const paddedAccount = (flow.account || '').padEnd(maxAccountLength);
      list += `      ${paddedAccount}  ${flow.amount || ''} ${flow.currency || ''} ${cost} ${conv}\n`;
    }
    
    const res = `
${date} * ${message}
${list}`.trim();
    if (fileToSave instanceof TFile) {
      const old = await this.app.vault.read(fileToSave);
      await this.app.vault.modify(fileToSave, old + '\n' + res);
      await this.updateSetting('lastTransaction', transaction);
      new Notice('Transaction saved');
    } else {
      throw new Error(`File ${file} is not file type`);
    }
  };

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, this.settings, await super.loadData());
  }

  async updateSetting(key: keyof IObsidianBeancountSettings, value: any) {
    this.settings[key] = value;
    await this.saveSettings();
  }

  async saveSettings(): Promise<void> {
    await super.saveData(this.settings);
  }
}

export default ObsidianBeancountPlugin;
