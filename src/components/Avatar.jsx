const COLORS = ['#1f9d74', '#2c7be5', '#c2410c', '#9333ea', '#be185d', '#0e7490', '#4d7c0f', '#b45309'];

function colorFor(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

/** Avatar rond : photo si disponible, sinon initiale sur une couleur dérivée du pseudo */
export default function Avatar({ name, url, size = 32 }) {
  const style = { width: size, height: size, fontSize: size * 0.45 };
  if (url) return <img className="avatar" src={url} alt="" style={style} />;
  return (
    <span className="avatar" style={{ ...style, background: colorFor(name) }} aria-hidden="true">
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

/** Pastille de communauté (r/…) */
export function SubIcon({ name, url, size = 32 }) {
  if (url) return <img className="avatar sub-icon" src={url} alt="" style={{ width: size, height: size }} />;
  return (
    <span
      className="avatar sub-icon"
      style={{ width: size, height: size, fontSize: size * 0.42, background: colorFor('r/' + name) }}
      aria-hidden="true"
    >
      r/
    </span>
  );
}
