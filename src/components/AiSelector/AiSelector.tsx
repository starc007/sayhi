import React from "react";
import { AiProvider } from "../../utils/types";

const AI_PROVIDERS: AiProvider[] = [
  {
    name: "Claude",
    id: "claude",
    description: "Anthropic's Claude AI",
  },
  {
    name: "Gemini",
    id: "gemini",
    description: "Google's Gemini AI",
  },
];

interface AiSelectorProps {
  selectedProvider: string;
  onSelect: (provider: string) => void;
  disabled?: boolean;
}

function AiSelector({ selectedProvider, onSelect, disabled }: AiSelectorProps) {
  return (
    <select
      value={selectedProvider}
      onChange={(e) => onSelect(e.target.value)}
      disabled={disabled}
      className="px-1.5 py-1.5 rounded-lg text-sm bg-gray-100 border border-gray-200 focus:outline-none focus:border-black"
    >
      {AI_PROVIDERS.map((provider) => (
        <option key={provider.id} value={provider.id}>
          {provider.name}
        </option>
      ))}
    </select>
  );
}

export default AiSelector;
