import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [rules, setRules] = useState({});
  const [selectedRules, setSelectedRules] = useState([]);
  const [ingredientText, setIngredientText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      const response = await fetch(`${API_BASE_URL}/rules`);
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error("Failed to load rules:", error);
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

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  }

  const groupedRules = {};

  Object.entries(rules).forEach(([ruleId, ruleData]) => {
    const category = ruleData.category;

    if (!groupedRules[category]) {
      groupedRules[category] = [];
    }

    groupedRules[category].push({
      id: ruleId,
      ...ruleData,
    });
  });

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Personalized ingredient screening</p>
          <h1>Food Checker</h1>
          <p className="subtitle">
            Select what matters to you, paste an ingredient label, and get a
            focused safety result.
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
              <p>Choose allergies or concerns to screen for.</p>
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
                      <span>{rule.display_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
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
              disabled={loading || !ingredientText.trim() || selectedRules.length === 0}
            >
              {loading ? "Analyzing..." : "Analyze Ingredients"}
            </button>
          </section>

          {result && (
            <section className="card results-card">
              <div className="card-header">
                <h2>Results</h2>
                <p>
                  Screening against {result.selected_rules.length} selected
                  rule(s).
                </p>
              </div>

              <div
                className={
                  result.safe_for_user ? "status safe" : "status warning"
                }
              >
                <strong>
                  {result.safe_for_user
                    ? "No selected concerns found"
                    : `${result.match_count} warning(s) found`}
                </strong>
                <span>
                  {result.safe_for_user
                    ? "This item did not match your selected rules."
                    : "Review the matched ingredients below."}
                </span>
              </div>

              <div className="matches">
                {result.matches.map((match, index) => (
                  <article key={index} className="match-card">
                    <div className="match-topline">
                      <h3>{match.display_name}</h3>
                      <span className={`severity ${match.default_severity}`}>
                        {match.default_severity}
                      </span>
                    </div>

                    <p>
                      Matched ingredient:{" "}
                      <strong>{match.matched_ingredient}</strong>
                    </p>

                    <p>
                      Keyword: <strong>{match.matched_keyword}</strong>
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;