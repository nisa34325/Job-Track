export default function StatusPill({ status }) {
  return <span className={`pill pill-${status.toLowerCase()}`}>{status}</span>;
}
