import { $el } from "./element.js";

export class NodeNoteDialog extends EventTarget {
    #buttons;

    constructor(type = "div", buttons = null) {
        super();
        this.#buttons = buttons;
        this.element = $el(type + ".NodeNote-modal", { parent: document.body }, [
            $el("div.NodeNote-modal-content", [$el("p", { $: (p) => (this.textElement = p) }), ...this.createButtons()]),
        ])
    }

    createButtons() {
		return (
			this.#buttons ?? [
				$el("button", {
					type: "button",
					textContent: "Close",
					onclick: () => this.close(),
				}),
			]
		);
	}
    
	close() {
		this.element.style.display = "none";
	}

	show(html) {
		if (typeof html === "string") {
			this.textElement.innerHTML = html;
		} else {
			this.textElement.replaceChildren(...(html instanceof Array ? html : [html]));
		}
		this.element.style.display = "flex";
	}

}