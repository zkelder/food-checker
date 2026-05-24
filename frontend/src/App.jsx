import { useEffect, useMemo, useState } from "react";
import "./App.css";

import HistoryCard from "./components/HistoryCard";
import ManualInputCard from "./components/ManualInputCard";
import PreferencesCard from "./components/PreferencesCard";
import ResultCard from "./components/ResultCard";
import ScanCard from "./components/ScanCard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const SELECTED_RULES_STORAGE_KEY = "food_checker_selected_rules";

function App() {
  const [activeTab, setActiveTab] = useState("scan");

  const [rules, setRules] = useState({});
  const [selectedRules, setSelectedRules] = useState(() => {
    const savedRules = localStorage.getItem(SELECTED_RULES_STORAGE_KEY);

    if (!savedRules) {
      return [];
    }

    try {
      const parsedRules = JSON.parse(savedRules);
      return Array.isArray(parsedRules) ? parsedRules : [];
    } catch {
      return [];
    }
  });
  const [ingredientText, setIngredientText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchRules();
    fetchHistory();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      SELECTED_RULES_STORAGE_KEY,
      JSON.stringify(selectedRules),
    );
  }, [selectedRules]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImage]);

  async function fetchRules() {
    try {
      const response = await fetch(`${API_BASE_URL}/rules`);
      if (!response.ok) throw new Error("Could not load preferences.");

      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error("Failed to load rules:", error);
      setErrorMessage("Could not load ingredient preferences.");
    }
  }

  async function fetchHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/history`);
      if (!response.ok) throw new Error("Could not load history.");

      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }

  function toggleRule(ruleId) {
    setSelectedRules((previous) =>
      previous.includes(ruleId)
        ? previous.filter((rule) => rule !== ruleId)
        : [...previous, ruleId],
    );
  }

  function clearRules() {
    setSelectedRules([]);
  }

  function selectCommonAllergens() {
    const commonAllergenIds = [
      "dairy",
      "milk",
      "peanut",
      "tree_nut",
      "egg",
      "soy",
      "wheat",
      "gluten",
      "fish",
      "shellfish",
    ];

    const availableCommonAllergens = commonAllergenIds.filter(
      (ruleId) => rules[ruleId],
    );

    setSelectedRules(availableCommonAllergens);
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedImage(file);
    setResult(null);
    setErrorMessage("");
  }

  function clearSelectedImage() {
    setSelectedImage(null);
    setImagePreviewUrl("");
  }

  function handleSelectHistoryScan(scan) {
    setResult(scan.result);
    setIngredientText(scan.raw_text || "");
    setActiveTab("scan");
    setErrorMessage("");
  }

  async function analyzeIngredients() {
    setLoading(true);
    setActiveAction("text");
    setResult(null);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: ingredientText,
          selected_rules: selectedRules,
        }),
      });

      if (!response.ok) throw new Error("Analyze request failed.");

      const data = await response.json();
      setResult(data);
      setActiveTab("scan");
      fetchHistory();
    } catch (error) {
      console.error("Analysis failed:", error);
      setErrorMessage("Could not analyze ingredients. Check that the backend is running.");
    } finally {
      setLoading(false);
      setActiveAction("");
    }
  }

  async function scanImage() {
    if (!selectedImage) {
      setErrorMessage("Choose a label photo before scanning.");
      return;
    }

    setLoading(true);
    setActiveAction("image");
    setResult(null);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("selected_rules", JSON.stringify(selectedRules));

      const response = await fetch(`${API_BASE_URL}/scan/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "OCR scan failed.");
      }

      const data = await response.json();
      setResult(data);
      setActiveTab("scan");
      fetchHistory();
    } catch (error) {
      console.error("OCR scan failed:", error);
      setErrorMessage(
        error.message ||
          "Could not read that image. Try a clearer, closer label photo.",
      );
    } finally {
      setLoading(false);
      setActiveAction("");
    }
  }

  const groupedRules = useMemo(() => {
    const groups = {};

    Object.entries(rules).forEach(([ruleId, ruleData]) => {
      const category = ruleData.category || "general";

      if (!groups[category]) groups[category] = [];

      groups[category].push({
        id: ruleId,
        ...ruleData,
      });
    });

    return groups;
  }, [rules]);

  const selectedRuleLabels = useMemo(() => {
    return selectedRules.map((ruleId) => {
      const rule = rules[ruleId];
      return rule?.display_name || rule?.label || ruleId;
    });
  }, [selectedRules, rules]);

  return (
    <main className="page app-shell">
      <section className="hero app-hero">
        <div>
          <p className="eyebrow">Camera-first ingredient review</p>
          <h1>Food Checker</h1>
          <p className="subtitle">
            Scan a label, review matched ingredients, and save each result to
            your history.
          </p>
        </div>

        <div className="hero-stats">
          <div>
            <strong>{Object.keys(rules).length}</strong>
            <span>rules</span>
          </div>

          <div>
            <strong>{selectedRules.length}</strong>
            <span>selected</span>
          </div>
        </div>
      </section>

      <nav className="app-tabs" aria-label="App sections">
        <button
          className={activeTab === "scan" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("scan")}
        >
          Scan
        </button>

        <button
          className={activeTab === "history" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>

        <button
          className={
            activeTab === "preferences" ? "tab-button active" : "tab-button"
          }
          onClick={() => setActiveTab("preferences")}
        >
          Preferences
        </button>
      </nav>

      {errorMessage && (
        <section className="card error-card">
          <strong>Something went wrong</strong>
          <p>{errorMessage}</p>
        </section>
      )}

      {loading && (
        <section className="card loading-card">
          <div className="spinner" />
          <div>
            <strong>
              {activeAction === "image"
                ? "Scanning ingredient label..."
                : "Analyzing ingredient text..."}
            </strong>
            <p>This may take a few seconds for OCR images.</p>
          </div>
        </section>
      )}

      {activeTab === "scan" && (
        <section className="tab-panel">
          <ScanCard
            selectedImage={selectedImage}
            imagePreviewUrl={imagePreviewUrl}
            loading={loading}
            activeAction={activeAction}
            selectedRulesCount={selectedRules.length}
            onImageChange={handleImageChange}
            onClearImage={clearSelectedImage}
            onScanImage={scanImage}
          />

          <ResultCard result={result} />

          <ManualInputCard
            ingredientText={ingredientText}
            loading={loading}
            activeAction={activeAction}
            onIngredientTextChange={setIngredientText}
            onAnalyzeIngredients={analyzeIngredients}
          />
        </section>
      )}

      {activeTab === "history" && (
        <section className="tab-panel">
          <HistoryCard history={history} onSelectScan={handleSelectHistoryScan} />
        </section>
      )}

      {activeTab === "preferences" && (
        <section className="tab-panel">
          <PreferencesCard
            groupedRules={groupedRules}
            selectedRules={selectedRules}
            selectedRuleLabels={selectedRuleLabels}
            onToggleRule={toggleRule}
            onClearRules={clearRules}
            onSelectCommonAllergens={selectCommonAllergens}
          />
        </section>
      )}
    </main>
  );
}

export default App;