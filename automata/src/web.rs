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

    pub fn alphabet(&self) -> Vec<JsValue> {
        let alphabet = self.graph.alphabet();
        // let mut js_array = Vec::<JsValue>::new();
        // for c in alphabet {
        //     js_array.push(c.into());
        // }

        // js_array
        alphabet.into_iter().map(|c| JsValue::from(String::from(c))).collect()
    }

    pub fn is_dfa(&self) -> bool {
        self.graph.is_dfa()
    }
    
    pub fn decide_dfa(&self, string: &str) -> bool {
        self.graph.decide_dfa(string)
    }

    pub fn decide_nfa(&self, string: &str) -> bool {
        self.graph.decide_nfa(string)
    }
}