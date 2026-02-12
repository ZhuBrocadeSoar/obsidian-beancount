# obsidian-beancount

forked from [hamsterbase/obsidian-beancount](https://github.com/hamsterbase/obsidian-beancount)
[Buy coffee for hamsterbase](https://www.buymeacoffee.com/hamsterbase)

Use Obsidian on the phone for saving transaction to Beancount file.

Supports parsing Beancount files, retrieving Account, Commodity, Payee.

## How to install

1. You need to first install the BRAT plugin for Obsidian.
2. Open Community Plugins and turn on the BRAT plugin.
3. Open the settings for the BRAT plugin.
4. Click on "Add Beta Plugin" and enter `https://github.com/ZhuBrocadeSoar/obsidian-beancount`
5. Click on "Add plugin" to install the plugin.

## How to use

1. Enter the main entry address of Beancount in settings, and the plugin will automatically handle includes.

e.g. `main.bean`

2. Click wallet icon to open transaction modal

### Transaction modal

- Date field uses system `date` picker, defaulting to today when opening.
- You can choose instruction type:
  - `*` (txn): normal transaction, supports multiple posting lines.
  - `balance`: write one or multiple `balance` lines at once. Each non-empty row with `Account / Amount / Currency` will become a `YYYY-MM-DD balance ...` line when saving.

### Template file

1. In plugin settings, set **Template File** path. It should be a Beancount-style text file.
2. In the template file, define templates using comment headers:

```text
; template name=Daily Expense enabled=true type=txn
2026-01-01 * "Coffee Shop" "Coffee"
  Assets:Cash       -20 CNY
  Expenses:Food      20 CNY

; template name=Bank Balances enabled=1 type=balance
2026-02-12 balance Assets:Bank:Card 1000 CNY
2026-02-12 balance Assets:Cash       200 CNY
```

- Header line format:
  - Starts with `; template`
  - Supports fields: `name`, `enabled` (`true/false/1/0`), `type` (`txn` or `balance`)
- Body:
  - For `type=txn`: a normal `*` transaction (header + postings).
  - For `type=balance`: one or more `balance` lines.
  - Disabled templates (`enabled=false/0`) are ignored.

3. In the transaction modal, click **Template** button to:
   - Parse enabled templates from the template file.
   - Choose one template.
   - Auto-fill the form:
     - `txn` template: fills payee/description and postings.
     - `balance` template: fills one or multiple balance rows.

# why fork

fix some error for my using

# TODO

- [x] 支持一条交易记录多个帐户
- [x] 表单优化：日期选择器
- [x] 支持`balance`指令
- [x] 模板功能
