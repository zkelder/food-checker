function getVerdict(result) {
  if (!result || result.match_count === 0) {
    return {
      label: "SAFE",
      className: "safe",
      description: "No selected preference matches were found.",
    };
  }

  if (result.risk_level === "high") {
    return {
      label: "AVOID",
      className: "avoid",
      description: "This label contains ingredients that match high-risk preferences.",
    };
  }

  if (result.risk_level === "medium") {
    return {
      label: "CAUTION",
      className: "caution",
      description: "This label contains ingredients that may need attention.",
    };
  }

  return {
    label: "REVIEW",
    className: "review",
    description: "This label contains lower-priority ingredient notes.",
  };
}

function ResultCard({ result }) {
  if (!result) {
    return null;
  }

  const verdict = getVerdict(result);
  const hasMatches = result.match_count > 0;

  return (
    <section className={`card results-card verdict-card ${verdict.className}`}>
      <div className="verdict-header">
        <p className="eyebrow">Scan result</p>

        <div className={`verdict-badge ${verdict.className}`}>
          {verdict.label}
        </div>

        <h2>{hasMatches ? "Ingredients flagged" : "Looks clear"}</h2>

        <p>{verdict.description}</p>
      </div>

      <div className="verdict-summary-grid">
        <div>
          <strong>{result.match_count}</strong>
          <span>matches</span>
        </div>

        <div>
          <strong>{result.risk_level}</strong>
          <span>risk level</span>
        </div>
      </div>

      {hasMatches ? (
        <div className="flagged-section">
          <h3>Flagged Ingredients</h3>

          <div className="matches">
            {result.matches.map((match, index) => (
              <article key={index} className="match-card polished-match-card">
                <div className="match-topline">
                  <h4>{match.label || match.ingredient}</h4>

                  <span className={`severity ${match.severity}`}>
                    {match.severity}
                  </span>
                </div>

                <p>
                  {match.warning ||
                    "This ingredient matched one of your selected preferences."}
                </p>

                <dl className="match-details">
                  <div>
                    <dt>Matched</dt>
                    <dd>{match.ingredient}</dd>
                  </div>

                  <div>
                    <dt>Category</dt>
                    <dd>{match.category}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="clear-state">
          <strong>No selected rules matched this scan.</strong>
          <p>
            This does not guarantee the product is safe for every person. It only
            means the scan did not find matches for your selected preferences.
          </p>
        </div>
      )}

      <details className="ocr-preview">
        <summary>View extracted text</summary>
        <p>{result.input_text}</p>
      </details>
    </section>
  );
}

export default ResultCard;