import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [rules, setRules] = useState({});
  const [selectedRules, setSelectedRules] = useState([]);
  const [ingredientText, setIngredientText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchRules();
    fetchHistory();
  }, []);

  async function fetchRules() {
    try {
      const response = await fetch(`${API_BASE_URL}/rules`);

      if (!response.ok) {
        throw new Error("Could not load preferences.");
      }

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

      if (!response.ok) {
        throw new Error("Could not load history.");
      }

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

  function handleImageChange(event) {
    setSelectedImage(event.target.files?.[0] || null);
    setErrorMessage("");
  }

  async function analyzeIngredients() {
    setLoading(true);
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

      if (!response.ok) {
        throw new Error("Analyze request failed.");
      }

      const data = await response.json();

      setResult(data);
      fetchHistory();
    } catch (error) {
      console.error("Analysis failed:", error);
      setErrorMessage("Could not analyze ingredients. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function scanImage() {
    if (!selectedImage) {
      return;
    }

    setLoading(true);
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
      fetchHistory();
    } catch (error) {
      console.error("OCR scan failed:", error);
      setErrorMessage(
        error.message ||
          "Could not read that image. Try a clearer, closer label photo.",
      );
    } finally {
      setLoading(false);
    }
  }

  const groupedRules = {};

  Object.entries(rules).forEach(([ruleId, ruleData]) => {
    const category = ruleData.category || "general";

    if (!groupedRules[category]) {
      groupedRules[category] = [];
    }

    groupedRules[category].push({
      id: ruleId,
      ...ruleData,
    });
  });

  const hasMatches = result?.match_count > 0;
  const latestHistory = history.slice(0, 5);

  return (
    <main className="page app-shell">
      <section className="hero app-hero">
        <div>
          <p className="eyebrow">Mobile OCR ingredient review</p>

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

      {errorMessage && (
        <section className="card error-card">
          <strong>Something went wrong</strong>
          <p>{errorMessage}</p>
        </section>
      )}

      <section className="layout app-layout">
        <div className="right-column primary-flow">
          <section className="card scan-card">
            <div className="card-header">
              <p className="eyebrow">Step 1</p>
              <h2>Scan Label</h2>
              <p>
                Upload a clear photo of the ingredients panel. This is the main
                flow for the future mobile app.
              </p>
            </div>

            <label className="upload-box">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
              />

              <span className="upload-title">
                {selectedImage ? selectedImage.name : "Choose label photo"}
              </span>

              <span className="upload-help">
                JPG, PNG, or WEBP. Use a close, well-lit photo.
              </span>
            </label>

            <button onClick={scanImage} disabled={loading || !selectedImage}>
              {loading ? "Scanning label..." : "Scan Label"}
            </button>

            {selectedRules.length === 0 && (
              <p className="helper-note">
                No preferences selected. The scan will still run, but selected
                preferences make results more focused.
              </p>
            )}
          </section>

          {result && (
            <section className="card results-card">
              <div className="card-header">
                <p className="eyebrow">Step 2</p>
                <h2>Review Result</h2>
                <p>{result.summary}</p>
              </div>

              <div className={!hasMatches ? "status safe" : "status warning"}>
                <strong>
                  {!hasMatches
                    ? "No flagged ingredients found"
                    : `${result.match_count} flagged ingredient(s) found`}
                </strong>

                <span>Review level: {result.risk_level}</span>
              </div>

              <details className="ocr-preview">
                <summary>View extracted text</summary>
                <p>{result.input_text}</p>
              </details>

              {result.matches.length > 0 && (
                <div className="matches">
                  {result.matches.map((match, index) => (
                    <article key={index} className="match-card">
                      <div className="match-topline">
                        <h3>{match.label || match.ingredient}</h3>

                        <span className={`severity ${match.severity}`}>
                          {match.severity}
                        </span>
                      </div>

                      <p>
                        {match.warning ||
                          "Ingredient matched this screening rule."}
                      </p>

                      <p>
                        Matched ingredient:{" "}
                        <strong>{match.ingredient}</strong>
                      </p>

                      <p>
                        Category: <strong>{match.category}</strong>
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="card manual-card">
            <div className="card-header">
              <h2>Manual Backup</h2>
              <p>
                Paste ingredients manually when OCR misses text or you are
                testing rules.
              </p>
            </div>

            <textarea
              placeholder="Example: wheat flour, sugar, soy lecithin..."
              value={ingredientText}
              onChange={(event) => setIngredientText(event.target.value)}
            />

            <button
              onClick={analyzeIngredients}
              disabled={loading || !ingredientText.trim()}
            >
              {loading ? "Analyzing..." : "Analyze Text"}
            </button>
          </section>
        </div>

        <div className="left-column secondary-flow">
          <section className="card">
            <div className="card-header">
              <p className="eyebrow">Profile setup</p>
              <h2>Your Preferences</h2>
              <p>
                These selections are temporary now. Later they become saved user
                profile preferences.
              </p>
            </div>

            {Object.entries(groupedRules).map(([category, categoryRules]) => (
              <div key={category} className="category">
                <h3>{category.replace("_", " ")}</h3>

                <div className="rules-grid">
                  {categoryRules.map((rule) => (
                    <label
                      key={rule.id}
                      className={
                        selectedRules.includes(rule.id)
                          ? "rule-card selected"
                          : "rule-card"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selectedRules.includes(rule.id)}
                        onChange={() => toggleRule(rule.id)}
                      />

                      <span>{rule.display_name || rule.label || rule.id}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="card">
            <div className="card-header">
              <h2>Recent Reviews</h2>
              <p>Your latest saved ingredient reviews.</p>
            </div>

            {latestHistory.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              <div className="matches">
                {latestHistory.map((scan) => (
                  <article key={scan.id} className="match-card">
                    <div className="match-topline">
                      <h3>{scan.result?.risk_level || "unknown"}</h3>

                      <span
                        className={`severity ${
                          scan.result?.risk_level || "low"
                        }`}
                      >
                        {scan.result?.match_count || 0} match
                      </span>
                    </div>

                    <p>{scan.result?.summary || "No summary available."}</p>

                    <p>
                      Text:{" "}
                      <strong>
                        {(scan.raw_text || "").slice(0, 90)}
                        {(scan.raw_text || "").length > 90 ? "..." : ""}
                      </strong>
                    </p>

                    <p>
                      Date:{" "}
                      <strong>
                        {new Date(scan.created_at).toLocaleString()}
                      </strong>
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;