/** Arithmetic only: numbers, named inputs, parentheses and + - * /. No executable code. */
export function evaluateExpression(source: string, variables: Record<string, number>): number {
  if (source.length > 2000) throw new Error("Formula is too long");
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)|[A-Z_][A-Z_0-9]*|[()+*/-]|\S/g) ?? [];
  let index = 0;
  function primary(): number {
    const token = tokens[index++];
    if (token === "+") return primary();
    if (token === "-") return -primary();
    if (token === "(") {
      const value = sum();
      if (tokens[index++] !== ")") throw new Error("Unbalanced formula parentheses");
      return value;
    }
    if (token && /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) return Number(token);
    if (token && Object.hasOwn(variables, token)) return variables[token];
    throw new Error(`Unknown formula input: ${token ?? "end of formula"}`);
  }
  function product(): number {
    let value = primary();
    while (tokens[index] === "*" || tokens[index] === "/") {
      const op = tokens[index++];
      const rhs = primary();
      if (op === "/" && rhs === 0) throw new Error("Division by zero");
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const op = tokens[index++];
      const rhs = product();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }
  const result = sum();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error("Invalid formula result");
  return result;
}
