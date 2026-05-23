import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [rules, setRules] = useState({});
  const [selectedRules, setSelectedRules] = useState([]);
  const [ingredientText, setIngredientText] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRules();
    fetchHistory();
  }, []);

  async function fetchRules() {
    try {
      const response = await fetch(`${API_BASE_URL}/rules`);

      if (!response.ok) {
        throw new Error("Rules request failed");
      }

      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error("Failed to load rules:", error);
    }
  }

  async function fetchHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/history`);

      if (!response.ok) {
        throw new Error("History request failed");
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

  async function analyzeIngredients() {
    setLoading(true);
    setResult(null);

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
        throw new Error("Analyze request failed");
      }

      const data = await response.json();
      setResult(data);
      fetchHistory();
    } catch (error) {
      console.error("Analysis failed:", error);
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

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Personalized ingredient screening</p>
          <h1>Food Checker</h1>
          <p className="subtitle">
            Select what matters to you, paste an ingredient label, and get a
            focused ingredient review.
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

      <section className="layout">
        <div className="left-column">
          <section className="card">
            <div className="card-header">
              <h2>Select Rules</h2>
              <p>Choose allergies, restrictions, or ingredient concerns.</p>
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
              <h2>Recent Scans</h2>
              <p>Your latest saved ingredient checks.</p>
            </div>

            {history.length === 0 ? (
              <p>No scans yet.</p>
            ) : (
              <div className="matches">
                {history.slice(0, 5).map((scan) => (
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
                        {(scan.raw_text || "").slice(0, 80)}
                        {(scan.raw_text || "").length > 80 ? "..." : ""}
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

        <div className="right-column">
          <section className="card">
            <div className="card-header">
              <h2>Ingredients</h2>
              <p>Paste a label exactly as it appears on the package.</p>
            </div>

            <textarea
              placeholder="Example: wheat flour, sugar, soy lecithin, peanut oil..."
              value={ingredientText}
              onChange={(event) => setIngredientText(event.target.value)}
            />

            <button
              onClick={analyzeIngredients}
              disabled={loading || !ingredientText.trim()}
            >
              {loading ? "Analyzing..." : "Analyze Ingredients"}
            </button>
          </section>

          {result && (
            <section className="card results-card">
              <div className="card-header">
                <h2>Results</h2>
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

                      <p>{match.warning || "Ingredient matched this rule."}</p>

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
        </div>
      </section>
    </main>
  );
}

export default App;