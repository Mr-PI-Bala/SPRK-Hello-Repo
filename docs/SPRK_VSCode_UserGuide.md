# SPRK VS Code User Guide
This is the master SPRK guide for VS Code, Codespaces editor behavior, Markdown preview, and Mermaid diagrams.

## Table Of Contents
- [Markdown Opens In Preview](#markdown-opens-in-preview) [[#Markdown Opens In Preview]] (obsidian)
- [Edit A Markdown File](#edit-a-markdown-file) [[#Edit A Markdown File]] (obsidian)
- [Save Your Work](#save-your-work) [[#Save Your Work]] (obsidian)
- [Preview Shortcuts](#preview-shortcuts) [[#Preview Shortcuts]] (obsidian)
- [Mermaid Diagrams](#mermaid-diagrams) [[#Mermaid Diagrams]] (obsidian)
- [Markdown Preview Theme](#markdown-preview-theme) [[#Markdown Preview Theme]] (obsidian)
- [iPad Preview Troubleshooting](#ipad-preview-troubleshooting) [[#iPad Preview Troubleshooting]] (obsidian)
- [Recommended Extensions](#recommended-extensions) [[#Recommended Extensions]] (obsidian)

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

## Markdown Preview Theme
SPRK repositories should include a Markdown preview stylesheet:

```json
{
  "markdown.styles": [
    "docs/styles/markdown-preview.css"
  ]
}
```

That stylesheet keeps Markdown preview readable in dark mode across GitHub web, github.dev, Codespaces, and VS Code Desktop.

If the preview is white with low-contrast text, the Markdown preview webview is not using the expected dark styling.

## iPad Preview Troubleshooting
On iPad, github.dev and Codespaces run inside the browser, and Markdown preview is a VS Code webview. Sometimes the editor theme and the preview webview do not refresh together.

Try these steps:

1. Confirm the repository has `.vscode/settings.json`.
2. Confirm `.vscode/settings.json` includes `markdown.styles`.
3. Close the Markdown preview tab.
4. Reopen `README.md`.
5. Open Command Palette.
6. Run `Developer: Reload Window`.
7. Reopen Markdown Preview.
8. If the preview is still white, open the same README in normal GitHub view instead of github.dev to read the rendered Mermaid diagram.

If Chromebook preview works but iPad preview stays white, treat it as an iPad browser webview limitation. The repository is still valid; use normal GitHub README view for reading and Codespaces editor view for editing.

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
