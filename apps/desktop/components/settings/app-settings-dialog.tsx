"use client";

import { useEffect, useState } from "react";
import type { ApiKeySource } from "@repo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme, type Theme } from "@/components/providers/theme-provider";
import { commandClient } from "@/lib/command-client";
import { useToast } from "@/hooks/use-toast";

interface AppSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppSettingsDialog({ open, onOpenChange }: AppSettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [fileFilterPatterns, setFileFilterPatterns] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [apiKeySource, setApiKeySource] = useState<ApiKeySource>("none");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [aiBaseUrl, setAiBaseUrl] = useState(
    "https://api.openai.com/v1/chat/completions",
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!open) return;
    void commandClient.getSystemFileFilterConfig().then((res) => {
      if (res.ok) {
        setFileFilterPatterns(res.data ?? "");
      }
    });
    void commandClient.getAiSettings().then((res) => {
      if (res.ok && res.data) {
        setApiKeyInput("");
        setApiKeySet(res.data.apiKeySet);
        setApiKeySource(res.data.apiKeySource);
        setAiModel(res.data.model);
        setAiBaseUrl(res.data.baseUrl);
      }
    });
  }, [open]);

  async function handleSave() {
    setSaving(true);
    const aiRes = await commandClient.saveAiSettings({
      apiKey: apiKeyInput.trim() || undefined,
      model: aiModel.trim(),
      baseUrl: aiBaseUrl.trim(),
    });
    if (!aiRes.ok) {
      setSaving(false);
      toast({
        title: "Failed to save AI settings",
        description: aiRes.error?.message ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }

    const res = await commandClient.saveSystemFileFilterConfig(
      fileFilterPatterns.trim(),
    );
    setSaving(false);
    if (!res.ok) {
      toast({
        title: "Failed to save settings",
        description: res.error?.message ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }
    setApiKeyInput("");
    onOpenChange(false);
  }

  async function handleClearApiKey() {
    const res = await commandClient.clearAiApiKey();
    if (!res.ok) {
      toast({
        title: "Failed to remove API key",
        description: res.error?.message ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }
    setApiKeyInput("");
    setApiKeySet(false);
    setApiKeySource("none");
    toast({ title: "API key removed" });
  }

  async function handleTestConnection() {
    setTesting(true);
    const saveRes = await commandClient.saveAiSettings({
      apiKey: apiKeyInput.trim() || undefined,
      model: aiModel.trim(),
      baseUrl: aiBaseUrl.trim(),
    });
    if (!saveRes.ok) {
      setTesting(false);
      toast({
        title: "Failed to save AI settings",
        description: saveRes.error?.message ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }
    const res = await commandClient.testAiConnection();
    setTesting(false);
    if (!res.ok || !res.data) {
      toast({
        title: "Connection test failed",
        description: res.error?.message ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: res.data.ok ? "AI provider connected" : "Connection test failed",
      description: `${res.data.message} (${res.data.latencyMs}ms)`,
      variant: res.data.ok ? "default" : "destructive",
    });
    if (res.data.ok) {
      setApiKeyInput("");
      setApiKeySet(true);
      setApiKeySource("keychain");
    }
  }

  const keyBadge =
    apiKeySource === "keychain"
      ? "Saved (keychain)"
      : apiKeySource === "env"
        ? "Saved (env)"
        : apiKeySet
          ? "Saved"
          : "Not configured";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>App settings</DialogTitle>
          <DialogDescription>
            Application-wide preferences. Workspace settings are configured per case.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-3 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label>AI provider</Label>
                <p className="text-xs text-muted-foreground">
                  Bring your own OpenAI-compatible API key. Required for AI
                  analysis, AI reports, and image OCR. Stored in your OS
                  keychain — never bundled with the app.
                </p>
              </div>
              <Badge variant={apiKeySource === "none" ? "outline" : "secondary"}>
                {keyBadge}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-api-key">OpenAI API key</Label>
              <Input
                id="ai-api-key"
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to keep the saved key. The key is stored in your OS
                keychain, never in the case database.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-model">Model</Label>
              <Input
                id="ai-model"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="gpt-4o-mini"
              />
              <p className="text-xs text-muted-foreground">
                Examples: gpt-4o-mini, gpt-4o, o4-mini, or another
                OpenAI-compatible model id.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-base-url">Base URL</Label>
              <Input
                id="ai-base-url"
                value={aiBaseUrl}
                onChange={(e) => setAiBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
              />
              <p className="text-xs text-muted-foreground">
                Use OpenAI, Azure OpenAI, LM Studio, Ollama, or another
                OpenAI-compatible chat completions endpoint.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleTestConnection()}
                disabled={testing || (!apiKeySet && !apiKeyInput.trim())}
              >
                {testing ? "Testing..." : "Test connection"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleClearApiKey()}
                disabled={!apiKeySet}
              >
                Remove key
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="app-theme">Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              <SelectTrigger id="app-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file-filter-patterns">
              System file filter patterns
            </Label>
            <Input
              id="file-filter-patterns"
              value={fileFilterPatterns}
              onChange={(e) => setFileFilterPatterns(e.target.value)}
              placeholder="e.g. .DS_Store, Thumbs.db, *.tmp"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated patterns to skip during ingest (e.g. .DS_Store,
              Thumbs.db, desktop.ini).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}