import { $el } from "./components/element.js";
import { NoteNode } from "./components/nodes/Note.js"
export const ANIM_PREVIEW_WIDGET = "$$nn_animation_preview";


export class NodeNoteApp {

    constructor() {
        this.bodyTop = $el("div.NodeNote-body-top", { parent: document.body });
		this.bodyLeft = $el("div.NodeNote-body-left", { parent: document.body });
		this.bodyRight = $el("div.NodeNote-body-right", { parent: document.body });
		this.bodyBottom = $el("div.NodeNote-body-bottom", { parent: document.body });	
    }

    /**
     * Main App start function
     */

    async main() {
        // Create and mount the LiteGraph in the DOM
		const mainCanvas = document.createElement("canvas")
		mainCanvas.style.touchAction = "none"
		const canvasEl = (this.canvasEl = Object.assign(mainCanvas, { id: "graph-canvas" }));
		canvasEl.tabIndex = "1";
		document.body.append(canvasEl);

		this.graph = new LGraph();

        this.graph.registerNodeType("custom/note", NoteNode);


		this.canvas = new LGraphCanvas(canvasEl, this.graph);
		this.ctx = canvasEl.getContext("2d");

		this.graph.start();

		// Ensure the canvas fills the window
		this.resizeCanvas();
		window.addEventListener("resize", () => this.resizeCanvas());
		const ro = new ResizeObserver(() => this.resizeCanvas());
		ro.observe(this.bodyTop);
		ro.observe(this.bodyLeft);
		ro.observe(this.bodyRight);
		ro.observe(this.bodyBottom);
    }

    resizeCanvas() {
		// Limit minimal scale to 1
		const scale = Math.max(window.devicePixelRatio, 1);
		
		// Clear fixed width and height while calculating rect so it uses 100% instead
		this.canvasEl.height = this.canvasEl.width = "";
		const { width, height } = this.canvasEl.getBoundingClientRect();
		this.canvasEl.width = Math.round(width * scale);
		this.canvasEl.height = Math.round(height * scale);
		this.canvasEl.getContext("2d").scale(scale, scale);
		this.canvas?.draw(true, true);
	}

    addNode(node) {

    }
}

export const app = new NodeNoteApp();