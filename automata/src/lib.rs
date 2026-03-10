pub mod graph;
pub mod json;

#[cfg(target_arch = "wasm32")]
pub mod web;

#[cfg(test)]
mod test {
    #[test]
    fn test_json() {
        let json = include_str!("../../test.json");
        let graph = crate::json::deserialize_json(json);
        print!("{:?}", graph);
        assert!(graph.is_ok());
        assert!(graph.unwrap().valid());
    }
}