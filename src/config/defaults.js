export function getDefaultConfig() {
  return {
    urlLimit: 130,
    scanner: {
      concurrency: 2,
      lighthouseContexts: [
        { form_factor: "desktop", color_scheme: "light" },
        { form_factor: "desktop", color_scheme: "dark" },
        { form_factor: "mobile", color_scheme: "light" },
        { form_factor: "mobile", color_scheme: "dark" }
      ]
    }
  };
}
