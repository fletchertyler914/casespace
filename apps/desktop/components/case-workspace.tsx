"use client";

import { useCallback, useEffect, useState } from "react";
import type { CaseSummary } from "@repo/types";
import { commandClient } from "../lib/command-client";

export function CaseWorkspace() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [newCaseName, setNewCaseName] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [ocrPath, setOcrPath] = useState("");
  const [ocrOutput, setOcrOutput] = useState("");
  const [reportOutput, setReportOutput] = useState("");
  const [message, setMessage] = useState<string>("");

  const refreshCases = useCallback(async () => {
    const response = await commandClient.listCases();
    if (!response.ok || !response.data) {
      setMessage(response.error?.message ?? "Unable to list cases");
      return;
    }
    setCases(response.data);
    if (!selectedCaseId && response.data.length > 0) {
      const firstCase = response.data[0];
      if (firstCase) {
        setSelectedCaseId(firstCase.id);
      }
    }
  }, [selectedCaseId]);

  useEffect(() => {
    void refreshCases();
  }, [refreshCases]);

  async function createCase() {
    if (!newCaseName.trim() || !sourcePath.trim()) {
      setMessage("Case name and source path are required.");
      return;
    }
    const response = await commandClient.createCase({
      name: newCaseName,
      sourcePaths: [sourcePath],
    });
    if (!response.ok) {
      setMessage(response.error?.message ?? "Unable to create case.");
      return;
    }
    setNewCaseName("");
    await refreshCases();
    setMessage("Case created.");
  }

  async function runSearch() {
    if (!selectedCaseId || !searchQuery.trim()) return;
    const response = await commandClient.searchAll(selectedCaseId, searchQuery);
    if (!response.ok || !response.data) {
      setMessage(response.error?.message ?? "Search failed.");
      return;
    }
    setSearchResults(response.data);
    setMessage(`Search completed with ${response.data.length} result(s).`);
  }

  async function runOcrPreview() {
    if (!selectedCaseId || !ocrPath.trim()) return;
    const response = await commandClient.runOcrPreview(selectedCaseId, ocrPath);
    if (!response.ok || !response.data) {
      setMessage(response.error?.message ?? "OCR preview failed.");
      return;
    }
    setOcrOutput(response.data);
  }

  async function generateReport() {
    if (!selectedCaseId) return;
    const response = await commandClient.generateCaseReport(selectedCaseId);
    if (!response.ok || !response.data) {
      setMessage(response.error?.message ?? "Report generation failed.");
      return;
    }
    setReportOutput(response.data);
  }

  return (
    <main className="mx-auto max-w-5xl p-8 space-y-8">
      <section className="rounded-xl border border-neutral-800 p-6">
        <h1 className="text-3xl font-semibold mb-3">CaseSpace Desktop</h1>
        <p className="text-sm text-neutral-300">
          Core case workspace rebuilt in Next.js against typed backend command
          adapters.
        </p>
      </section>

      <section className="rounded-xl border border-neutral-800 p-6 space-y-3">
        <h2 className="text-xl font-medium">Create Case</h2>
        <input
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
          placeholder="Case name"
          value={newCaseName}
          onChange={(event) => setNewCaseName(event.target.value)}
        />
        <input
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
          placeholder="Source path (absolute)"
          value={sourcePath}
          onChange={(event) => setSourcePath(event.target.value)}
        />
        <button
          className="rounded bg-white text-black px-4 py-2 text-sm font-medium"
          onClick={createCase}
          type="button"
        >
          Create
        </button>
      </section>

      <section className="rounded-xl border border-neutral-800 p-6 space-y-3">
        <h2 className="text-xl font-medium">Cases</h2>
        <select
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
          onChange={(event) => setSelectedCaseId(event.target.value)}
          value={selectedCaseId}
        >
          <option value="">Select a case</option>
          {cases.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-xl border border-neutral-800 p-6 space-y-3">
        <h2 className="text-xl font-medium">Search Case Data</h2>
        <input
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
          placeholder="Search query"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <button
          className="rounded bg-white text-black px-4 py-2 text-sm font-medium"
          onClick={runSearch}
          type="button"
        >
          Search
        </button>
        <ul className="list-disc list-inside text-sm text-neutral-300">
          {searchResults.map((result) => (
            <li key={result}>{result}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-neutral-800 p-6 space-y-3">
        <h2 className="text-xl font-medium">OCR + AI Report Automation</h2>
        <input
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
          placeholder="Absolute file path for OCR preview"
          value={ocrPath}
          onChange={(event) => setOcrPath(event.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded bg-white text-black px-4 py-2 text-sm font-medium"
            onClick={runOcrPreview}
            type="button"
          >
            Run OCR Preview
          </button>
          <button
            className="rounded border border-neutral-600 px-4 py-2 text-sm font-medium"
            onClick={generateReport}
            type="button"
          >
            Generate Case Report
          </button>
        </div>
        {ocrOutput && (
          <p className="text-sm text-neutral-300 break-words">{ocrOutput}</p>
        )}
        {reportOutput && (
          <p className="text-sm text-neutral-300 break-words">{reportOutput}</p>
        )}
      </section>

      {message && <p className="text-sm text-neutral-300">{message}</p>}
    </main>
  );
}
