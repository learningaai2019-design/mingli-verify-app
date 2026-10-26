/**
 * Optional LLM enhancement. Never required.
 * Never write prompts containing PII to disk.
 */
export function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export async function optionalPolish(text: string): Promise<string> {
  // Intentionally unused by default — template engines are the product.
  // Hook point for future in-memory polish only.
  void text;
  return text;
}
