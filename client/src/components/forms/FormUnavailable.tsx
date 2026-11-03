import { AppHeader } from '@/components/AppHeader';
import { PageHeader } from '@/components/ui/presentation';

export function FormUnavailable({message,onBack}:{message:string;onBack:()=>void}) {
  return <section className="form-page">
    <AppHeader><PageHeader title="Form unavailable" onBack={onBack}/></AppHeader>
    <p role="alert" className="text-supporting leading-relaxed">{message} Your records have not been changed.</p>
  </section>;
}
