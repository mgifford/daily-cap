import { loadConfig } from "./loader.js";

let _config = null;

function getConfig() {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}

/**
 * Return the default runtime config, loaded and validated from config.yaml.
 *
 * The shape is preserved for compatibility with run.js:
 *   config.urlLimit
 *   config.scanner.concurrency
 *   config.scanner.lighthouseContexts
 */
export function getDefaultConfig() {
  const config = getConfig();
  return {
    urlLimit: config.scan.url_limit,
    scanner: {
      concurrency: config.scan.concurrency,
      lighthouseContexts: config.scan.lighthouse_contexts
    }
  };
}
