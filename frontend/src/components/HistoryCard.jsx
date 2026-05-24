function HistoryCard({ history }) {
  const latestHistory = history.slice(0, 5);

  return (
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

                <span className={`severity ${scan.result?.risk_level || "low"}`}>
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
                <strong>{new Date(scan.created_at).toLocaleString()}</strong>
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default HistoryCard;