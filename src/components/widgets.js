import "./domWidget.js";

export function updateControlWidgetLabel(widget) {
	let replacement = "after";
	let find = "before";
	if (controlValueRunBefore) {
		[find, replacement] = [replacement, find]
	}
	widget.label = (widget.label ?? widget.name).replace(find, replacement);
}

const IS_CONTROL_WIDGET = Symbol();

function addMultilineWidget(node, name, opts, app) {
	const inputEl = document.createElement("textarea");
	inputEl.className = "NodeNote-multiline-input";
	inputEl.value = opts.defaultVal;
	inputEl.placeholder = opts.placeholder || name;

	const widget = node.addDOMWidget(name, "customtext", inputEl, {
		getValue() {
			return inputEl.value;
		},
		setValue(v) {
			inputEl.value = v;
		},
	});
	widget.inputEl = inputEl;

	inputEl.addEventListener("input", () => {
		widget.callback?.(widget.value);
	});

	return { minWidth: 400, minHeight: 200, widget };
}

export const NodeNoteWidget = {
    STRING(node, inputName, inputData, app) {
		const defaultVal = inputData[1].default || "";
		const multiline = !!inputData[1].multiline;

		let res;
		if (multiline) {
			res = addMultilineWidget(node, inputName, { defaultVal, ...inputData[1] }, app);
		} else {
			res = { widget: node.addWidget("text", inputName, defaultVal, () => {}, {}) };
		}

		if(inputData[1].dynamicPrompts != undefined)
			res.widget.dynamicPrompts = inputData[1].dynamicPrompts;

		return res;
	},
}