fn main() {
    let odd_1s = automata::graph::Graph {
        states: vec![(String::from("q1"), false), (String::from("q2"), true)],
        transitions: vec![(0, 0, Some('0')), (0, 1, Some('1')), (1, 0, Some('1')), (1, 1, Some('0'))],
        start: 0};
    let stdin = std::io::stdin();
    println!("{:?}", odd_1s);
    println!("Alphabet: {:?}", odd_1s.alphabet());
    println!("Valid DFA: {}", odd_1s.is_dfa());

    loop {
        let mut input = String::new();
        stdin.read_line(&mut input).unwrap();
        let trimmed = input.trim_end();
        println!("Result for {}: {}", trimmed, odd_1s.decide_dfa(trimmed));
    }
}
