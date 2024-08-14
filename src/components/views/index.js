import { $el, dragElement } from "../element.js"
import { NodeNoteDialog } from "../dialog.js";
import { NodeNoteSettingsDialog } from "../settings.js";

export class NodeNoteUI {
    constructor(app) {
		this.app = app;
        this.dialog = new NodeNoteDialog();
        this.settings = new NodeNoteSettingsDialog(app);


        const promptFilename = this.settings.addSetting({
			id: "NodeNote.PromptFilename",
			name: "Prompt for filename when saving workflow",
			type: "boolean",
			defaultValue: true,
		});

        const fileInput = $el("input", {
			id: "nodenote-file-input",
			type: "file",
			accept: ".json,image/png,.latent,.safetensors,image/webp,audio/flac",
			style: {display: "none"},
			parent: document.body,
			onchange: () => {
				app.handleFile(fileInput.files[0]);
			},
		});

		this.loadFile = () => fileInput.click();

        this.menuHamburger = $el(
			"div.nodenote-menu-hamburger",
			{
				parent: document.body,
				onclick: () => {
					this.menuContainer.style.display = "block";
					this.menuHamburger.style.display = "none";
				},
			},
			[$el("div"), $el("div"), $el("div")]
		);

        this.menuContainer = $el("div.nodenote-menu",  { parent: document.body }, [
			$el("div.drag-handle.nodenote-menu-header", {
				style: {
					overflow: "hidden",
					position: "relative",
					width: "100%",
					cursor: "default"
				}
			}, 	[
				$el("span.drag-handle"),
				$el("span.nodenote-menu-queue-size", { $: (q) => (this.queueSize = q) }),
				$el("div.nodenote-menu-actions", [
					$el("button.nodenote-settings-btn", {
						textContent: "⚙️",
						onclick: () => this.settings.show(),
					}),
					$el("button.nodenote-close-menu-btn", {
						textContent: "\u00d7",
						onclick: () => {
							this.menuContainer.style.display = "none";
							this.menuHamburger.style.display = "flex";
						},
					}),
                    $el("button", {
                        id: "nodenote-save-button",
                        textContent: "Save",
                        onclick: () => {
                            let filename = "workflow.json";
                            if (promptFilename.value) {
                                filename = prompt("Save workflow as:", filename);
                                if (!filename) return;
                                if (!filename.toLowerCase().endsWith(".json")) {
                                    filename += ".json";
                                }
                            }
                            app.graphToPrompt().then(p=>{
                                const json = JSON.stringify(p.workflow, null, 2); // convert the data to a JSON string
                                const blob = new Blob([json], {type: "application/json"});
                                const url = URL.createObjectURL(blob);
                                const a = $el("a", {
                                    href: url,
                                    download: filename,
                                    style: {display: "none"},
                                    parent: document.body,
                                });
                                a.click();
                                setTimeout(function () {
                                    a.remove();
                                    window.URL.revokeObjectURL(url);
                                }, 0);
                            });
                        },
                    }),
        			$el("button", {id: "nodenote-load-button", textContent: "Load", onclick: () => fileInput.click()}),

				]),
			]),
        ]);
		this.restoreMenuPosition = dragElement(this.menuContainer, this.settings);

    }
}