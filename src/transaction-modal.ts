import { App, Modal, Notice, Setting, TextComponent } from 'obsidian';
import { ParseResult } from './parser/parse-bean-count-main';
import { TransactionFlow, Transaction } from './plugin';
import { OptionSuggestModal } from './suggest-modal';

export class TransactionModal extends Modal {
  constructor(
    app: App,
    private parseResult: ParseResult,
    private data: Transaction,
    private onSave: (data: Transaction) => Promise<void>,
  ) {
    super(app);
  }

  onOpen() {
    let { contentEl, modalEl } = this;
    contentEl.empty();
    modalEl.style.width = '1000px';

    this.createTitle();
    this.createFileRow();
    this.createInstRow();
    this.createFlowList();
    this.createFunBtns();

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
    this.data['date'] = getCurrentDate();
    const dateInput = instRow.createEl('input', {
      type: 'text',
      placeholder: 'YYYY-MM-DD',
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
    const flNode = contentEl.createDiv({
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
      },
    });
    // Account输入框
    const accountInput = flowRow.createEl('input', {
      type: 'text',
      placeholder: 'Account',
      value: flowList[arg.index].account,
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
