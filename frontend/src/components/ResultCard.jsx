function ResultCard({ result }) {
  if (!result) {
    return null;
  }

  const hasMatches = result.match_count > 0;

  return (
    <section className="card results-card">
      <div className="card-header">
        <p className="eyebrow">Result</p>
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

              <p>{match.warning || "Ingredient matched this screening rule."}</p>

              <p>
                Matched ingredient: <strong>{match.ingredient}</strong>
              </p>

              <p>
                Category: <strong>{match.category}</strong>
              </p>
            </article>
          ))}
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