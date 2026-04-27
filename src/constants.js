export const STEPS = [
    { id: 0, key: "input", icon: "✦", label: "My App", desc: "Tell us what you built" },
    { id: 1, key: "analyze", icon: "◎", label: "What Could Break", desc: "AI finds the risks" },
    { id: 2, key: "test", icon: "≡", label: "Test Your App", desc: "Check, mark, ship" },
    { id: 3, key: "automate", icon: "⟨⟩", label: "Automate or Not", desc: "What's worth automating" },
];

export const MODEL = "claude-sonnet-4-6";

// Pricing per token for cost estimation in the UI
export const MODEL_PRICING = {
  "claude-sonnet-4-6": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  "claude-opus-4-6":   { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  "claude-haiku-4-5-20251001": { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
};