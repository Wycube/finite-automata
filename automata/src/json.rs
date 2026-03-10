use crate::graph::Graph;


pub fn deserialize_json(text: &str) -> Result<Graph, &str> {
    let json: serde_json::Value = serde_json::from_str(text).unwrap();
    let mut graph = Graph {states: vec![], transitions: vec![], start: 0};

    //Get states
    let states = json.get("states").unwrap();
    if !states.is_array() {
        return Err("Expected 'states' to be an array!");
    }

    for v in states.as_array().unwrap() {
        if !v.get("name").is_some() || !v.get("accept").is_some() {
            return Err("States array is malformed!");
        }

        graph.states.push((v.get("name").unwrap().as_str().unwrap().to_string(), v.get("accept").unwrap().as_bool().unwrap()));
    }

    //Get transitions
    let transitions = json.get("transitions").unwrap();
    if !transitions.is_array() {
        return Err("Expected 'transitions' to be an array!");
    }

    for v in transitions.as_array().unwrap() {
        if !v.get("start").is_some() || !v.get("end").is_some() || !v.get("symbols").is_some() || !v.get("epsilon").is_some() {
            return Err("Transitions array is malformed!");
        }

        let start = v.get("start").unwrap().as_u64().unwrap();
        let end = v.get("end").unwrap().as_u64().unwrap();
        for symbol in v.get("symbols").unwrap().as_array().unwrap() {
            if !symbol.is_string() || symbol.as_str().iter().len() != 1 {
                return Err("Transition contains symbol not of length 1!");
            }

            graph.transitions.push((start as usize, end as usize, symbol.as_str().unwrap().chars().nth(0)));
        }

        if v.get("epsilon").unwrap().as_bool().unwrap() {
            graph.transitions.push((start as usize, end as usize, None));
        }
    }

    //Get start state
    let start = json.get("start").unwrap();
    if !start.is_u64() {
        return Err("Expected 'start' to be unsigned integer!");
    }
    graph.start = start.as_u64().unwrap() as usize;

    //Verify the graph is valid
    if !graph.valid() {
        return Err("Graph is invalid, i.e. some transitions or the start state contain an invalid index!");
    }

    Ok(graph)
}