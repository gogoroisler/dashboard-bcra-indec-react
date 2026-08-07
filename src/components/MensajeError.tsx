interface MensajeErrorProps {
  mensaje: string
  onReintentar: () => void
}

export function MensajeError({ mensaje, onReintentar }: MensajeErrorProps) {
  return (
    <div className="text-sm text-[var(--text-secondary)]">
      <p>{mensaje}</p>
      <button
        type="button"
        onClick={onReintentar}
        className="mt-2 rounded border border-[var(--axis-line)] px-3 py-1 text-[var(--text-primary)] hover:bg-[var(--grid-line)]"
      >
        Reintentar
      </button>
    </div>
  )
}
