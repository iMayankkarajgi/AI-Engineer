import React, { useEffect, useRef } from 'react';

// A centred pop-up built on the native <dialog>: focus stays inside, Esc and a
// click on the backdrop close it, and the page behind does not scroll.
export default function Modal({ open, onClose, label, className = '', children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return <dialog ref={ref} className={'modal ' + className} aria-label={label} onClose={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}>
    {open && <div className="modal-body">
      <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      {children}
    </div>}
  </dialog>;
}
