import { $el } from "./element.js"
import { NodeNoteButton } from "./button.js";
import { prop } from "../utils/tools.js"

export class NodeNoteButtonGroup {
	element = $el("div.nodenote-button-group");

	/** @param {Array<NodeNoteButton | HTMLElement>} buttons */
	constructor(...buttons) {
		this.buttons = prop(this, "buttons", buttons, () => this.update());
	}

	/**
	 * @param {NodeNoteButton} button
	 * @param {number} index
	 */
	insert(button, index) {
		this.buttons.splice(index, 0, button);
		this.update();
	}

	/** @param {NodeNoteButton} button */
	append(button) {
		this.buttons.push(button);
		this.update();
	}

	/** @param {NodeNoteButton|number} indexOrButton */
	remove(indexOrButton) {
		if (typeof indexOrButton !== "number") {
			indexOrButton = this.buttons.indexOf(indexOrButton);
		}
		if (indexOrButton > -1) {
			const r = this.buttons.splice(indexOrButton, 1);
			this.update();
			return r;
		}
	}

	update() {
		this.element.replaceChildren(...this.buttons.map((b) => b["element"] ?? b));
	}
}
