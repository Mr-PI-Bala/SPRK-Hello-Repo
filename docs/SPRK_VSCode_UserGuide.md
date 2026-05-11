# SPRK VS Code User Guide
This is the master SPRK guide for VS Code, Codespaces editor behavior, Markdown preview, and Mermaid diagrams.

## Table Of Contents
- [Markdown Opens In Preview](#markdown-opens-in-preview)
- [Edit A Markdown File](#edit-a-markdown-file)
- [Save Your Work](#save-your-work)
- [Preview Shortcuts](#preview-shortcuts)
- [Mermaid Diagrams](#mermaid-diagrams)
- [Recommended Extensions](#recommended-extensions)

## Markdown Opens In Preview
SPRK repositories can include this setting:

```json
{
  "workbench.editorAssociations": {
    "*.md": "vscode.markdown.preview.editor"
  },
  "markdown.preview.openMarkdownLinks": "inPreview"
}
```

That makes Markdown easier for new students to read first.

## Edit A Markdown File
If a Markdown file opens in preview:

1. Right-click the file tab or file in Explorer.
2. Choose `Open With...`.
3. Choose `Text Editor`.

Double-clicking the tab or file may also reopen it for editing depending on the current VS Code state.

## Save Your Work
Use:

```text
Ctrl+S
```

Save before running checks, committing, or switching branches.

## Preview Shortcuts
Useful Markdown preview shortcuts:

- `Ctrl+Shift+V`: open Markdown Preview.
- `Ctrl+K`, then `V`: open Preview beside the editor.

`Ctrl+K`, then `V` is a two-step shortcut:

1. Hold `Ctrl` and press `K`.
2. Release both keys.
3. Press `V`.

## Mermaid Diagrams
SPRK uses Mermaid diagrams inside Markdown.

Students do not need a Mermaid account. GitHub renders Mermaid diagrams directly in Markdown. Codespaces can preview them with Markdown Preview and the recommended Mermaid extension.

## Recommended Extensions
SPRK repositories can include:

```json
{
  "recommendations": [
    "GitHub.copilot-chat",
    "bierner.markdown-mermaid"
  ]
}
```

Recommended extensions are suggestions, not a guarantee. If Chat fails, check that `GitHub Copilot Chat` is installed and enabled.
