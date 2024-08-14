import { $el } from "../element.js"
import { NodeNoteButton } from "../button.js"
import { NodeNoteSplitButton } from "../splitButton.js";


const collapseOnMobile = (t) => {
	(t.element ?? t).classList.add("nodenote-menu-mobile-collapse");
	return t;
};
const showOnMobile = (t) => {
	(t.element ?? t).classList.add("lt-lg-show");
	return t;
};

export class NodeNoteMenu {
    #sizeBreak = "lg";
	#lastSizeBreaks = {
		lg: null,
		md: null,
		sm: null,
		xs: null,
	};
	#sizeBreaks = Object.keys(this.#lastSizeBreaks);
	#cachedInnerSize = null;
	#cacheTimeout = null;

    constructor(app) {
        this.app = app;
		const getSaveButton = (t) =>
			new NodeNoteButton({
				icon: "content-save",
				tooltip: "Save the current workflow",
				action: () => this.exportWorkflow("workflow", "workflow"),
				content: t,
			});

		this.logo = $el("h1.nodenote-logo.nlg-hide", { title: "NodeNote" }, "NodeNote");
        this.saveButton = new NodeNoteSplitButton(
            {
				primary: getSaveButton(),
				mode: "hover",
				position: "absolute",
			},
			getSaveButton("Save"),
			new NodeNoteButton({
				icon: "download",
				content: "Export",
				tooltip: "Export the current workflow as JSON",
				action: () => this.exportWorkflow("workflow", "workflow"),
			}),
        );
        this.element = $el("nav.nodenote-menu.lg", { style: { display: "none" } }, [
			this.logo,
			// this.workflows.element,
			this.saveButton.element,
			// collapseOnMobile(this.actionsGroup).element,
			$el("section.nodenote-menu-push")
			// collapseOnMobile(this.settingsGroup).element,
			// collapseOnMobile(this.viewGroup).element,

			// getInteruptButton("lt-lg-show").element,
			// new ComfyQueueButton(app).element,
			// showOnMobile(this.mobileMenuButton).element,
		]);

		let resizeHandler;
		// this.menuPositionSetting = app.ui.settings.addSetting({
		// 	id: "NodeNote.UseNewMenu",
		// 	defaultValue: "Disabled",
		// 	name: "[Beta] Use new menu and workflow management. Note: On small screens the menu will always be at the top.",
		// 	type: "combo",
		// 	options: ["Disabled", "Top", "Bottom"],
		// 	onChange: async (v) => {
		// 		if (v && v !== "Disabled") {
		// 			if (!resizeHandler) {
		// 				resizeHandler = () => {
		// 					this.calculateSizeBreak();
		// 				};
		// 				window.addEventListener("resize", resizeHandler);
		// 			}
		// 			this.updatePosition(v);
		// 		} else {
		// 			if (resizeHandler) {
		// 				window.removeEventListener("resize", resizeHandler);
		// 				resizeHandler = null;
		// 			}
		// 			document.body.style.removeProperty("display");
		// 			app.ui.menuContainer.style.removeProperty("display");
		// 			this.element.style.display = "none";
		// 			app.ui.restoreMenuPosition();
		// 		}
		// 		window.dispatchEvent(new Event("resize"));
		// 	},
		// });
    }

    updatePosition(v) {
		document.body.style.display = "grid";
		this.app.ui.menuContainer.style.display = "none";
		this.element.style.removeProperty("display");
		this.position = v;
		if (v === "Bottom") {
			this.app.bodyBottom.append(this.element);
		} else {
			this.app.bodyTop.prepend(this.element);
		}
		this.calculateSizeBreak();
	}

    updateSizeBreak(idx, prevIdx, direction) {
		const newSize = this.#sizeBreaks[idx];
		if (newSize === this.#sizeBreak) return;
		this.#cachedInnerSize = null;
		clearTimeout(this.#cacheTimeout);

		this.#sizeBreak = this.#sizeBreaks[idx];
		for (let i = 0; i < this.#sizeBreaks.length; i++) {
			const sz = this.#sizeBreaks[i];
			if (sz === this.#sizeBreak) {
				this.element.classList.add(sz);
			} else {
				this.element.classList.remove(sz);
			}
			if (i < idx) {
				this.element.classList.add("lt-" + sz);
			} else {
				this.element.classList.remove("lt-" + sz);
			}
		}

		if (idx) {
			// We're on a small screen, force the menu at the top
			if (this.position !== "Top") {
				this.updatePosition("Top");
			}
		} else if (this.position != this.menuPositionSetting.value) {
			// Restore user position
			this.updatePosition(this.menuPositionSetting.value);
		}

		// Allow multiple updates, but prevent bouncing
		if (!direction) {
			direction = prevIdx - idx;
		} else if (direction != prevIdx - idx) {
			return;
		}
		this.calculateSizeBreak(direction);
	}

    calculateSizeBreak(direction = 0) {
		let idx = this.#sizeBreaks.indexOf(this.#sizeBreak);
		const currIdx = idx;
		const innerSize = this.calculateInnerSize(idx);
		if (window.innerWidth >= this.#lastSizeBreaks[this.#sizeBreaks[idx - 1]]) {
			if (idx > 0) {
				idx--;
			}
		} else if (innerSize > this.element.clientWidth) {
			this.#lastSizeBreaks[this.#sizeBreak] = Math.max(window.innerWidth, innerSize);
			// We need to shrink
			if (idx < this.#sizeBreaks.length - 1) {
				idx++;
			}
		}

		this.updateSizeBreak(idx, currIdx, direction);
	}

    calculateInnerSize(idx) {
		// Cache the inner size to prevent too much calculation when resizing the window
		clearTimeout(this.#cacheTimeout);
		if (this.#cachedInnerSize) {
			// Extend cache time
			this.#cacheTimeout = setTimeout(() => (this.#cachedInnerSize = null), 100);
		} else {
			let innerSize = 0;
			let count = 1;
			for (const c of this.element.children) {
				if (c.classList.contains("nodenote-menu-push")) continue; // ignore right push
				if (idx && c.classList.contains("nodenote-menu-mobile-collapse")) continue; // ignore collapse items
				innerSize += c.clientWidth;
				count++;
			}
			innerSize += 8 * count;
			this.#cachedInnerSize = innerSize;
			this.#cacheTimeout = setTimeout(() => (this.#cachedInnerSize = null), 100);
		}
		return this.#cachedInnerSize;
	}

    	/**
	 * @param {string} [filename]
	 * @param { "workflow" | "output" } [promptProperty]
	 */
	async exportWorkflow(filename, promptProperty) {
		if (this.app.workflowManager.activeWorkflow?.path) {
			filename = this.app.workflowManager.activeWorkflow.name;
		}
		const p = await this.app.graphToPrompt();
		const json = JSON.stringify(p[promptProperty], null, 2);
		const blob = new Blob([json], { type: "application/json" });
		const file = this.getFilename(filename);
		if (!file) return;
		downloadBlob(file, blob);
	}
}