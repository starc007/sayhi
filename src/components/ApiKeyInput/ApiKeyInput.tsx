import React, { useState } from "react";
import { ClaudeService } from "../../services/claude.service";
import { GeminiService } from "../../services/gemini.service";
import { AiProvider, ApiConfig } from "../../utils/types";

interface ApiKeyInputProps {
  onApiKeySet: () => void;
}

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

function ApiKeyInput({ onApiKeySet }: ApiKeyInputProps) {
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(
    AI_PROVIDERS[0]
  );
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }

    try {
      const config: ApiConfig = {
        provider: selectedProvider.id,
        claudeApiKey:
          selectedProvider.id === "claude" ? apiKey.trim() : undefined,
        geminiApiKey:
          selectedProvider.id === "gemini" ? apiKey.trim() : undefined,
      };

      // Initialize the selected provider
      let success = false;
      if (selectedProvider.id === "claude") {
        await ClaudeService.saveApiConfig(config);
        success = await ClaudeService.initialize();
      } else {
        success = await GeminiService.initialize(apiKey.trim());
        if (success) {
          await chrome.storage.local.set({ aiConfig: config });
        }
      }

      if (success) {
        onApiKeySet();
      } else {
        setError("Failed to initialize AI provider");
      }
    } catch (err) {
      console.error("Error saving API key:", err);
      setError("Failed to save API key");
    }
  };

  const handleReset = async () => {
    try {
      await chrome.storage.local.clear();
      setApiKey("");
      setError("");
    } catch (err) {
      console.error("Error clearing storage:", err);
      setError("Failed to reset configuration");
    }
  };

  return (
    <div className="p-4 w-96 h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">AI Configuration</h2>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Reset Keys
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select AI Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AI_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => setSelectedProvider(provider)}
                className={`p-3 rounded-lg border text-left ${
                  selectedProvider.id === provider.id
                    ? "border-black bg-gray-50"
                    : "border-gray-200"
                }`}
              >
                <div className="font-medium">{provider.name}</div>
                <div className="text-xs text-gray-500">
                  {provider.description}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {selectedProvider.name} API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1 block w-full rounded-lg border px-2 border-gray-200 focus:outline-none h-11"
            placeholder={`Enter your ${selectedProvider.name} API key`}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-black text-white py-2 px-4 rounded-xl h-11"
        >
          Save API Key
        </button>
      </form>
    </div>
  );
}

export default ApiKeyInput;
