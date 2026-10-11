const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Shows text with every case-insensitive match of `query` highlighted. Long
// text is trimmed so the first match stays visible in a one-line preview.
const Highlight = ({
  text,
  query,
  trimTo = 40,
}: {
  text: string
  query: string
  trimTo?: number
}) => {
  const q = query.trim().replace(/^@/, "")
  if (!q) return <>{text}</>
  const first = text.toLowerCase().indexOf(q.toLowerCase())
  const start = first > trimTo ? first - Math.floor(trimTo / 2) : 0
  const shown = (start > 0 ? "…" : "") + text.slice(start)
  const parts = shown.split(new RegExp(`(${escapeRegex(q)})`, "gi"))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="bg-mainclr/30 text-zinc-100 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export default Highlight
