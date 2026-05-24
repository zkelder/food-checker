function ManualInputCard({
  ingredientText,
  loading,
  activeAction,
  onIngredientTextChange,
  onAnalyzeIngredients,
}) {
  return (
    <section className="card manual-card">
      <div className="card-header">
        <h2>Manual Backup</h2>

        <p>
          Paste ingredients manually when OCR misses text or you are testing
          rules.
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
        {loading && activeAction === "text"
          ? "Analyzing..."
          : "Analyze Text"}
      </button>
    </section>
  );
}

export default ManualInputCard;