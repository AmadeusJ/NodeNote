// import { LGraphNode } from "../../lib/litegraph/litegraph.js";

class NoteNode extends LGraphNode {
    constructor() {
        super();
        this.title = "My Custom Node";
        this.addInput("Input", "number");
        this.addOutput("Output", "number");
    }

    onExecute() {
        let value = this.getInputData(0);
        if (value !== undefined) {
            this.setOutputData(0, value * 2);
        }
    }
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

export default NoteNode