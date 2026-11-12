import { useEffect, useRef, useState } from 'react';
import { MAX_IMAGE_SIZE } from '../lib/api';
import { IconImage, IconX } from './Icons';

const TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/**
 * Choix d'une image (clic ou glisser-déposer) avec aperçu.
 * value : { file?: File, url?: string } | null
 */
export default function ImagePicker({ value, onChange, onError, compact = false }) {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState(value?.url || null);

  useEffect(() => {
    if (value?.file) {
      const url = URL.createObjectURL(value.file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(value?.url || null);
  }, [value]);

  const pick = (file) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return onError?.('Format accepté : PNG, JPG, GIF ou WEBP.');
    if (file.size > MAX_IMAGE_SIZE) return onError?.('Image trop lourde (5 Mo maximum).');
    onChange({ file });
  };

  if (preview) {
    return (
      <div className={`image-preview ${compact ? 'compact' : ''}`}>
        <img src={preview} alt="Aperçu" />
        <button type="button" className="icon-btn remove-image" onClick={() => onChange(null)} aria-label="Retirer l'image">
          <IconX />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`dropzone ${drag ? 'drag' : ''} ${compact ? 'compact' : ''}`}
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        pick(e.dataTransfer.files?.[0]);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
    >
      <IconImage size={28} />
      <p>
        {compact ? <strong>Choisir une image</strong> : <><strong>Glisse une image ici</strong> ou clique pour choisir</>}
      </p>
      <small className="muted">PNG, JPG, GIF ou WEBP · 5 Mo max</small>
      <input
        ref={input}
        type="file"
        accept={TYPES.join(',')}
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
