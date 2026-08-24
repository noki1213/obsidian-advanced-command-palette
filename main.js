const { Plugin, SuggestModal, PluginSettingTab, Notice } = require('obsidian');

// Default settings
const DEFAULT_SETTINGS = {
	aliases: {},           // { 'commandId': ['alias1', 'alias2'] }
	pins: [],              // ['commandId1', 'commandId2']
	disabled: [],          // ['commandId1', 'commandId2']
	recentlyUsed: [],      // ['commandId1', ...], capped at 10 entries
	commandHotkeys: {},    // { 'commandId': { modifiers: [], key: '' } }
	paletteHotkey: null,
};

// ==================== Plugin ====================

class AdvancedCommandPalettePlugin extends Plugin {
	async onload() {
		await this.loadSettings();

		// Backwards compatibility: the old `hotkey` setting is now `paletteHotkey`
		if (this.settings.hotkey && !this.settings.paletteHotkey) {
			this.settings.paletteHotkey = this.settings.hotkey;
			delete this.settings.hotkey;
			await this.saveSettings();
		}

		this.addCommand({
			id: 'open-advanced-command-palette',
			name: 'Advanced Command Palette を開く',
			hotkeys: this.settings.paletteHotkey ? [this.settings.paletteHotkey] : [],
			callback: () => new AdvancedCommandPaletteModal(this.app, this).open(),
		});

		this.addSettingTab(new AdvancedCommandPaletteSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// ==================== Command palette modal ====================

class AdvancedCommandPaletteModal extends SuggestModal {
	constructor(app, plugin) {
		super(app);
		this.plugin = plugin;
		this.setPlaceholder('コマンドを検索...');

		// Press P to pin
		this.scope.register([], 'p', (event) => {
			event.preventDefault();
			const selected = this.chooser?.values?.[this.chooser?.selectedItem];
			// Ignore header rows and the case where nothing is selected
			if (!selected || selected.type === 'header') return false;

			const cmd = selected.cmd;
			this.togglePin(cmd.id);

			const isPinned = this.plugin.settings.pins.includes(cmd.id);
			new Notice(isPinned
				? `Pinned: ${cmd.name}`
				: `Unpinned: ${cmd.name}`
			);

			this.inputEl.dispatchEvent(new Event('input'));
			return false;
		});
	}

	getSuggestions(query) {
		const { aliases, pins, disabled, recentlyUsed } = this.plugin.settings;
		const q = query.toLowerCase().trim();

		// Empty query: show only Pinned and Recently Used
		if (q === '') {
			const result = [];

			const pinnedCmds = pins
				.map(id => this.app.commands.commands[id])
				.filter(cmd => cmd && cmd.name && !disabled.includes(cmd.id));

			if (pinnedCmds.length > 0) {
				result.push({ type: 'header', label: 'Pinned' });
				pinnedCmds.forEach(cmd => result.push({ type: 'command', cmd }));
			}

			const recentCmds = (recentlyUsed || [])
				.map(id => this.app.commands.commands[id])
				.filter(cmd => cmd && cmd.name && !disabled.includes(cmd.id) && !pins.includes(cmd.id));

			if (recentCmds.length > 0) {
				result.push({ type: 'header', label: 'Recently Used' });
				recentCmds.forEach(cmd => result.push({ type: 'command', cmd }));
			}

			return result;
		}

		// Non-empty query: filter every command and sort by score
		const commands = Object.values(this.app.commands.commands)
			.filter(cmd => cmd.name && !disabled.includes(cmd.id));

		const scored = commands
			.map(cmd => {
				const name = cmd.name.toLowerCase();
				const cmdAliases = (aliases[cmd.id] || []).map(a => a.toLowerCase());
				const isPinned = pins.includes(cmd.id);

				let score = 0;
				if (cmdAliases.some(a => a === q))          score = 100;
				else if (cmdAliases.some(a => a.startsWith(q))) score = 80;
				else if (cmdAliases.some(a => a.includes(q)))   score = 60;
				else if (name.startsWith(q))                    score = 40;
				else if (name.includes(q))                      score = 20;
				else return null;

				if (isPinned) score += 1000;
				return { type: 'command', cmd, score };
			})
			.filter(item => item !== null);

		scored.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			return a.cmd.name.localeCompare(b.cmd.name);
		});

		return scored;
	}

	renderSuggestion(item, el) {
		// Section header
		if (item.type === 'header') {
			el.addClass('acp-palette-section-header');
			el.createSpan({ text: item.label });
			return;
		}

		// Command row
		const { cmd } = item;
		const isPinned = this.plugin.settings.pins.includes(cmd.id);
		const cmdAliases = this.plugin.settings.aliases[cmd.id] || [];

		el.addClass('acp-palette-item');
		const row = el.createDiv({ cls: 'acp-palette-row' });

		if (isPinned) {
			row.createSpan({ cls: 'acp-palette-pin-icon', text: '⚑' });
		}

		row.createSpan({ cls: 'acp-palette-name', text: cmd.name });

		if (cmdAliases.length > 0) {
			const aliasWrap = row.createSpan({ cls: 'acp-palette-alias-wrap' });
			cmdAliases.forEach(alias => {
				aliasWrap.createSpan({ cls: 'acp-palette-alias-badge', text: alias });
			});
		}
	}

	onChooseSuggestion(item) {
		// Skip header rows
		if (item.type === 'header') return;

		const { cmd } = item;
		this.app.commands.executeCommandById(cmd.id);
		this.updateRecentlyUsed(cmd.id);
	}

	// Record the command as recently used, keeping at most 10
	updateRecentlyUsed(commandId) {
		const recent = this.plugin.settings.recentlyUsed || [];
		const idx = recent.indexOf(commandId);
		if (idx >= 0) recent.splice(idx, 1);
		recent.unshift(commandId);
		this.plugin.settings.recentlyUsed = recent.slice(0, 10);
		this.plugin.saveSettings();
	}

	togglePin(commandId) {
		const pins = this.plugin.settings.pins;
		const index = pins.indexOf(commandId);
		if (index >= 0) {
			pins.splice(index, 1);
		} else {
			pins.push(commandId);
		}
		this.plugin.saveSettings();
	}
}

// ==================== Settings tab ====================

class AdvancedCommandPaletteSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
		// Filter state, deliberately not persisted to settings
		this.filters = {
			onlyEnabled: false,
			onlyCustomized: false,
			onlyConflicts: false,
		};
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Advanced Command Palette' });

		this.renderCommandTable(containerEl);
	}

	// Command table
	renderCommandTable(containerEl) {
		containerEl.createEl('h3', { text: 'コマンド設定' });

		// Filter bar
		const filterBar = containerEl.createDiv({ cls: 'acp-filter-bar' });
		const filterDefs = [
			{ key: 'onlyEnabled',    label: 'Show only enabled' },
			{ key: 'onlyCustomized', label: 'Show only customized' },
			{ key: 'onlyConflicts',  label: 'Show only conflicts' },
		];

		// Search box
		const searchInput = containerEl.createEl('input', {
			cls: 'acp-search-input',
			type: 'text',
			placeholder: 'コマンド名で絞り込む...',
		});

		// Table
		const tableWrap = containerEl.createDiv({ cls: 'acp-table-wrap' });

		const header = tableWrap.createDiv({ cls: 'acp-table-header' });
		header.createDiv({ cls: 'acp-col-name acp-col-header',    text: 'Name' });
		header.createDiv({ cls: 'acp-col-alias acp-col-header',   text: 'Alias' });
		header.createDiv({ cls: 'acp-col-hotkey acp-col-header',  text: 'Hotkey' });
		header.createDiv({ cls: 'acp-col-enabled acp-col-header', text: 'Enabled' });

		const tbody = tableWrap.createDiv({ cls: 'acp-table-body' });

		// Render the table
		const renderTable = () => {
			tbody.empty();
			const query = searchInput.value;

			let commands = Object.values(this.app.commands.commands)
				.filter(cmd => cmd.name)
				.sort((a, b) => a.name.localeCompare(b.name));

			// Text filter
			if (query) {
				const q = query.toLowerCase();
				commands = commands.filter(cmd => {
					if (cmd.name.toLowerCase().includes(q)) return true;
					const a = this.plugin.settings.aliases[cmd.id] || [];
					return a.some(alias => alias.toLowerCase().includes(q));
				});
			}

			// Apply the active filters
			commands = this.applyFilters(commands);

			// Put customised commands first
			const customized = commands.filter(cmd =>
				(this.plugin.settings.aliases[cmd.id] || []).length > 0 ||
				!!this.plugin.settings.commandHotkeys[cmd.id]
			);
			const rest = commands.filter(cmd =>
				(this.plugin.settings.aliases[cmd.id] || []).length === 0 &&
				!this.plugin.settings.commandHotkeys[cmd.id]
			);
			const sorted = [...customized, ...rest];

			sorted.slice(0, 80).forEach(cmd => this.renderTableRow(tbody, cmd, renderTable));

			if (sorted.length > 80) {
				tbody.createEl('p', {
					text: `${sorted.length - 80} more. Use the search box to narrow the list.`,
					cls: 'acp-more',
				});
			}
		};

		// Render the filter buttons
		filterDefs.forEach(({ key, label }) => {
			const btn = filterBar.createEl('button', {
				cls: 'acp-filter-btn' + (this.filters[key] ? ' acp-filter-active' : ''),
				text: label,
			});
			btn.addEventListener('click', () => {
				this.filters[key] = !this.filters[key];
				btn.toggleClass('acp-filter-active', this.filters[key]);
				renderTable();
			});
		});

		searchInput.addEventListener('input', renderTable);
		renderTable();
	}

	// Return the commands left after applying the filters
	applyFilters(commands) {
		let result = commands;

		if (this.filters.onlyEnabled) {
			result = result.filter(cmd => !this.plugin.settings.disabled.includes(cmd.id));
		}

		if (this.filters.onlyCustomized) {
			result = result.filter(cmd =>
				(this.plugin.settings.aliases[cmd.id] || []).length > 0 ||
				!!this.plugin.settings.commandHotkeys[cmd.id]
			);
		}

		if (this.filters.onlyConflicts) {
			const conflictIds = this.getConflictIds();
			result = result.filter(cmd => conflictIds.has(cmd.id));
		}

		return result;
	}

	// Return the ids of commands that share a hotkey with another command
	getConflictIds() {
		const map = {};
		Object.entries(this.plugin.settings.commandHotkeys).forEach(([id, hotkey]) => {
			const key = this.formatHotkey(hotkey);
			if (!map[key]) map[key] = [];
			map[key].push(id);
		});
		const conflictIds = new Set();
		Object.values(map).forEach(ids => {
			if (ids.length > 1) ids.forEach(id => conflictIds.add(id));
		});
		return conflictIds;
	}

	// A single table row
	renderTableRow(tbody, cmd, renderTable) {
		const isDisabled = this.plugin.settings.disabled.includes(cmd.id);
		const isConflict = this.getConflictIds().has(cmd.id);

		const row = tbody.createDiv({
			cls: 'acp-table-row'
				+ (isDisabled ? ' acp-row-disabled' : '')
				+ (isConflict ? ' acp-row-conflict' : ''),
		});

		// Name column
		row.createDiv({ cls: 'acp-col-name' })
			.createSpan({ text: cmd.name, cls: 'acp-cmd-name' });

		// Alias column
		const aliasCell = row.createDiv({ cls: 'acp-col-alias' });
		this.renderAliasCell(aliasCell, cmd);

		// Hotkey column
		const hotkeyCell = row.createDiv({ cls: 'acp-col-hotkey' });
		this.renderHotkeyCell(hotkeyCell, cmd, renderTable);

		// Enabled column
		const enabledCell = row.createDiv({ cls: 'acp-col-enabled' });
		const toggle = enabledCell.createEl('input', { type: 'checkbox' });
		toggle.checked = !isDisabled;
		toggle.addEventListener('change', async () => {
			const disabled = this.plugin.settings.disabled;
			if (toggle.checked) {
				const idx = disabled.indexOf(cmd.id);
				if (idx >= 0) disabled.splice(idx, 1);
				row.removeClass('acp-row-disabled');
			} else {
				if (!disabled.includes(cmd.id)) disabled.push(cmd.id);
				row.addClass('acp-row-disabled');
			}
			await this.plugin.saveSettings();
		});
	}

	// Contents of the Hotkey column
	renderHotkeyCell(cell, cmd, renderTable) {
		cell.empty();
		const hotkey = this.plugin.settings.commandHotkeys[cmd.id];

		if (hotkey) {
			// Already assigned: key name plus a clear button
			const inner = cell.createDiv({ cls: 'acp-hotkey-cell-inner' });
			inner.createSpan({ cls: 'acp-hotkey-badge', text: this.formatHotkey(hotkey) });
			const rm = inner.createSpan({ cls: 'acp-hotkey-rm', text: '×' });
			rm.addEventListener('click', async (e) => {
				e.stopPropagation();
				delete this.plugin.settings.commandHotkeys[cmd.id];
				await this.plugin.saveSettings();
				this.clearHotkeyFromObsidian(cmd.id);
				this.renderHotkeyCell(cell, cmd, renderTable);
				// Refresh the conflict markers
				renderTable();
			});
		} else {
			// Not assigned yet: show the Record Hotkey button
			const btn = cell.createSpan({ cls: 'acp-record-hotkey-btn', text: 'Record Hotkey' });
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.startHotkeyCapture(cell, cmd, renderTable);
			});
		}
	}

	// Wait for the next key press
	startHotkeyCapture(cell, cmd, renderTable) {
		cell.empty();
		const input = cell.createEl('input', {
			cls: 'acp-hotkey-capture-input',
			type: 'text',
			placeholder: 'Press key...',
		});
		input.readOnly = true;
		input.focus();

		input.addEventListener('keydown', async (e) => {
			e.preventDefault();
			e.stopPropagation();

			if (e.key === 'Escape') {
				this.renderHotkeyCell(cell, cmd, renderTable);
				return;
			}

			const hotkey = this.captureHotkey(e);
			if (!hotkey) return;

			this.plugin.settings.commandHotkeys[cmd.id] = hotkey;
			await this.plugin.saveSettings();
			this.applyHotkeyToObsidian(cmd.id, hotkey);
			this.renderHotkeyCell(cell, cmd, renderTable);
			// Refresh the conflict markers
			renderTable();
		});

		input.addEventListener('blur', () => {
			this.renderHotkeyCell(cell, cmd, renderTable);
		});
	}

	// Contents of the Alias column
	renderAliasCell(cell, cmd) {
		cell.empty();

		const aliases = this.plugin.settings.aliases[cmd.id] || [];
		const wrap = cell.createDiv({ cls: 'acp-alias-cell-inner' });

		aliases.forEach((alias, i) => {
			const tag = wrap.createSpan({ cls: 'acp-alias-tag' });
			tag.createSpan({ text: alias });
			const rm = tag.createSpan({ cls: 'acp-alias-rm', text: '×' });
			rm.addEventListener('click', async (e) => {
				e.stopPropagation();
				aliases.splice(i, 1);
				if (aliases.length === 0) {
					delete this.plugin.settings.aliases[cmd.id];
				} else {
					this.plugin.settings.aliases[cmd.id] = aliases;
				}
				await this.plugin.saveSettings();
				this.renderAliasCell(cell, cmd);
			});
		});

		const addLink = wrap.createSpan({ cls: 'acp-alias-add-link', text: '+ Add Alias' });
		addLink.addEventListener('click', (e) => {
			e.stopPropagation();
			addLink.remove();

			const input = wrap.createEl('input', {
				cls: 'acp-alias-inline-input',
				type: 'text',
				placeholder: 'Enter an alias...',
			});
			input.focus();

			const doAdd = async () => {
				const val = input.value.trim();
				if (val) {
					if (!this.plugin.settings.aliases[cmd.id]) {
						this.plugin.settings.aliases[cmd.id] = [];
					}
					if (!this.plugin.settings.aliases[cmd.id].includes(val)) {
						this.plugin.settings.aliases[cmd.id].push(val);
						await this.plugin.saveSettings();
					}
				}
				this.renderAliasCell(cell, cmd);
			};

			input.addEventListener('keydown', async (e) => {
				if (e.key === 'Enter') { e.preventDefault(); await doAdd(); }
				else if (e.key === 'Escape') { this.renderAliasCell(cell, cmd); }
			});
			input.addEventListener('blur', doAdd);
		});
	}

	// Turn a key event into a hotkey object
	captureHotkey(e) {
		const modifiers = [];
		if (e.metaKey) modifiers.push('Meta');
		if (e.ctrlKey) modifiers.push('Ctrl');
		if (e.altKey) modifiers.push('Alt');
		if (e.shiftKey) modifiers.push('Shift');

		// Ignore a modifier pressed on its own
		if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) return null;

		// Read the physical key from e.code so Option+B does not come through as ∫
		const key = this.keyFromCode(e.code, e.key);
		return { modifiers, key };
	}

	// Turn an e.code value into a readable key name
	keyFromCode(code, fallback) {
		if (code.startsWith('Key'))   return code.slice(3);   // KeyB → B
		if (code.startsWith('Digit')) return code.slice(5);   // Digit1 → 1
		if (/^F\d+$/.test(code))      return code;            // F1, F12, and so on
		const map = {
			'Space':        'Space',
			'Enter':        'Enter',
			'Backspace':    'Backspace',
			'Delete':       'Delete',
			'Tab':          'Tab',
			'Escape':       'Escape',
			'ArrowLeft':    '←',
			'ArrowRight':   '→',
			'ArrowUp':      '↑',
			'ArrowDown':    '↓',
			'Minus':        '-',
			'Equal':        '=',
			'BracketLeft':  '[',
			'BracketRight': ']',
			'Backslash':    '\\',
			'Semicolon':    ';',
			'Quote':        "'",
			'Backquote':    '`',
			'Comma':        ',',
			'Period':       '.',
			'Slash':        '/',
		};
		return map[code] || fallback;
	}

	// Format a hotkey for display using the macOS modifier symbols
	formatHotkey(hotkey) {
		const symbolMap = {
			'Meta':  '⌘',
			'Shift': '⇧',
			'Alt':   '⌥',
			'Ctrl':  '⌃',
		};
		const modifiers = (hotkey.modifiers || []).map(m => symbolMap[m] || m);
		const key = hotkey.key.toUpperCase();
		const modStr = modifiers.join('');
		return modStr ? modStr + ' ' + key : key;
	}

	// Apply the hotkey through Obsidian's hotkey manager
	applyHotkeyToObsidian(commandId, hotkey) {
		try {
			if (this.app.hotkeyManager) {
				const converted = {
					modifiers: hotkey.modifiers.map(m => m === 'Meta' ? 'Mod' : m),
					key: hotkey.key,
				};
				this.app.hotkeyManager.setHotkeys(commandId, [converted]);
				this.app.hotkeyManager.save?.();
			}
		} catch (e) {
			console.log('[Advanced Command Palette] failed to apply hotkey:', e);
		}
	}

	// Remove the hotkey from Obsidian
	clearHotkeyFromObsidian(commandId) {
		try {
			if (this.app.hotkeyManager) {
				this.app.hotkeyManager.setHotkeys(commandId, []);
				this.app.hotkeyManager.save?.();
			}
		} catch (e) {
			console.log('[Advanced Command Palette] failed to remove hotkey:', e);
		}
	}
}

module.exports = AdvancedCommandPalettePlugin;
