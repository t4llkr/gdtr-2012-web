// Модальное управление импортированными паками, рекордами и резервными копиями.

export class PackManagerDialog {
  constructor(manager, onChange, onToast) {
    this.manager = manager;
    this.onChange = onChange;
    this.onToast = onToast;
    this.dragId = null;
    this.pendingDelete = null;
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'choose-dialog pack-manager-dialog';
    this.dialog.setAttribute('aria-labelledby', 'pack-manager-title');

    const title = document.createElement('h2');
    title.id = 'pack-manager-title';
    title.textContent = 'Manage packs';
    this.list = document.createElement('div');
    this.list.className = 'pack-manager-list';
    this.list.setAttribute('role', 'list');

    const backupActions = document.createElement('div');
    backupActions.className = 'pack-backup-actions';
    this.importButton = this.createActionButton('Import data', 'import-backup');
    const exportButton = this.createActionButton('Export data', 'export-backup');
    this.backupInput = document.createElement('input');
    this.backupInput.type = 'file';
    this.backupInput.accept = '.json,application/json';
    this.backupInput.hidden = true;
    this.backupInput.dataset.backupInput = '';
    backupActions.append(this.importButton, exportButton, this.backupInput);
    this.importButton.addEventListener('click', () => this.backupInput.click());
    exportButton.addEventListener('click', () => this.exportBackup());
    this.backupInput.addEventListener('change', () => this.importBackup());

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'dialog-close';
    close.textContent = 'Close';
    close.addEventListener('click', () => this.dialog.close());
    this.dialog.append(title, this.list, backupActions, close);
    document.body.appendChild(this.dialog);

    this.deleteDialog = document.createElement('dialog');
    this.deleteDialog.className = 'choose-dialog pack-delete-dialog';
    this.deleteDialog.setAttribute('aria-labelledby', 'pack-delete-title');
    const deleteTitle = document.createElement('h2');
    deleteTitle.id = 'pack-delete-title';
    deleteTitle.textContent = 'Delete pack';
    this.deleteText = document.createElement('p');
    this.deleteText.className = 'pack-delete-text';
    const deleteActions = document.createElement('div');
    deleteActions.className = 'pack-delete-actions';
    const keep = this.createActionButton('Delete pack, keep records', 'delete-keep');
    const full = this.createActionButton('Delete pack and records', 'delete-full');
    const cancel = this.createActionButton('Cancel', 'delete-cancel');
    keep.addEventListener('click', () => this.confirmDelete(false));
    full.addEventListener('click', () => this.confirmDelete(true));
    cancel.addEventListener('click', () => this.deleteDialog.close());
    deleteActions.append(keep, full, cancel);
    this.deleteDialog.append(deleteTitle, this.deleteText, deleteActions);
    document.body.appendChild(this.deleteDialog);
  }

  createActionButton(text, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.dataset.action = action;
    return button;
  }

  open() {
    this.render();
    this.dialog.showModal();
  }

  openDelete(pack) {
    this.pendingDelete = pack;
    this.deleteText.textContent = `Delete pack "${pack.name}"?`;
    this.deleteDialog.showModal();
  }

  confirmDelete(removeRecords) {
    if (!this.pendingDelete) return;
    this.manager.deletePack(this.pendingDelete.id, removeRecords);
    this.pendingDelete = null;
    this.deleteDialog.close();
    this.onChange?.();
    this.render();
  }

  exportBackup() {
    const backup = this.manager.exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gdtr-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    this.onToast?.('Backup exported');
  }

  async importBackup() {
    const file = this.backupInput.files[0];
    if (!file) return;
    this.importButton.disabled = true;
    try {
      const result = this.manager.importBackup(await file.text());
      this.onChange?.();
      this.render();
      this.onToast?.(`Imported backup: ${result.packs} pack(s), ${result.records} record(s)`);
    } catch (e) {
      console.error('GDTR', 'Failed to import backup.', e);
      this.onToast?.('Failed to import backup');
    } finally {
      this.importButton.disabled = false;
      this.backupInput.value = '';
    }
  }

  render() {
    this.list.replaceChildren();
    this.dragId = null;
    const packs = this.manager.getPacks();
    if (packs.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'pack-manager-empty';
      empty.textContent = 'No imported packs';
      this.list.appendChild(empty);
      return;
    }

    packs.forEach(pack => {
      const item = document.createElement('div');
      item.className = 'pack-manager-item';
      item.dataset.packId = pack.id;
      item.draggable = true;
      item.setAttribute('role', 'listitem');
      const handle = document.createElement('span');
      handle.className = 'pack-drag-handle';
      handle.textContent = '⋮⋮';
      handle.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span');
      name.className = 'pack-manager-name';
      name.textContent = pack.name;
      const actions = document.createElement('div');
      actions.className = 'pack-manager-actions';
      const remove = this.createActionButton('Delete', 'delete');
      remove.setAttribute('aria-label', `Delete: ${pack.name}`);
      remove.addEventListener('click', () => this.openDelete(pack));
      actions.appendChild(remove);
      item.append(handle, name, actions);

      item.addEventListener('dragstart', event => {
        this.dragId = pack.id;
        item.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', pack.id);
      });
      item.addEventListener('dragover', event => {
        if (this.dragId === null || this.dragId === pack.id) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        for (const other of this.list.children) other.classList.remove('drag-over');
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', event => {
        event.preventDefault();
        const sourceId = this.dragId || event.dataTransfer.getData('text/plain');
        this.dragId = null;
        if (sourceId && sourceId !== pack.id) {
          this.manager.movePackTo(sourceId, pack.id);
          this.onChange?.();
          this.render();
        }
      });
      item.addEventListener('dragend', () => {
        this.dragId = null;
        for (const other of this.list.children) {
          other.classList.remove('dragging', 'drag-over');
        }
      });
      this.list.appendChild(item);
    });
  }
}
