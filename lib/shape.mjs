// The service's schema check (brain schema-check.ts), so a delivery is checked here exactly as the grade route checks
// it before either model is asked: the result must be one JSON value, bare or in one fenced block.

const MAX_PROBLEMS = 20;
const RESULT_FENCE = /^```(?:json)?[^\S\n]*\n([\s\S]*?)\n?```$/i;

const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const typeOf = (value) => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value === "number" && Number.isInteger(value) ? "integer" : typeof value);

function matches(value, schema, path, problems) {
  if (problems.length >= MAX_PROBLEMS) return;
  const types = Array.isArray(schema.type) ? schema.type : schema.type === undefined ? [] : [schema.type];
  const actual = typeOf(value);
  if (types.length > 0 && !types.includes(actual) && !(actual === "integer" && types.includes("number"))) {
    problems.push(`${path} is ${actual}, the schema asks for ${types.join(" or ")}`);
    return;
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((option) => JSON.stringify(option) === JSON.stringify(value))) problems.push(`${path} is not one of the allowed values`);
  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) problems.push(`${path} is shorter than ${schema.minLength} characters`);
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) problems.push(`${path} is longer than ${schema.maxLength} characters`);
  }
  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) problems.push(`${path} is below ${schema.minimum}`);
    if (typeof schema.maximum === "number" && value > schema.maximum) problems.push(`${path} is above ${schema.maximum}`);
  }
  if (actual === "object") {
    const properties = schema.properties ?? {};
    for (const name of schema.required ?? []) if (!Object.hasOwn(value, name)) problems.push(`${path}.${name} is missing`);
    for (const [name, field] of Object.entries(value)) {
      if (Object.hasOwn(properties, name)) matches(field, properties[name], `${path}.${name}`, problems);
      else if (schema.additionalProperties === false) problems.push(`${path}.${name} is not in the schema`);
    }
  }
  if (actual === "array" && isRecord(schema.items)) value.forEach((item, i) => matches(item, schema.items, `${path}[${i}]`, problems));
}

/** The shape the grade route reports for a result against a schema: { outcome, problems? }. */
export function checkShape(result, schema) {
  const text = result.trim();
  const body = RESULT_FENCE.exec(text)?.[1] ?? text;
  let value;
  try {
    value = JSON.parse(body);
  } catch {
    return { outcome: "failed", problems: ["the result is not one JSON value"] };
  }
  const problems = [];
  matches(value, schema, "result", problems);
  return problems.length === 0 ? { outcome: "passed" } : { outcome: "failed", problems: problems.slice(0, MAX_PROBLEMS) };
}
