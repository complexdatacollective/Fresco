const FieldSkeleton = () => {
  return (
    <div className="mb-8 animate-pulse">
      <div className="form-field-label mb-2">
        {/* label */}
        <div className="h-6 w-48 rounded-full bg-[var(--nc-panel-bg-muted)]" />
      </div>
      {/* input */}
      <div className="min-h-16 rounded-t-2xl bg-[var(--nc-panel-bg-muted)]" />
    </div>
  );
};

export default FieldSkeleton;
