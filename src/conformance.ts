// JSON Schema validation backed by the bundled spec schemas.

import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import outcomeSchema from "../schemas/outcome.schema.json" with { type: "json" };
import verdictSchema from "../schemas/verdict.schema.json" with { type: "json" };
import evidenceSchema from "../schemas/evidence.schema.json" with { type: "json" };

export const SPEC_VERSION = "0.1.0";

function buildAjv(): Ajv {
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(evidenceSchema);
  ajv.addSchema(outcomeSchema);
  ajv.addSchema(verdictSchema);
  return ajv;
}

const ajv = buildAjv();
const validateOutcomeFn = ajv.compile(outcomeSchema);
const validateVerdictFn = ajv.compile(verdictSchema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateOutcome(data: unknown): ValidationResult {
  const ok = validateOutcomeFn(data);
  return {
    valid: !!ok,
    errors: (validateOutcomeFn.errors ?? []).map(
      (e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`,
    ),
  };
}

export function validateVerdict(data: unknown): ValidationResult {
  const ok = validateVerdictFn(data);
  return {
    valid: !!ok,
    errors: (validateVerdictFn.errors ?? []).map(
      (e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`,
    ),
  };
}

export { outcomeSchema, verdictSchema, evidenceSchema };
