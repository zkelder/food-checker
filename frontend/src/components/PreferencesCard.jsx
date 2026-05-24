function PreferencesCard({
  groupedRules,
  selectedRules,
  selectedRuleLabels,
  onToggleRule,
  onClearRules,
  onSelectCommonAllergens,
}) {
  const hasSelectedRules = selectedRules.length > 0;

  return (
    <section className="card preferences-screen-card">
      <div className="profile-setup-header">
        <p className="eyebrow">Profile setup</p>
        <h2>Scan Preferences</h2>
        <p>
          Choose the ingredients and dietary rules you want every scan to check.
          Later, this becomes your saved profile.
        </p>
      </div>

      <div className="preference-summary">
        <div>
          <strong>{selectedRules.length}</strong>
          <span>selected preferences</span>
        </div>

        <div>
          <strong>{Object.keys(groupedRules).length}</strong>
          <span>rule categories</span>
        </div>
      </div>

      <div className="preference-actions">
        <button type="button" className="secondary-button" onClick={onClearRules}>
          Clear All
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onSelectCommonAllergens}
        >
          Select Common Allergens
        </button>
      </div>

      {!hasSelectedRules ? (
        <div className="preference-empty-state">
          <strong>No scan preferences selected.</strong>
          <p>
            Scans will still extract ingredient text, but they will not flag
            ingredients until you select preferences.
          </p>
        </div>
      ) : (
        <div className="selected-preferences">
          <h3>Currently checking</h3>

          <div className="selected-rule-list">
            {selectedRuleLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      )}

      <div className="preference-categories">
        {Object.entries(groupedRules).map(([category, categoryRules]) => (
          <div key={category} className="category preference-category">
            <div className="preference-category-header">
              <h3>{category.replace("_", " ")}</h3>
              <span>{categoryRules.length} rules</span>
            </div>

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
      </div>
    </section>
  );
}

export default PreferencesCard;