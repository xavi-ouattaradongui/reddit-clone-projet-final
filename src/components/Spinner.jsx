export default function Spinner({ center = false, small = false }) {
  const el = <span className={`spinner${small ? ' spinner-sm' : ''}`} aria-label="Chargement" />;
  return center ? <div className="center-box">{el}</div> : el;
}
