import { Note } from "./Note.js"


export function registNodes() {
  LiteGraph.registerNodeType("basic/util", Note)

}
