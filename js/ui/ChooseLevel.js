// Порт activity.ChooseLevel + gui.c: полноэкранный список уровней и паков.

import { ChooseLevelDialogs } from './ChooseLevelDialogs.js';
import { PackManagerDialog } from './PackManagerDialog.js';

const ICONS = {
  blank: 'assets/levels/ic_list_blank.png',
  locked: 'assets/levels/ic_list_padlock.png',
  1: 'assets/levels/ic_list_stars1.png',
  2: 'assets/levels/ic_list_stars2.png',
  3: 'assets/levels/ic_list_stars3.png',
};

export class ChooseLevel {
  constructor(root, manager, onPlay, preferences) {
    this.root = root;
    this.manager = manager;
    this.onPlay = onPlay;
    this.dialogs = new ChooseLevelDialogs(preferences);
    this.packManager = new PackManagerDialog(manager, () => this.refresh(),
      text => this.dialogs.showToast(text));
  }

  refresh() {
    this.manager.updateLocks();
    this.root.replaceChildren();

    this.appendHeading('Gravity Defied');
    this.appendOptions();
    for (const info of this.manager.getLevels()) this.appendLevel(info);

    // ChooseLevel: встроенные уровни первыми, затем null-header каждого пака.
    for (const pack of this.manager.getPacks()) {
      this.appendHeading(pack.name);
      for (const info of pack.levels) this.appendLevel(info);
    }
  }

  appendHeading(text) {
    const heading = document.createElement('div');
    heading.className = 'level-heading';
    heading.textContent = text;
    this.root.appendChild(heading);
  }

  appendOptions() {
    const options = document.createElement('div');
    options.className = 'choose-options';
    for (const [action, label] of [
      ['credits', 'Credits'],
      ['settings', 'Settings'],
      ['import', 'Import pack'],
      ['manage', 'Manage packs'],
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.action = action;
      button.textContent = label;
      options.appendChild(button);
      if (action === 'credits') button.addEventListener('click', () => this.dialogs.openCredits());
      else if (action === 'settings') button.addEventListener('click', () => this.dialogs.openSettings());
      else if (action === 'manage') button.addEventListener('click', () => this.packManager.open());
      else {
        const input = document.createElement('input');
        input.type = 'file';
        input.hidden = true;
        input.multiple = true;
        input.accept = '.zip,application/zip';
        input.dataset.packInput = '';
        options.appendChild(input);
        button.addEventListener('click', () => input.click());
        input.addEventListener('change', async () => {
          button.disabled = true;
          try {
            const result = await this.manager.importPackFiles(input.files);
            this.refresh();
            this.dialogs.showToast(result.levels > 0
              ? `Imported ${result.packs} pack(s), ${result.levels} level(s)`
              : 'No custom levels found');
          } catch (e) {
            console.error('GDTR', 'Failed to import custom pack.', e);
            this.dialogs.showToast('Failed to import custom pack');
            button.disabled = false;
          }
        });
      }
    }
    this.root.appendChild(options);
  }

  appendLevel(info) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'level-item';
    row.dataset.levelName = info.name;
    if (info.packId !== null) row.dataset.packId = info.packId;
    row.setAttribute('aria-disabled', String(info.locked));

    const icon = document.createElement('img');
    icon.className = 'level-icon';
    icon.alt = '';
    icon.src = info.locked ? ICONS.locked : ICONS[info.getStars()] || ICONS.blank;

    const name = document.createElement('span');
    name.className = 'level-name';
    name.textContent = info.name;
    if (info.locked) row.classList.add('locked');
    else if (info.isCompleted()) row.classList.add('completed');
    else row.classList.add('available');

    row.append(icon, name);
    const best = info.getBestTimeText();
    if (best !== null && !info.locked) {
      const details = document.createElement('span');
      details.className = 'level-details';
      details.textContent = best;
      row.appendChild(details);
    }

    row.addEventListener('click', () => {
      if (!info.locked) this.onPlay(info);
    });
    this.root.appendChild(row);
  }
}
