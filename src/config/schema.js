const VALID_FORM_FACTORS = new Set(["desktop", "mobile"]);
const VALID_COLOR_SCHEMES = new Set(["light", "dark"]);
const REQUIRED_SEVERITIES = ["critical", "serious", "moderate", "minor"];

function assertObject(value, name, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${name} must be an object`);
    return false;
  }
  return true;
}

function assertPositiveInteger(value, name, errors) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    errors.push(`${name} must be an integer greater than 0`);
  }
}

function assertNumberInRange(value, name, min, max, errors) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push(`${name} must be a number`);
    return;
  }
  if (value < min || value > max) {
    errors.push(`${name} must be between ${min} and ${max}, got ${value}`);
  }
}

/**
 * Validate a parsed Daily CAP config object.
 *
 * @param {unknown} config - The parsed YAML config object.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateConfig(config) {
  const errors = [];

  if (!assertObject(config, "config", errors)) {
    return { valid: false, errors };
  }

  // --- scan ---
  if (!assertObject(config.scan, "scan", errors)) {
    return { valid: false, errors };
  }

  const { scan } = config;

  assertPositiveInteger(scan.url_limit, "scan.url_limit", errors);
  assertPositiveInteger(scan.history_lookback_days, "scan.history_lookback_days", errors);
  assertPositiveInteger(scan.concurrency, "scan.concurrency", errors);

  if (scan.dashboard_display_days !== undefined) {
    assertPositiveInteger(scan.dashboard_display_days, "scan.dashboard_display_days", errors);
  }

  if (!Array.isArray(scan.lighthouse_contexts) || scan.lighthouse_contexts.length === 0) {
    errors.push("scan.lighthouse_contexts must be a non-empty array");
  } else {
    for (let i = 0; i < scan.lighthouse_contexts.length; i++) {
      const ctx = scan.lighthouse_contexts[i];
      if (!assertObject(ctx, `scan.lighthouse_contexts[${i}]`, errors)) {
        continue;
      }
      if (!VALID_FORM_FACTORS.has(ctx.form_factor)) {
        errors.push(
          `scan.lighthouse_contexts[${i}].form_factor must be one of: ${[...VALID_FORM_FACTORS].join(", ")}`
        );
      }
      if (!VALID_COLOR_SCHEMES.has(ctx.color_scheme)) {
        errors.push(
          `scan.lighthouse_contexts[${i}].color_scheme must be one of: ${[...VALID_COLOR_SCHEMES].join(", ")}`
        );
      }
    }
  }

  // --- impact ---
  if (!assertObject(config.impact, "impact", errors)) {
    return { valid: false, errors };
  }

  const { impact } = config;

  if (!assertObject(impact.prevalence_rates, "impact.prevalence_rates", errors)) {
    return { valid: false, errors };
  }

  if (Object.keys(impact.prevalence_rates).length === 0) {
    errors.push("impact.prevalence_rates must define at least one disability category");
  } else {
    for (const [key, rate] of Object.entries(impact.prevalence_rates)) {
      assertNumberInRange(rate, `impact.prevalence_rates.${key}`, 0, 1, errors);
    }
  }

  if (!assertObject(impact.severity_weights, "impact.severity_weights", errors)) {
    return { valid: false, errors };
  }

  for (const severity of REQUIRED_SEVERITIES) {
    if (!(severity in impact.severity_weights)) {
      errors.push(`impact.severity_weights.${severity} is required`);
    } else {
      assertNumberInRange(
        impact.severity_weights[severity],
        `impact.severity_weights.${severity}`,
        0,
        1,
        errors
      );
    }
  }

  assertNumberInRange(
    impact.fallback_severity_weight,
    "impact.fallback_severity_weight",
    0,
    1,
    errors
  );

  // --- sources (optional) ---
  if (config.sources !== undefined && !assertObject(config.sources, "sources", errors)) {
    // error already pushed
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
