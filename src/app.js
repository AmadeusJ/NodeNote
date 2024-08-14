import { $el } from "./components/element.js";
import { registNodes } from "./components/nodes/index.js";
import { NodeNoteMenu } from "./components/menu/index.js";
import { NodeNoteUI } from "./components/views/index.js";
import { sanitizeNodeName } from "./utils/tools.js";

export const ANIM_PREVIEW_WIDGET = "$$nn_animation_preview";


export class NodeNoteApp {

    constructor() {
        this.bodyTop = $el("div.nodenote-body-top", { parent: document.body });
		this.bodyLeft = $el("div.nodenote-body-left", { parent: document.body });
		this.bodyRight = $el("div.nodenote-body-right", { parent: document.body });
		this.bodyBottom = $el("div.nodenote-body-bottom", { parent: document.body });	
		this.menu = new NodeNoteMenu(this);
		this.ui = new NodeNoteUI(this)
		this.workflowManager = null
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

		registNodes()

		this.canvas = new LGraphCanvas(canvasEl, this.graph);
		this.ctx = canvasEl.getContext("2d");

		this.storageLocation = 'browser'

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

		/**
	 * Converts the current graph workflow for sending to the API
	 * @returns The workflow and node links
	 */
		async graphToPrompt(graph = this.graph, clean = true) {
			for (const outerNode of graph.computeExecutionOrder(false)) {
				if (outerNode.widgets) {
					for (const widget of outerNode.widgets) {
						// Allow widgets to run callbacks before a prompt has been queued
						// e.g. random seed before every gen
						widget.beforeQueued?.();
					}
				}
	
				const innerNodes = outerNode.getInnerNodes ? outerNode.getInnerNodes() : [outerNode];
				for (const node of innerNodes) {
					if (node.isVirtualNode) {
						// Don't serialize frontend only nodes but let them make changes
						if (node.applyToGraph) {
							node.applyToGraph();
						}
					}
				}
			}
	
			const workflow = graph.serialize();
			const output = {};
			// Process nodes in order of execution
			for (const outerNode of graph.computeExecutionOrder(false)) {
				const skipNode = outerNode.mode === 2 || outerNode.mode === 4;
				const innerNodes = (!skipNode && outerNode.getInnerNodes) ? outerNode.getInnerNodes() : [outerNode];
				for (const node of innerNodes) {
					if (node.isVirtualNode) {
						continue;
					}
	
					if (node.mode === 2 || node.mode === 4) {
						// Don't serialize muted nodes
						continue;
					}
	
					const inputs = {};
					const widgets = node.widgets;
	
					// Store all widget values
					if (widgets) {
						console.log(widgets)
						for (const i in widgets) {
							const widget = widgets[i];
							// console.log('here: ', widgets, widget.serializeValue, widget.serializeValue(node, i), widget.value)
							if (!widget.options || widget.options.serialize !== false) {
								console.log(widget.value)
								inputs[widget.name] = widget.value//widget.serializeValue ? await widget.serializeValue(node, i) : widget.value;
							}
						}
					}
	
					// Store all node links
					for (let i in node.inputs) {
						let parent = node.getInputNode(i);
						if (parent) {
							let link = node.getInputLink(i);
							while (parent.mode === 4 || parent.isVirtualNode) {
								let found = false;
								if (parent.isVirtualNode) {
									link = parent.getInputLink(link.origin_slot);
									if (link) {
										parent = parent.getInputNode(link.target_slot);
										if (parent) {
											found = true;
										}
									}
								} else if (link && parent.mode === 4) {
									let all_inputs = [link.origin_slot];
									if (parent.inputs) {
										all_inputs = all_inputs.concat(Object.keys(parent.inputs))
										for (let parent_input in all_inputs) {
											parent_input = all_inputs[parent_input];
											if (parent.inputs[parent_input]?.type === node.inputs[i].type) {
												link = parent.getInputLink(parent_input);
												if (link) {
													parent = parent.getInputNode(parent_input);
												}
												found = true;
												break;
											}
										}
									}
								}
	
								if (!found) {
									break;
								}
							}
	
							if (link) {
								if (parent?.updateLink) {
									link = parent.updateLink(link);
								}
								if (link) {
									inputs[node.inputs[i].name] = [String(link.origin_id), parseInt(link.origin_slot)];
								}
							}
						}
						console.log('ddddd', i)
					}
	
					let node_data = {
						inputs,
						class_type: node.comfyClass,
					};
	
					// if (this.ui.settings.getSettingValue("Comfy.DevMode")) {
					// 	// Ignored by the backend.
					// 	node_data["_meta"] = {
					// 		title: node.title,
					// 	}
					// }
	
					output[String(node.id)] = node_data;
				}
			}
	
			// Remove inputs connected to removed nodes
			if(clean) {
				for (const o in output) {
					for (const i in output[o].inputs) {
						if (Array.isArray(output[o].inputs[i])
							&& output[o].inputs[i].length === 2
							&& !output[output[o].inputs[i][0]]) {
							delete output[o].inputs[i];
						}
					}
				}
			}
	
			return { workflow, output };
		}
		
	/**
	 * Loads workflow data from the specified file
	 * @param {File} file
	 */
	async handleFile(file) {
		const removeExt = f => {
			if(!f) return f;
			const p = f.lastIndexOf(".");
			if(p === -1) return f;
			return f.substring(0, p);
		};

		const fileName = removeExt(file.name);
		if (file.type === "image/png") {
			const pngInfo = await getPngMetadata(file);
			if (pngInfo?.workflow) {
				await this.loadGraphData(JSON.parse(pngInfo.workflow), true, true, fileName);
			} else if (pngInfo?.prompt) {
				this.loadApiJson(JSON.parse(pngInfo.prompt), fileName);
			} else if (pngInfo?.parameters) {
				this.changeWorkflow(() => {
					importA1111(this.graph, pngInfo.parameters);
				}, fileName)
			} else {
				this.showErrorOnFileLoad(file);
			}
		} else if (file.type === "image/webp") {
			const pngInfo = await getWebpMetadata(file);
			// Support loading workflows from that webp custom node.
			const workflow = pngInfo?.workflow || pngInfo?.Workflow;
			const prompt = pngInfo?.prompt || pngInfo?.Prompt;

			if (workflow) {
				this.loadGraphData(JSON.parse(workflow), true, true, fileName);
			} else if (prompt) {
				this.loadApiJson(JSON.parse(prompt), fileName);
			} else {
				this.showErrorOnFileLoad(file);
			}
		} else if (file.type === "audio/flac" || file.type === "audio/x-flac") {
			const pngInfo = await getFlacMetadata(file);
			// Support loading workflows from that webp custom node.
			const workflow = pngInfo?.workflow;
			const prompt = pngInfo?.prompt;

			if (workflow) {
				this.loadGraphData(JSON.parse(workflow), true, true, fileName);
			} else if (prompt) {
				this.loadApiJson(JSON.parse(prompt), fileName);
			} else {
				this.showErrorOnFileLoad(file);
			}
		} else if (file.type === "application/json" || file.name?.endsWith(".json")) {
			const reader = new FileReader();
			reader.onload = async () => {
				const jsonContent = JSON.parse(reader.result);
				if (jsonContent?.templates) {
					this.loadTemplateData(jsonContent);
				} else if(this.isApiJson(jsonContent)) {
					this.loadApiJson(jsonContent, fileName);
				} else {
					await this.loadGraphData(jsonContent, true, true, fileName);
				}
			};
			reader.readAsText(file);
		} else if (file.name?.endsWith(".latent") || file.name?.endsWith(".safetensors")) {
			const info = await getLatentMetadata(file);
			if (info.workflow) {
				await this.loadGraphData(JSON.parse(info.workflow), true, true, fileName);
			} else if (info.prompt) {
				this.loadApiJson(JSON.parse(info.prompt));
			} else {
				this.showErrorOnFileLoad(file);
			}
		} else {
			this.showErrorOnFileLoad(file);
		}
	}

	/**
	 * Populates the graph with the specified workflow data
	 * @param {*} graphData A serialized graph object
	 * @param { boolean } clean If the graph state, e.g. images, should be cleared
	 * @param { boolean } restore_view If the graph position should be restored
	 * @param { import("./workflows.js").ComfyWorkflowInstance | null } workflow The workflow
	 */
	async loadGraphData(graphData, clean = true, restore_view = true, workflow = null) {
		if (clean !== false) {
			this.clean();
		}

		let reset_invalid_values = false;
		if (!graphData) {
			graphData = defaultGraph;
			reset_invalid_values = true;
		}

		if (typeof structuredClone === "undefined")
		{
			graphData = JSON.parse(JSON.stringify(graphData));
		}else
		{
			graphData = structuredClone(graphData);
		}

		console.log('workflow: ', workflow)
		// try {
		// 	this.workflowManager.setWorkflow(workflow);
		// } catch (error) {
		// 	console.error(error);
		// }

		const missingNodeTypes = [];
		// await this.#invokeExtensionsAsync("beforeConfigureGraph", graphData, missingNodeTypes);
		for (let n of graphData.nodes) {
			// Patch T2IAdapterLoader to ControlNetLoader since they are the same node now
			// if (n.type == "T2IAdapterLoader") n.type = "ControlNetLoader";
			// if (n.type == "ConditioningAverage ") n.type = "ConditioningAverage"; //typo fix
			// if (n.type == "SDV_img2vid_Conditioning") n.type = "SVD_img2vid_Conditioning"; //typo fix

			// Find missing node types
			if (!(n.type in LiteGraph.registered_node_types)) {
				missingNodeTypes.push(n.type);
				n.type = sanitizeNodeName(n.type);
			}
		}

		try {
			this.graph.configure(graphData);
			if (restore_view && this.enableWorkflowViewRestore.value && graphData.extra?.ds) {
				this.canvas.ds.offset = graphData.extra.ds.offset;
				this.canvas.ds.scale = graphData.extra.ds.scale;
			}
			
			try {
				this.workflowManager.activeWorkflow?.track()
			} catch (error) {
			}
		} catch (error) {
			let errorHint = [];
			// Try extracting filename to see if it was caused by an extension script
			const filename = error.fileName || (error.stack || "").match(/(\/extensions\/.*\.js)/)?.[1];
			const pos = (filename || "").indexOf("/extensions/");
			if (pos > -1) {
				errorHint.push(
					$el("span", { textContent: "This may be due to the following script:" }),
					$el("br"),
					$el("span", {
						style: {
							fontWeight: "bold",
						},
						textContent: filename.substring(pos),
					})
				);
			}

			// Show dialog to let the user know something went wrong loading the data
			this.ui.dialog.show(
				$el("div", [
					$el("p", { textContent: "Loading aborted due to error reloading workflow data" }),
					$el("pre", {
						style: { padding: "5px", backgroundColor: "rgba(255,0,0,0.2)" },
						textContent: error.toString(),
					}),
					$el("pre", {
						style: {
							padding: "5px",
							color: "#ccc",
							fontSize: "10px",
							maxHeight: "50vh",
							overflow: "auto",
							backgroundColor: "rgba(0,0,0,0.2)",
						},
						textContent: error.stack || "No stacktrace available",
					}),
					...errorHint,
				]).outerHTML
			);

			return;
		}

		for (const node of this.graph._nodes) {
			const size = node.computeSize();
			size[0] = Math.max(node.size[0], size[0]);
			size[1] = Math.max(node.size[1], size[1]);
			node.size = size;

			// if (node.widgets) {
			// 	// If you break something in the backend and want to patch workflows in the frontend
			// 	// This is the place to do this
			// 	for (let widget of node.widgets) {
			// 		if (node.type == "KSampler" || node.type == "KSamplerAdvanced") {
			// 			if (widget.name == "sampler_name") {
			// 				if (widget.value.startsWith("sample_")) {
			// 					widget.value = widget.value.slice(7);
			// 				}
			// 				if (widget.value === "euler_pp" || widget.value === "euler_ancestral_pp") {
			// 					widget.value = widget.value.slice(0, -3);
			// 					for (let w of node.widgets) {
			// 						if (w.name == "cfg") {
			// 							w.value *= 2.0;
			// 						}
			// 					}
			// 				}
			// 			}
			// 		}
			// 		if (node.type == "KSampler" || node.type == "KSamplerAdvanced" || node.type == "PrimitiveNode") {
			// 			if (widget.name == "control_after_generate") {
			// 				if (widget.value === true) {
			// 					widget.value = "randomize";
			// 				} else if (widget.value === false) {
			// 					widget.value = "fixed";
			// 				}
			// 			}
			// 		}
			// 		if (reset_invalid_values) {
			// 			if (widget.type == "combo") {
			// 				if (!widget.options.values.includes(widget.value) && widget.options.values.length > 0) {
			// 					widget.value = widget.options.values[0];
			// 				}
			// 			}
			// 		}
			// 	}
			// }

			// this.#invokeExtensions("loadedGraphNode", node);
		}

		if (missingNodeTypes.length) {
			this.showMissingNodesError(missingNodeTypes);
		}
		// await this.#invokeExtensionsAsync("afterConfigureGraph", missingNodeTypes);
		requestAnimationFrame(() => {
			this.graph.setDirtyCanvas(true, true);
		});
	}


	isApiJson(data) {
		return Object.values(data).every((v) => v.class_type);
	}	

	loadApiJson(apiData, fileName) {
		const missingNodeTypes = Object.values(apiData).filter((n) => !LiteGraph.registered_node_types[n.class_type]);
		if (missingNodeTypes.length) {
			this.showMissingNodesError(missingNodeTypes.map(t => t.class_type), false);
			return;
		}

		const ids = Object.keys(apiData);
		app.graph.clear();
		for (const id of ids) {
			const data = apiData[id];
			const node = LiteGraph.createNode(data.class_type);
			node.id = isNaN(+id) ? id : +id;
			node.title = data._meta?.title ?? node.title
			app.graph.add(node);
		}

		this.changeWorkflow(() => {
			for (const id of ids) {
				const data = apiData[id];
				const node = app.graph.getNodeById(id);
				for (const input in data.inputs ?? {}) {
					const value = data.inputs[input];
					if (value instanceof Array) {
						const [fromId, fromSlot] = value;
						const fromNode = app.graph.getNodeById(fromId);
						let toSlot = node.inputs?.findIndex((inp) => inp.name === input);
						if (toSlot == null || toSlot === -1) {
							try {
								// Target has no matching input, most likely a converted widget
								const widget = node.widgets?.find((w) => w.name === input);
								if (widget && node.convertWidgetToInput?.(widget)) {
									toSlot = node.inputs?.length - 1;
								}
							} catch (error) {}
						}
						if (toSlot != null || toSlot !== -1) {
							fromNode.connect(fromSlot, node, toSlot);
						}
					} else {
						const widget = node.widgets?.find((w) => w.name === input);
						if (widget) {
							widget.value = value;
							widget.callback?.(value);
						}
					}
				}
			}
			app.graph.arrange();
		}, fileName);
	}

	clean() {

	}




}

export const app = new NodeNoteApp();