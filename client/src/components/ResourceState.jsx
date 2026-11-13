export default function ResourceState({ status, error, empty, emptyMessage, onRetry, children }) {
  if (status === 'loading') {
    return (
      <div className="resource-message is-loading" role="status" aria-live="polite">
        <span className="loading-mark" aria-hidden="true" />
        <span>Loading from the portfolio API…</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="resource-message is-error" role="alert">
        <p>{error}</p>
        {onRetry ? (
          <button className="text-button" type="button" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (status === 'empty' || (status === 'success' && empty)) {
    return (
      <div className="resource-message is-empty" role="status">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return children;
}
