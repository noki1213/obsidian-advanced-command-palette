# Advanced Command Palette

A feature-rich command palette for [Obsidian](https://obsidian.md) with alias support, pinning, recently used tracking, and per-command hotkey assignment.

> 日本語ドキュメントは下にあります。 → [日本語](#日本語)

---

## Features

- **Alias search** — Assign short aliases to any command (e.g. `del` for "Delete file"). When you type an alias in the palette, that command rises to the top.
- **Pinned commands** — Press `P` on any focused command to pin it. Pinned commands always appear at the top when the palette opens.
- **Recently Used** — Commands you have executed recently are shown automatically when you open the palette with an empty query.
- **Per-command hotkeys** — Assign a hotkey to any command directly from the settings table using key capture (click → press the key combination).
- **Enable / Disable** — Hide commands from the palette without removing them from Obsidian.
- **Filter bar** — Quickly filter the settings list by: Show only enabled / Show only customized / Show only conflicts.
- **Visual alias badges** — Aliases are shown as colored pills inside the palette so you can see them at a glance.

## How it works

When you open the palette with an empty query, only **Pinned** and **Recently Used** sections are shown.
Start typing and the list filters in real time. Commands whose aliases match appear above commands that only match by name.

## Installation

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest).
2. Create a folder `<your-vault>/.obsidian/plugins/advanced-command-palette/`.
3. Copy the three files into that folder.
4. In Obsidian, go to Settings → Community plugins → enable **Advanced Command Palette**.

### BRAT (Beta Reviewers Auto-update Tool)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from the Community plugins.
2. Open BRAT settings and click **Add Beta plugin**.
3. Enter `noki1213/obsidian-advanced-command-palette`.
4. Enable the plugin in Settings → Community plugins.

## Usage

### Open the palette

Assign a hotkey to **Advanced Command Palette: Open** in Settings → Hotkeys (search for "Advanced Command Palette").

### Alias

1. Open Settings → Advanced Command Palette.
2. Find a command in the table and click **+ Add Alias** in the Alias column.
3. Type your alias and press Enter.

Now type that alias in the palette — the command will appear at the top.

### Pin a command

Open the palette, navigate to a command with the arrow keys, then press `P`. A pinned command always shows at the top of the palette when no query is entered. Press `P` again to unpin.

### Per-command hotkey

In the settings table, click **Record Hotkey** in the Hotkey column for any command, then press your desired key combination. Press Escape to cancel.

### Filters

Use the filter buttons above the settings table to narrow the list:

| Filter | Description |
|---|---|
| Show only enabled | Hides disabled commands |
| Show only customized | Shows only commands with an alias or hotkey set |
| Show only conflicts | Shows commands that share the same hotkey |

---

## License

MIT

---

<a name="日本語"></a>

# Advanced Command Palette（日本語）

エイリアス、ピン留め、最近使ったコマンド、コマンドごとのホットキー設定に対応した、高機能なObsidian用コマンドパレットプラグインです。

---

## 機能

- エイリアス検索 — コマンドに短い別名をつけられます（例：「ファイルを削除」に `del` を設定）。パレットでエイリアスを入力すると、そのコマンドが最上位に表示されます。
- ピン留め — パレット内でコマンドにフォーカスして `P` キーを押すとピン留めできます。ピン留めしたコマンドは、パレットを開いたとき常に上部に表示されます。
- 最近使ったコマンド（Recently Used） — パレットを開いたとき、最近実行したコマンドが自動的に表示されます。
- コマンドごとのホットキー — 設定画面のテーブルで「Record Hotkey」をクリックし、キーを押すと任意のコマンドにホットキーを割り当てられます。
- 有効/無効（Enable / Disable） — コマンドをObsidianから削除せずに、パレットから非表示にできます。
- フィルターバー — 設定画面で「有効のみ」「カスタマイズ済みのみ」「競合のみ」で絞り込めます。
- エイリアスバッジ — パレット内でエイリアスがカラーのタグとして表示されるので、一目で確認できます。

---

## インストール方法

### 手動インストール

1. [最新リリース](../../releases/latest) から `main.js`、`manifest.json`、`styles.css` をダウンロードします。
2. Vault の `.obsidian/plugins/advanced-command-palette/` フォルダを作成します。
3. ダウンロードした3つのファイルをそのフォルダに入れます。
4. Obsidian の 設定 → コミュニティプラグイン で **Advanced Command Palette** を有効にします。

### BRAT を使う方法

1. コミュニティプラグインから [BRAT](https://github.com/TfTHacker/obsidian42-brat) をインストールします。
2. BRAT の設定を開き「Add Beta plugin」をクリックします。
3. `noki1213/obsidian-advanced-command-palette` を入力します。
4. 設定 → コミュニティプラグイン でプラグインを有効にします。

---

## 使い方

### パレットを開く

設定 → ホットキー で「Advanced Command Palette」を検索し、好きなショートカットキーを割り当ててください。

### エイリアスを設定する

1. 設定 → Advanced Command Palette を開きます。
2. テーブルからコマンドを探し、Alias 列の「+ Add Alias」をクリックします。
3. エイリアスを入力して Enter を押します。

パレットでそのエイリアスを入力すると、コマンドが最上位に表示されます。

### ピン留めする

パレットを開き、矢印キーでコマンドにフォーカスして `P` キーを押します。もう一度 `P` を押すと解除されます。

### コマンドにホットキーを設定する

設定テーブルの Hotkey 列で「Record Hotkey」をクリックし、登録したいキーの組み合わせを押します。Escape でキャンセルできます。

---

## ライセンス

MIT
