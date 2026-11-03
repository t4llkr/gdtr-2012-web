// Браузерный эквивалент меню ChooseLevel: Credits и Settings.

export const SETTINGS = [
  { key: 'google_analytics', label: 'Report anonymous statistics to help improve the game', fallback: true },
  { key: 'accel_brake_bottom', label: 'Accelerate/Brake controls at bottom', fallback: false },
  { key: 'pinch_while_play', label: 'Pinch zoom while playing', fallback: false },
];

export class ChooseLevelDialogs {
  constructor(preferences) {
    this.preferences = preferences;
    this.toastTimer = 0;

    this.settingsDialog = document.createElement('dialog');
    this.settingsDialog.className = 'choose-dialog settings-dialog';
    this.settingsDialog.setAttribute('aria-labelledby', 'settings-title');
    const settingsTitle = document.createElement('h2');
    settingsTitle.id = 'settings-title';
    settingsTitle.textContent = 'Settings';
    this.settingsDialog.appendChild(settingsTitle);

    for (const setting of SETTINGS) {
      const label = document.createElement('label');
      label.className = 'setting-item';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.setting = setting.key;
      checkbox.checked = preferences.getBoolean(setting.key, setting.fallback);
      checkbox.addEventListener('change', () => {
        preferences.setBoolean(setting.key, checkbox.checked);
        this.showToast(`${setting.label} set to ${checkbox.checked}`);
      });
      const text = document.createElement('span');
      text.textContent = setting.label;
      label.append(checkbox, text);
      this.settingsDialog.appendChild(label);
    }
    this.settingsDialog.appendChild(this.createCloseButton());

    this.creditsDialog = document.createElement('dialog');
    this.creditsDialog.className = 'choose-dialog credits-dialog';
    this.creditsDialog.setAttribute('aria-labelledby', 'credits-title');
    const creditsTitle = document.createElement('h2');
    creditsTitle.id = 'credits-title';
    creditsTitle.textContent = 'Credits';
    this.creditsText = document.createElement('pre');
    this.creditsText.className = 'credits-text';
    this.creditsDialog.append(creditsTitle, this.creditsText, this.createCloseButton());

    this.toast = document.createElement('div');
    this.toast.className = 'choose-toast';
    this.toast.setAttribute('role', 'status');
    this.toast.hidden = true;

    document.body.append(this.settingsDialog, this.creditsDialog, this.toast);
  }

  createCloseButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dialog-close';
    button.textContent = 'Close';
    button.addEventListener('click', () => button.closest('dialog').close());
    return button;
  }

  openSettings() { this.settingsDialog.showModal(); }

  async openCredits() {
    if (!this.creditsText.dataset.loaded) {
      try {
        const response = await fetch('assets/CREDITS');
        this.creditsText.textContent = response.ok ? await response.text() : '';
      } catch {
        this.creditsText.textContent = '';
      }
      this.creditsText.dataset.loaded = 'true';
    }
    this.creditsDialog.showModal();
  }

  showToast(text) {
    clearTimeout(this.toastTimer);
    this.toast.textContent = text;
    this.toast.hidden = false;
    this.toastTimer = setTimeout(() => { this.toast.hidden = true; }, 2000);
  }
}
