use wasm_bindgen::prelude::*;
use crate::graph::Graph;
use crate::json::deserialize_json;


#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub struct GraphRef {
    graph: Graph
}

#[wasm_bindgen]
impl GraphRef {
    #[wasm_bindgen(constructor)]
    pub fn new(json: &str) -> GraphRef {
        GraphRef {graph: deserialize_json(json).unwrap()}
    }

    pub fn print(&self) {
        log(&format!("{:?}", self.graph));
    }
}