// import { LGraphNode } from "../../lib/litegraph/litegraph.js";

function NoteNode() {
    this.title = "Note";
    this.addInput("Input", "number");
    this.addOutput("Output", "number");

    // color=LGraphCanvas.node_colors.yellow.color;
    // bgcolor=LGraphCanvas.node_colors.yellow.bgcolor;
    // groupcolor = LGraphCanvas.node_colors.yellow.groupcolor;
    // constructor() {
    //     if (!this.properties) {
    //         this.properties = {};
    //         this.properties.text="";
    //     }

    //     NodeNoteWidget.STRING(this, "", ["", {default:this.properties.text, multiline: true}], app)

    //     this.serialize_widgets = true;
    //     this.isVirtualNode = true;

    // }

}

// app.graph.registerNodeType(
//     "Note",
//     Object.assign(NoteNode, {
//         title_mode: LiteGraph.NORMAL_TITLE,
//         title: "Note",
//         collapsable: true,
//     })
// );

// NoteNode.category = "utils";

export const Note = NoteNode;