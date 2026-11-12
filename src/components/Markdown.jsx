// Petit moteur Markdown sûr (aucun HTML injecté : tout est rendu en éléments React).
// Gère : **gras**, *italique*, ~~barré~~, `code`, [liens](https://…), liens nus,
// # titres, > citations, listes - / 1., blocs ```code```, --- et sauts de ligne.

const INLINE =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(~~[^~\n]+~~)|(\*[^*\n]+\*|_[^_\n]+_)|(\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;

function inline(text, keyPrefix = '') {
  const out = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [tok] = m;
    const key = `${keyPrefix}-${i++}`;
    if (m[1]) out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={key}>{inline(tok.slice(2, -2), key)}</strong>);
    else if (m[3]) out.push(<del key={key}>{inline(tok.slice(2, -2), key)}</del>);
    else if (m[4]) out.push(<em key={key}>{inline(tok.slice(1, -1), key)}</em>);
    else if (m[5]) {
      const [, label, href] = tok.match(/^\[([^\]]+)\]\((.+)\)$/);
      out.push(
        <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow">
          {inline(label, key)}
        </a>,
      );
    } else if (m[6]) {
      out.push(
        <a key={key} href={tok} target="_blank" rel="noopener noreferrer nofollow">
          {tok}
        </a>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Texte multi-lignes → paragraphes avec <br /> */
function lines(arr, key) {
  return arr.flatMap((l, i) => (i ? [<br key={`${key}-br${i}`} />, ...inline(l, `${key}-${i}`)] : inline(l, `${key}-${i}`)));
}

export default function Markdown({ text, className = '' }) {
  if (!text) return null;
  const src = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < src.length) {
    const line = src[i];
    const key = `b${i}`;

    if (/^```/.test(line)) {
      const code = [];
      i++;
      while (i < src.length && !/^```/.test(src[i])) code.push(src[i++]);
      i++;
      blocks.push(
        <pre key={key}>
          <code>{code.join('\n')}</code>
        </pre>,
      );
    } else if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const Tag = `h${level + 2}`; // h3 à h5 : on reste sous le titre du post
      blocks.push(<Tag key={key}>{inline(line.replace(/^#+\s/, ''), key)}</Tag>);
      i++;
    } else if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push(<hr key={key} />);
      i++;
    } else if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < src.length && /^>\s?/.test(src[i])) quote.push(src[i++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={key}>{lines(quote, key)}</blockquote>);
    } else if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < src.length && /^\s*[-*]\s+/.test(src[i])) items.push(src[i++].replace(/^\s*[-*]\s+/, ''));
      blocks.push(
        <ul key={key}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `${key}-${j}`)}</li>
          ))}
        </ul>,
      );
    } else if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < src.length && /^\s*\d+[.)]\s+/.test(src[i])) items.push(src[i++].replace(/^\s*\d+[.)]\s+/, ''));
      blocks.push(
        <ol key={key}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `${key}-${j}`)}</li>
          ))}
        </ol>,
      );
    } else if (line.trim() === '') {
      i++;
    } else {
      const para = [];
      while (
        i < src.length &&
        src[i].trim() !== '' &&
        !/^(```|#{1,3}\s|>|\s*[-*]\s+|\s*\d+[.)]\s+|-{3,}\s*$)/.test(src[i])
      ) {
        para.push(src[i++]);
      }
      if (para.length === 0) para.push(src[i++]); // sécurité : on avance toujours
      blocks.push(<p key={key}>{lines(para, key)}</p>);
    }
  }

  return <div className={`md ${className}`}>{blocks}</div>;
}

/** Version texte brut (pour les aperçus dans le fil) */
export function stripMarkdown(text = '') {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*(?:[-*]|\d+[.)])\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`>#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
