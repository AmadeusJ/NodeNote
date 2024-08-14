// import { LGraphNode } from "../../lib/litegraph/litegraph.js";
import { app } from "../../app.js"
import { NodeNoteWidget } from "../widgets.js";

function Note() {
    this.title = "Note";
    this.properties = {};
    this.properties.text="";

    const inputEl = document.createElement("textarea");
	inputEl.className = "nodenote-multiline-input";
    inputEl.value = this.properties.text
    this.addDOMWidget("text", 'Customtext', inputEl, {
        getValue() {
            return inputEl.value;
        },
        setValue(v) {
            inputEl.value = v;
        },
    })
    // NodeNoteWidget.STRING(this, "", ["", { default: this.properties.text, multiline: true }], app)

}

export const NoteNode = Note;