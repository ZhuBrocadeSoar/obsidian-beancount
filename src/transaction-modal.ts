import { App, Modal, Notice, Setting, TextComponent } from 'obsidian';
import { ParseResult } from './parser/parse-bean-count-main';
import { TransactionFlow, Transaction, InstructionType } from './plugin';
import { OptionSuggestModal } from './suggest-modal';

interface TemplateDef {
  name: string;
  enabled: boolean;
  type: InstructionType;
  body: string;
}

export class TransactionModal extends Modal {
  private showCostConvert: boolean = false;
  constructor(
    app: App,
    private parseResult: ParseResult,
    private data: Transaction,
    private onSave: (data: Transaction) => Promise<void>,
    private readFile: (name: string) => Promise<string | null>,
    private templatePath: string,
  ) {
    super(app);
  }

  onOpen() {
    let { contentEl, modalEl } = this;
    contentEl.empty();
    modalEl.style.width = '1000px';

    // 默认指令类型：普通交易
    if (!this.data['inst']) {
      this.data['inst'] = 'txn';
    }

    this.createTitle();
    this.createInstTypeRow();
    this.createFileRow();
    this.createInstRow();
    this.createFlowList();
    this.createFunBtns();

  }

  /**
   * 指令类型切换：普通交易(*) / balance
   */
  private createInstTypeRow() {
    let { contentEl } = this;
    const row = contentEl.createDiv({
      attr: {
        id: 'tm-inst-type-row',
        style: 'margin-bottom: 8px;',
      },
    });
    row.createSpan({ text: 'Instruction: ' });

    const txnBtn = row.createEl('button', { text: '*' });
    const balBtn = row.createEl('button', { text: 'balance' });
    const tipSpan = row.createSpan({
      text: '',
      attr: {
        style: 'margin-left: 8px; font-size: 0.9em; color: var(--text-muted);',
      },
    });

    const updateUI = () => {
      const type = this.data['inst'] || 'txn';
      if (type === 'balance') {
        txnBtn.removeClass('mod-cta');
        balBtn.addClass('mod-cta');
        tipSpan.setText('balance：填写每行的 Account / Amount / Currency。每行代表一个账户的余额。');
      } else {
        balBtn.removeClass('mod-cta');
        txnBtn.addClass('mod-cta');
        tipSpan.setText('普通交易：支持多行借贷。');
      }
    };

    txnBtn.addEventListener('click', () => {
      this.data['inst'] = 'txn';
      updateUI();
    });
    balBtn.addEventListener('click', () => {
      this.data['inst'] = 'balance';
      updateUI();
    });

    updateUI();
  }

  private createTitle() {
    let { contentEl } = this;
    contentEl.createEl('h1', {
      attr: {
        id: 'tm-title',
      },
      text: 'New transaction',
    });
  }

  private createFileRow() {
    let { contentEl } = this;
    const fileRow = contentEl.createDiv({
      attr: {
        id: 'tm-file-row',
      },
    });
    // 标签
    fileRow.createEl('label', { text: 'Beancount File' });
    // 输入框
    const input = fileRow.createEl('input', {
      type: 'text',
      placeholder: 'Where to save the transaction',
      value: this.data['file'] || '',
      attr: {
        size: '49'
      },
    });
    this.bindInputChg({input, key: 'file'});
    // 查询按扭
    const btn = fileRow.createEl('button', { text: '...' });
    this.bindSearchBtn({
      btn,
      key: 'file',
      values: this.parseResult.files,
      input,
    });
  }

  /**
   * Row of
   * Date Payee Despcription
   */
  private createInstRow() {
    let { contentEl } = this;
    const instRow = contentEl.createDiv({
      attr: {
        id: 'tm-inst-row',
      },
    });
    // 日期输入框
    if (!this.data['date']) {
      this.data['date'] = getCurrentDate();
    }
    const dateInput = instRow.createEl('input', {
      type: 'date',
      value: this.data['date'],
      attr: {
        size: '10',
      },
    });
    this.bindInputChg({input: dateInput, key: 'date'});
    // 收款人输入框
    const payeeInput = instRow.createEl('input', {
      type: 'text',
      placeholder: 'Payee',
      value: this.data['payee'],
      attr: {
      },
    });
    this.bindInputChg({input: payeeInput, key: 'payee'});
    // 描述输入框
    const despInput = instRow.createEl('input', {
      type: 'text',
      placeholder: 'Description',
      value: this.data['description'],
      attr: {
        size: '30'
      },
    });
    this.bindInputChg({input: despInput, key: 'description'});
  }

  private createFlowList() {
    let { contentEl } = this;
    let flNode: HTMLElement;

    const ctrlRow = contentEl.createDiv({
      attr: {
        id: 'tm-flow-ctrl-row',
        style: 'padding-left: 30px; margin-bottom: 4px;',
      },
    });
    const toggleBtn = ctrlRow.createEl('button', {
      text: this.showCostConvert ? 'Hide Cost/Convert' : 'Show Cost/Convert',
    });
    toggleBtn.addEventListener('click', () => {
      this.showCostConvert = !this.showCostConvert;
      toggleBtn.setText(this.showCostConvert ? 'Hide Cost/Convert' : 'Show Cost/Convert');
      this.redraw(flNode);
    });

    flNode = contentEl.createDiv({
      attr: {
        id: 'tm-flow-list',
        style: 'padding-left: 30px',
      },
    });
    this.redraw(flNode);
  }

  private redraw(box: HTMLElement) {
    box.empty();
    let flowList: Array<TransactionFlow> = this.data['flow'] || [];
    if (flowList.length === 1) {
      flowList.push({});
    } else if (flowList.length === 0) {
      flowList.push({});
      flowList.push({});
    }
    this.data['flow'] = flowList;
    for (let index = 0; index < flowList.length; index++) {
      this.createFlowRow({box, index});
    }
  }

  private createFlowRow(arg: {
    box: HTMLElement,
    index: number;
  }) {
    let flowList: Array<TransactionFlow> = this.data['flow'] || [];
    const flowRow = arg.box.createDiv({
      attr: {
        id: `tm-flow-list-row-${arg.index}`,
        style: 'overflow-x: auto; white-space: nowrap; margin-bottom: 4px;',
      },
    });
    // Account输入框
    const accountInput = flowRow.createEl('input', {
      type: 'text',
      placeholder: 'Account',
      value: flowList[arg.index].account,
      attr: {
        size: '40',
      },
    });
    this.bindInputChgFLV({
      input: accountInput,
      index: arg.index,
      key: 'account',
    });
    // Account查询按扭
    const accountSelectBtn = flowRow.createEl('button', {text: '...'});
    this.bindSearchBtnFLV({
      btn: accountSelectBtn,
      index: arg.index,
      key: 'account',
      values: this.parseResult.accounts,
      input: accountInput,
    });
    // Amount输入框
    const amountInput = flowRow.createEl('input', {
      type: 'text',
      placeholder: 'Amount',
      value: flowList[arg.index].amount,
      attr: {
        size: '7',
      },
    });
    this.bindInputChgFLV({
      input: amountInput,
      index: arg.index,
      key: 'amount',
    });
    // Currency输入框
    const currencyInput = flowRow.createEl('input', {
      type: 'text',
      placeholder: 'Currency',
      value: flowList[arg.index].currency,
      attr: {
        size: '5',
      },
    });
    this.bindInputChgFLV({
      input: currencyInput,
      index: arg.index,
      key: 'currency'
    });
    // Currency查询按扭
    const currencySelectBtn = flowRow.createEl('button', {text: '...'});
    this.bindSearchBtnFLV({
      btn: currencySelectBtn,
      index: arg.index,
      key: 'currency',
      values: this.parseResult.currency,
      input: currencyInput,
    });
    if (this.showCostConvert) {
      // Cost输入框
      const costInput = flowRow.createEl('input', {
        type: 'text',
        placeholder: 'Cost',
        value: flowList[arg.index].cost,
        attr: {
          size: '7',
        },
      });
      this.bindInputChgFLV({
        input: costInput,
        index: arg.index,
        key: 'cost',
      });
      // Cost Currency输入框
      const costCurInput = flowRow.createEl('input', {
        type: 'text',
        placeholder: 'CostCur',
        value: flowList[arg.index].costCurrency,
        attr: {
          size: '5',
        },
      });
      this.bindInputChgFLV({
        input: costCurInput,
        index: arg.index,
        key: 'costCurrency',
      });
      // Cost Currency查询按扭
      const costCurSelectBtn = flowRow.createEl('button', {text: '...'});
      this.bindInputChgFLV({
        input: costCurInput,
        index: arg.index,
        key: 'costCurrency',
      });
      this.bindSearchBtnFLV({
        btn: costCurSelectBtn,
        index: arg.index,
        key: 'costCurrency',
        values: this.parseResult.currency,
        input: costCurInput,
      });
      // Conv Mark输入框
      const cnvMrkInput = flowRow.createEl('input', {
        type: 'text',
        placeholder: '@/@@',
        value: flowList[arg.index].convMark,
        attr: {
          size: '3',
        },
      });
      this.bindInputChgFLV({
        input: cnvMrkInput,
        index: arg.index,
        key: 'convMark',
      });
      // Conv Mark选择按扭
      const cnvMrkSelectBtn = flowRow.createEl('button', {text: '...'});
      this.bindSearchBtnFLV({
        btn: cnvMrkSelectBtn,
        index: arg.index,
        key: 'convMark',
        values: ['', '@', '@@'],
        input: cnvMrkInput,
      });
      // Conv Amount输入框
      const cnvAmtInput = flowRow.createEl('input', {
        type: 'text',
        placeholder: 'CnvAmt',
        value: flowList[arg.index].convAmount,
        attr: {
          size: '7',
        },
      });
      this.bindInputChgFLV({
        input: cnvAmtInput,
        index: arg.index,
        key: 'convAmount',
      });
      // Conv Currency输入框
      const cnvCurInput = flowRow.createEl('input', {
        type: 'text',
        placeholder: 'CnvCur',
        value: flowList[arg.index].convCurrency,
        attr: {
          size: '5',
        },
      });
      this.bindInputChgFLV({
        input: cnvCurInput,
        index: arg.index,
        key: 'convCurrency',
      });
      // Conv Currency查询按扭
      const cnvCurSelectBtn = flowRow.createEl('button', {text: '...'});
      this.bindSearchBtnFLV({
        btn:cnvCurSelectBtn,
        index: arg.index,
        key: 'convCurrency',
        values: this.parseResult.currency,
        input: cnvCurInput,
      });
    }
    // 删除按扭
    if (arg.index >= 2) {
      const deleteBtn = flowRow.createEl('button', {text: 'Delete'});
      deleteBtn.addEventListener('click', () => {
        this.data['flow'] = flowList.filter((item, ii) => ii !== (arg.index - 1));
        this.redraw(arg.box);
      });
    }
  }

  /**
   * Add Btn、Submit Btn
  */
  private createFunBtns() {
    let { contentEl } = this;
    const flNode = contentEl.find('#tm-flow-list');
    const funBtnsRow = contentEl.createDiv({
      attr: {
        id: 'tm-fun-btns'
      }
    });
    // 模板按扭
    const tmplBtn = funBtnsRow.createEl('button', { text: 'Template' });
    tmplBtn.addEventListener('click', () => {
      this.openTemplateSelect();
    });
    // 增加行按扭
    const addLineBtn = funBtnsRow.createEl('button', {text: 'Add a line'});
    addLineBtn.addEventListener('click', () => {
      this.data['flow']?.push({});
      this.redraw(flNode);
    });
    // 提交 按扭
    const submitBtn = funBtnsRow.createEl('button', {text: 'Submit'});
    submitBtn.addEventListener('click', () => {
      this.submit();
    });
  }

  /**
   * 模板选择入口
   */
  private async openTemplateSelect() {
    if (!this.templatePath) {
      new Notice('Template file is not set. Please set it in plugin settings.');
      return;
    }
    let content: string | null;
    try {
      content = await this.readFile(this.templatePath);
    } catch (e) {
      console.error(e);
      new Notice('Failed to read template file.');
      return;
    }
    if (!content) {
      new Notice('Template file is empty or cannot be read.');
      return;
    }
    const templates = parseTemplates(content).filter((t) => t.enabled);
    if (templates.length === 0) {
      new Notice('No enabled templates found in template file.');
      return;
    }
    new OptionSuggestModal(
      this.app,
      templates.map((t, idx) => ({
        label: t.name,
        value: String(idx),
      })),
      (select) => {
        const idx = Number(select.value);
        if (!isNaN(idx) && templates[idx]) {
          this.applyTemplate(templates[idx]);
        }
      },
    ).open();
  }

  private applyTemplate(tmpl: TemplateDef) {
    if (tmpl.type === 'balance') {
      this.data['inst'] = 'balance';
      const lines = tmpl.body.split('\n');
      const flows: Array<TransactionFlow> = [];
      for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith(';')) continue;
        const m = line.match(/^\s*(\d{4}-\d{2}-\d{2})\s+balance\s+(\S+)\s+([+-]?\d+(?:\.\d+)?)\s+(\S+)/);
        if (!m) {
          continue;
        }
        const account = m[2];
        const amount = m[3];
        const currency = m[4];
        flows.push({ account, amount, currency });
      }
      if (flows.length === 0) {
        new Notice('Invalid balance template: no valid balance lines.');
        return;
      }
      this.data['flow'] = flows;
    } else {
      // 普通交易模板
      this.data['inst'] = 'txn';
      const lines = tmpl.body.split('\n');
      const header = lines.find((l) => l.trim() && !l.trim().startsWith(';'));
      if (!header) {
        new Notice('Invalid transaction template: header is empty.');
        return;
      }
      const hm = header.match(/^\s*(\d{4}-\d{2}-\d{2})\s+\*\s+(.+)$/);
      if (!hm) {
        new Notice('Invalid transaction template header.');
        return;
      }
      const meta = hm[2];
      let payee = '';
      let description = '';
      const m2 = meta.match(/"([^"]*)"\s+"([^"]*)"/);
      if (m2) {
        payee = m2[1];
        description = m2[2];
      } else {
        const m3 = meta.match(/"([^"]*)"/);
        if (m3) {
          description = m3[1];
        } else {
          description = meta.trim();
        }
      }
      this.data['payee'] = payee;
      this.data['description'] = description;
      // 流水行
      const flows: Array<TransactionFlow> = [];
      for (let i = 1; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.trim();
        if (!line || line.startsWith(';')) continue;
        const parts = line.split(/\s+/);
        if (parts.length === 0) continue;
        const account = parts[0];
        const amount = parts[1];
        const currency = parts[2];
        const flow: TransactionFlow = { account };
        if (amount !== undefined) {
          flow.amount = amount;
        }
        if (currency !== undefined) {
          flow.currency = currency;
        }
        flows.push(flow);
      }
      if (flows.length > 0) {
        this.data['flow'] = flows;
      }
    }
    // 重新渲染整个窗口
    this.onOpen();
  }

  private submit() {
    this.onSave(this.data)
      .then(() => {
        this.close();
      })
      .catch((err) => {
        new Notice(err.message);
      });
      this.close();
  }

  /**
   * Rewrite string into this.data when changed
  */
  private bindInputChg(arg: {
    input: HTMLInputElement;
    key: string;
  }) {
    arg.input.addEventListener('change', () => {
      this.data[arg.key] = arg.input.value;
    });
  }

  /**
   * Rewrite string into this.data when changed, flow list version
  */
  private bindInputChgFLV(arg: {
    input: HTMLInputElement;
    index: number;
    key: string;
  }) {
    arg.input.addEventListener('change', () => {
      let flowList: Array<TransactionFlow> = this.data['flow'] || [];
      flowList[arg.index][arg.key] = arg.input.value;
      this.data['flow'] = flowList;
    });
  }

  /**
   * Binding click event to the button
  */
  private bindSearchBtn(arg: {
    btn: HTMLElement;
    key: string;
    values: string[];
    input: HTMLInputElement;
  }) {
    arg.btn.addEventListener('click', () => {
      new OptionSuggestModal(
        this.app,
        arg.values.map((v) => ({ label: v, value: v})),
        (select) => {
          arg.input.value = select.value;
          this.data[arg.key] = select.value;
        },
      ).open();
    });
  }

  /**
   * Binding click event to button, flow list version
  */
  private bindSearchBtnFLV(arg: {
    btn: HTMLElement;
    index: number;
    key: string;
    values: string[];
    input: HTMLInputElement;
  }) {
    arg.btn.addEventListener('click', () => {
      new OptionSuggestModal(
        this.app,
        arg.values.map((v) => ({ label: v, value: v})),
        (select) => {
          arg.input.value = select.value;
          let flowList: Array<TransactionFlow> = this.data['flow'] || [];
          flowList[arg.index][arg.key] = arg.input.value;
          this.data['flow'] = flowList;
        },
      ).open();
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}

function getCurrentDate() {
  let currentDate = new Date();

  let year = currentDate.getFullYear();

  let month = (currentDate.getMonth() + 1).toString().padStart(2, '0');

  let day = currentDate.getDate().toString().padStart(2, '0');

  let formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

/**
 * 解析模板文件
 * 模板头格式示例（以分号开头的注释行）：
 * ; template name=日常支出 enabled=true type=txn
 * ; template name=期末余额 enabled=1 type=balance
 * 模板体：紧随其后的若干行 Beancount 片段，直到下一个模板头或文件结束
 */
function parseTemplates(content: string): TemplateDef[] {
  const lines = content.split(/\r?\n/);
  const result: TemplateDef[] = [];
  let current: TemplateDef | null = null;
  for (const raw of lines) {
    const line = raw;
    const m = line.match(/^\s*;+\s*template\s+(.*)$/i);
    if (m) {
      // 先推入上一个
      if (current) {
        current.body = current.body.trimEnd();
        result.push(current);
      }
      const meta = m[1];
      const fields: Record<string, string> = {};
      meta.split(/\s+/).forEach((pair) => {
        const [k, v] = pair.split('=');
        if (k && v !== undefined) {
          fields[k.trim().toLowerCase()] = v.trim();
        }
      });
      const name = fields['name'] || 'Unnamed template';
      const enabledRaw = (fields['enabled'] || 'true').toLowerCase();
      const enabled = !['0', 'false', 'no', 'off'].includes(enabledRaw);
      const typeRaw = (fields['type'] || 'txn').toLowerCase();
      const type: InstructionType = typeRaw === 'balance' ? 'balance' : 'txn';
      current = {
        name,
        enabled,
        type,
        body: '',
      };
    } else if (current) {
      current.body += line + '\n';
    }
  }
  if (current) {
    current.body = current.body.trimEnd();
    result.push(current);
  }
  return result;
}
