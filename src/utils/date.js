export function resolveDateString(input) {
  if (input) {
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(input);
    if (!ok) {
      throw new Error("--date must be YYYY-MM-DD");
    }
    return input;
  }

  return new Date().toISOString().slice(0, 10);
}
