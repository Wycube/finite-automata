#[derive(Debug)]
pub struct Graph {
    pub states: Vec<(String, bool)>,
    pub transitions: Vec<(usize, usize, Option<char>)>,
    pub start: usize
}

impl Graph {
    pub fn alphabet(&self) -> Vec<char> {
        let mut set = Vec::new();
        for t in self.transitions.iter() {
            if t.2.is_some() && !set.contains(&t.2.unwrap()) {
                set.push(t.2.unwrap());
            }
        }

        set
    }

    pub fn valid(&self) -> bool {
        for t in self.transitions.iter() {
            if t.0 >= self.states.len() || t.1 >= self.states.len() {
                return false;
            }
        }

        true
    }

    pub fn is_dfa(&self) -> bool {
        let alphabet = self.alphabet();

        //Check that each state has one transition for every symbol
        for i in 0..self.states.len() {
            let mut has_symbols = Vec::new();
            has_symbols.resize(alphabet.len(), false);
            for t in self.transitions.iter() {
                //Check that there are no epsilon states
                if t.2.is_none() {
                    return false;
                }

                //Check that transitions have valid states
                if t.0 >= self.states.len() || t.1 >= self.states.len() {
                    return false;
                }

                let index = alphabet.iter().enumerate().find(|(_, c)| **c == t.2.unwrap()).unwrap().0;
                if t.0 == i {
                    if has_symbols[index] {
                        //No extra transitions for a symbol
                        return false;
                    }
                    has_symbols[index] = true;
                }
            }

            if !has_symbols.iter().all(|&a| a == true) {
                return false;
            }
        }

        true
    }

    pub fn decide_dfa(&self, string: &str) -> bool {
        let mut state = self.start;
        for c in string.chars() {
            for t in self.transitions.iter() {
                if t.0 == state && t.2 == Some(c) {
                    state = t.1;
                    break;
                }
            }
        }

        self.states[state].1
    }

    pub fn decide_nfa(&self, string: &str) -> bool {
        let mut states = Vec::new();
        states.resize(self.states.len(), false);
        let mut new_states = Vec::new();
        new_states.resize(self.states.len(), false);

        //Initial epsilon moves
        {
            let mut epsilon_stack = Vec::new();
            epsilon_stack.push(self.start);

            while !epsilon_stack.is_empty() {
                let new_state = epsilon_stack.pop().unwrap();
                for tt in self.transitions.iter() {
                    if tt.0 == new_state && tt.2 == None {
                        if new_states[tt.1] {
                            continue;
                        }
                        new_states[tt.1] = true;
                        epsilon_stack.push(tt.1);
                    }
                }
            }

            states.copy_from_slice(new_states.as_slice());
            new_states.clear();
            new_states.resize(self.states.len(), false);
        }
        
        states[self.start] = true;
        for c in string.chars() {
            for (i, state) in states.iter().enumerate() {
                if !state {
                    continue;
                }

                for t in self.transitions.iter() {
                    if t.0 == i && t.2 == Some(c) {
                        new_states[t.1] = true;
                    }

                    //Epsilon moves
                    if t.0 == i && t.2 == None {
                        new_states[t.1] = true;
                        let mut epsilon_stack = Vec::new();
                        epsilon_stack.push(t.1);
                        
                        while !epsilon_stack.is_empty() {
                            let new_state = epsilon_stack.pop().unwrap();
                            for tt in self.transitions.iter() {
                                if tt.0 == new_state && tt.2 == None {
                                    if new_states[tt.1] {
                                        continue;
                                    }
                                    new_states[tt.1] = true;
                                    epsilon_stack.push(tt.1);
                                }
                            }
                        }
                    }
                }
            }

            states.copy_from_slice(new_states.as_slice());
            new_states.clear();
            new_states.resize(self.states.len(), false);
        }

        states.iter().enumerate().map(|(i, &s)| s && self.states[i].1).reduce(|a, b| a || b).unwrap()
    }
}