export function sanitizeNodeName(string) {
	let entityMap = {
	'&': '',
	'<': '',
	'>': '',
	'"': '',
	"'": '',
	'`': '',
	'=': ''
	};
	return String(string).replace(/[&<>"'`=]/g, function fromEntityMap (s) {
		return entityMap[s];
	});
}

/**
 * @typedef {  string | string[] | Record<string, boolean> } ClassList
 */

/**
 * @param { HTMLElement } element
 * @param { ClassList } classList
 * @param { string[] } requiredClasses
 */
export function applyClasses(element, classList, ...requiredClasses) {
	classList ??="";

	let str;
	if (typeof classList === "string") {
		str = classList;
	} else if (classList instanceof Array) {
		str = classList.join(" ");
	} else {
		str = Object.entries(classList).reduce((p, c) => {
			if (c[1]) {
				p += (p.length ? " " : "") + c[0];
			}
			return p;
		}, "");
	}
	element.className = str;
	if (requiredClasses) {
		element.classList.add(...requiredClasses);
	}
}


/**
 * @param { HTMLElement } element
 * @param { { onHide?: (el: HTMLElement) => void, onShow?: (el: HTMLElement, value) => void } } [param1]
 * @returns
 */
export function toggleElement(element, { onHide, onShow } = {}) {
	let placeholder;
	let hidden;
	return (value) => {
		if (value) {
			if (hidden) {
				hidden = false;
				placeholder.replaceWith(element);
			}
			onShow?.(element, value);
		} else {
			if (!placeholder) {
				placeholder = document.createComment("");
			}
			hidden = true;
			element.replaceWith(placeholder);
			onHide?.(element);
		}
	};
}


/**
 * @template T
 * @param {string} name
 * @param {T} [defaultValue]
 * @param {(currentValue: any, previousValue: any)=>void} [onChanged]
 * @returns {T}
 */
export function prop(target, name, defaultValue, onChanged) {
	let currentValue;
	Object.defineProperty(target, name, {
		get() {
			return currentValue;
		},
		set(newValue) {
			const prevValue = currentValue;
			currentValue = newValue;
			onChanged?.(currentValue, prevValue, target, name);
		},
	});
	return defaultValue;
}


// Simple date formatter
const parts = {
	d: (d) => d.getDate(),
	M: (d) => d.getMonth() + 1,
	h: (d) => d.getHours(),
	m: (d) => d.getMinutes(),
	s: (d) => d.getSeconds(),
};
const format =
	Object.keys(parts)
		.map((k) => k + k + "?")
		.join("|") + "|yyy?y?";

function formatDate(text, date) {
	return text.replace(new RegExp(format, "g"), function (text) {
		if (text === "yy") return (date.getFullYear() + "").substring(2);
		if (text === "yyyy") return date.getFullYear();
		if (text[0] in parts) {
			const p = parts[text[0]](date);
			return (p + "").padStart(text.length, "0");
		}
		return text;
	});
}

