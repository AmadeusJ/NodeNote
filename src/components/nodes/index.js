import { NoteNode } from "./Note.js"

export function registNodes() {
  LiteGraph.registerNodeType("utils/", NoteNode)

}
