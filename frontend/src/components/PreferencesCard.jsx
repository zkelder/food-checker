function PreferencesCard({ groupedRules, selectedRules, onToggleRule }) {
  return (
    <section className="card">
      <div className="card-header">
        <p className="eyebrow">Profile setup</p>
        <h2>Your Preferences</h2>
        <p>
          These selections are temporary now. Later they become saved user profile
          preferences.
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
                  onChange={() => onToggleRule(rule.id)}
                />

                <span>{rule.display_name || rule.label || rule.id}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default PreferencesCard;