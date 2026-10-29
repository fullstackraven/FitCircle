import { useMemo, useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { DashboardPage } from '@/components/DashboardPage';
import { copyFitcircleLink, FITCIRCLE_URL, fitcircleQr } from '@/lib/share-fitcircle';
export default function SharePage() {
  const [status, setStatus] = useState('');
  const qr = useMemo(() => { const m = fitcircleQr(); const path = []; for (let y=0;y<m.getHeight();y++) for(let x=0;x<m.getWidth();x++) if(m.get(x,y)) path.push(`M${x} ${y}h1v1h-1z`); return { size: m.getWidth(), path: path.join('') }; }, []);
  const copy = async () => { try { await copyFitcircleLink(); setStatus('Link copied.'); } catch { setStatus('Could not copy. Select and copy the link above.'); } };
  const share = async () => {
    try { await navigator.share({ title: 'FitCircle', text: 'Personal fitness and wellness tracking.', url: FITCIRCLE_URL }); setStatus('Share completed.'); }
    catch (error) { setStatus(error instanceof DOMException && error.name === 'AbortError' ? '' : 'Could not share. You can copy the link instead.'); }
  };
  return <DashboardPage title="Share FitCircle">
    <section className="fitcircle-card-lg space-y-5">
      <div><h2 className="text-xl font-semibold">FitCircle</h2><p className="text-supporting mt-2 leading-relaxed">Your workouts, nutrition, and wellness in one local-first fitness tracker.</p></div>
      <a href={FITCIRCLE_URL} className="block text-accent-text underline break-all text-sm">{FITCIRCLE_URL}</a>
      <svg role="img" aria-label="QR code for the FitCircle public app" data-testid="share-qr" viewBox={`0 0 ${qr.size} ${qr.size}`} className="block w-full max-w-64 mx-auto rounded-xl" style={{background: '#fff', color: '#000'}} shapeRendering="crispEdges"><rect width={qr.size} height={qr.size} fill="#fff"/><path d={qr.path} fill="#000"/></svg>
      <div className="flex flex-wrap gap-3"><button onClick={copy} className="fc-pill flex-1 min-h-11 inline-flex items-center justify-center gap-2 bg-action text-on-action px-4 py-3 font-medium"><Copy size={18}/>Copy Link</button>{typeof navigator.share === 'function' && <button onClick={share} className="fc-pill flex-1 min-h-11 inline-flex items-center justify-center gap-2 bg-control text-strong border border-control-border px-4 py-3"><Share2 size={18}/>Share</button>}</div>
      <p role="status" aria-live="polite" className="text-sm text-supporting min-h-5">{status}</p>
    </section>
  </DashboardPage>;
}
