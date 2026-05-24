function ScanCard({
  selectedImage,
  imagePreviewUrl,
  loading,
  activeAction,
  selectedRulesCount,
  onImageChange,
  onClearImage,
  onScanImage,
}) {
  return (
    <section className="card scan-card mobile-home-card">
      <div className="scan-hero-copy">
        <p className="eyebrow">Scan home</p>
        <h2>Point, capture, check.</h2>
        <p>
          Take a clear photo of the ingredients panel. Food Checker will extract
          the label text and compare it against your saved scan preferences.
        </p>
      </div>

      <div className="scan-preference-pill">
        <span>{selectedRulesCount}</span>
        <strong>
          {selectedRulesCount === 1
            ? "preference active"
            : "preferences active"}
        </strong>
      </div>

      <label className="upload-box camera-upload-box">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onImageChange}
        />

        <span className="camera-icon">📷</span>

        <span className="upload-title">
          {selectedImage ? selectedImage.name : "Open Camera / Choose Photo"}
        </span>

        <span className="upload-help">
          Use a close, bright photo with the full ingredient list visible.
        </span>
      </label>

      {imagePreviewUrl && (
        <div className="image-preview-card phone-preview-card">
          <img src={imagePreviewUrl} alt="Selected ingredient label preview" />

          <div className="image-preview-actions">
            <span>Photo ready to scan</span>

            <button
              type="button"
              className="secondary-button"
              onClick={onClearImage}
              disabled={loading}
            >
              Retake
            </button>
          </div>
        </div>
      )}

      <button
        className="primary-scan-button"
        onClick={onScanImage}
        disabled={loading || !selectedImage}
      >
        {loading && activeAction === "image" ? "Scanning..." : "Scan Ingredients"}
      </button>

      {selectedRulesCount === 0 && (
        <p className="helper-note scan-warning-note">
          No preferences selected yet. Go to Preferences to choose what scans
          should check for.
        </p>
      )}
    </section>
  );
}

export default ScanCard;