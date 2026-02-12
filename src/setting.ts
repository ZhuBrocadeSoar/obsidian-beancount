import { IObsidianBeancountPlugin } from './plugin';
import { App, PluginSettingTab, Setting, Notice } from 'obsidian';

export class ObsidianBeancountSettingsTab extends PluginSettingTab {
  plugin: IObsidianBeancountPlugin;

  constructor(app: App, plugin: IObsidianBeancountPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    let { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName('Beancount Main')
      .setDesc('Beancount main file path')
      .addText((text) => {
        if (this.plugin.settings.main) {
          text.setValue(this.plugin.settings.main);
        }
        text.onChange(async (value) => {
          this.plugin.updateSetting('main', value);
        });
      });

    new Setting(containerEl)
      .setName('Template File')
      .setDesc('Beancount template file path, used for transaction templates')
      .addText((text) => {
        if (this.plugin.settings.template) {
          text.setValue(this.plugin.settings.template);
        }
        text.onChange(async (value) => {
          this.plugin.updateSetting('template', value);
        });
      });
  }
}
