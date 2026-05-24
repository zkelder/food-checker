function ManualInputCard({
  ingredientText,
  loading,
  activeAction,
  onIngredientTextChange,
  onAnalyzeIngredients,
}) {
  return (
    <details className="manual-fallback">
      <summary>Manual text backup</summary>

      <section className="card manual-card compact-manual-card">
        <div className="card-header">
          <h2>Analyze Text</h2>

          <p>
            Use this when OCR misses text or when you want to test a label
            without taking a photo.
          </p>
        </div>

        <textarea
          placeholder="Example: wheat flour, sugar, soy lecithin..."
          value={ingredientText}
          onChange={(event) => onIngredientTextChange(event.target.value)}
        />

        <button
          onClick={onAnalyzeIngredients}
          disabled={loading || !ingredientText.trim()}
        >
          {loading && activeAction === "text" ? "Analyzing..." : "Analyze Text"}
        </button>
      </section>
    </details>
  );
}

export default ManualInputCard;