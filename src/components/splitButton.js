import { $el } from "./element.js";
import { prop } from "../utils/tools.js";
import { NodeNoteButton } from "./button.js";
import { NodeNotePopup } from "./popup.js";

export class NodeNoteSplitButton {
    	/**
	 *  @param {{
	 * 		primary: ComfyButton,
        * 		mode?: "hover" | "click",
        * 		horizontal?: "left" | "right",
        * 		position?: "relative" | "absolute"
        *  }} param0
        *  @param {Array<ComfyButton> | Array<HTMLElement>} items
        */
       constructor({ primary, mode, horizontal = "left", position = "relative" }, ...items) {
           this.arrow = new NodeNoteButton({
               icon: "chevron-down",
           });
           this.element = $el("div.nodenote-split-button" + (mode === "hover" ? ".hover" : ""), [
               $el("div.nodenote-split-primary", primary.element),
               $el("div.nodenote-split-arrow", this.arrow.element),
           ]);
           this.popup = new NodeNotePopup({
               target: this.element,
               container: position === "relative" ? this.element : document.body,
               classList: "nodenote-split-button-popup" + (mode === "hover" ? " hover" : ""),
               closeOnEscape: mode === "click",
               position,
               horizontal,
           });
   
           this.arrow.withPopup(this.popup, mode);
   
           this.items = prop(this, "items", items, () => this.update());
       }
   
       update() {
           this.popup.element.replaceChildren(...this.items.map((b) => b.element ?? b));
       }
}