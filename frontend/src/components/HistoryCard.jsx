function getHistoryVerdict(scan) {
  const matchCount = scan.result?.match_count || 0;
  const riskLevel = scan.result?.risk_level || "none";

  if (matchCount === 0) {
    return {
      label: "SAFE",
      className: "safe",
    };
  }

  if (riskLevel === "high") {
    return {
      label: "AVOID",
      className: "avoid",
    };
  }

  if (riskLevel === "medium") {
    return {
      label: "CAUTION",
      className: "caution",
    };
  }

  return {
    label: "REVIEW",
    className: "review",
  };
}

function HistoryCard({ history, onSelectScan }) {
  const latestHistory = history.slice(0, 12);

  return (
    <section className="card history-screen-card">
      <div className="card-header">
        <p className="eyebrow">Saved scans</p>
        <h2>Review History</h2>
        <p>Tap a previous scan to reopen the full result.</p>
      </div>

      {latestHistory.length === 0 ? (
        <div className="empty-history">
          <strong>No reviews yet.</strong>
          <p>Your saved scans will appear here after you scan a label.</p>
        </div>
      ) : (
        <div className="history-list">
          {latestHistory.map((scan) => {
            const verdict = getHistoryVerdict(scan);
            const rawText = scan.raw_text || "";
            const createdAt = scan.created_at
              ? new Date(scan.created_at).toLocaleString()
              : "Unknown date";

            return (
              <button
                key={scan.id}
                type="button"
                className="history-item"
                onClick={() => onSelectScan(scan)}
              >
                <div className="history-item-topline">
                  <span className={`history-verdict ${verdict.className}`}>
                    {verdict.label}
                  </span>

                  <span className="history-date">{createdAt}</span>
                </div>

                <strong>
                  {scan.result?.summary || "No summary available."}
                </strong>

                <p>
                  {rawText.slice(0, 120)}
                  {rawText.length > 120 ? "..." : ""}
                </p>

                <div className="history-meta">
                  <span>{scan.result?.match_count || 0} match</span>
                  <span>{scan.result?.risk_level || "none"} risk</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default HistoryCard;