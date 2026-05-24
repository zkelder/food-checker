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
    <section className="card scan-card">
      <div className="card-header">
        <p className="eyebrow">Main action</p>
        <h2>Scan Label</h2>
        <p>
          Upload or take a clear photo of the ingredients panel. This is the
          future home screen flow for the mobile app.
        </p>
      </div>

      <label className="upload-box">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onImageChange}
        />

        <span className="upload-title">
          {selectedImage ? selectedImage.name : "Choose label photo"}
        </span>

        <span className="upload-help">
          JPG, PNG, or WEBP. Use a close, well-lit photo.
        </span>
      </label>

      {imagePreviewUrl && (
        <div className="image-preview-card">
          <img src={imagePreviewUrl} alt="Selected ingredient label preview" />

          <div className="image-preview-actions">
            <span>Preview ready</span>
            <button
              type="button"
              className="secondary-button"
              onClick={onClearImage}
              disabled={loading}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <button onClick={onScanImage} disabled={loading || !selectedImage}>
        {loading && activeAction === "image" ? "Scanning..." : "Scan Label"}
      </button>

      {selectedRulesCount === 0 && (
        <p className="helper-note">
          No preferences selected. The scan will still run, but selected
          preferences make results more focused.
        </p>
      )}
    </section>
  );
}

export default ScanCard;