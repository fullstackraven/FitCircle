import { FormUnavailable } from './FormUnavailable';
import React, { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { PageHeader } from '@/components/ui/presentation';
import { formForPath, FORM_EXIT, ownerPath } from '@/lib/form-routes';
import { useRouteForm, useFormStore, closeForm, nextFormHistoryDepth } from './FormNavigation';
import { cn } from '@/lib/utils';
import '@/styles/form-pages.css';
const FormContext = createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => { } });
/** Render the active tagged editor while its feature hooks and handlers stay mounted. */
export function FormScreen({ children }: {
    children: ReactNode;
}) {
    const store = useFormStore(), active = formForPath();
    if (!active)
        return <>{children}</>;
    const find = (nodes: ReactNode): React.ReactElement | null => {
        let found: React.ReactElement | null = null;
        React.Children.forEach(nodes, node => {
            if (found || !React.isValidElement<any>(node))
                return;
            if (node.props.formId === active.group) {
                found = node;
                return;
            }
            found = find(node.props.children) ?? find(node.props.actions);
        });
        return found;
    };
    const selected = find(children);
    return (selected ? React.cloneElement(selected, { key: active.id }) : null) ?? <FormUnavailable message="This record or form is not available." onBack={()=>store.navigate(ownerPath(store.owner),{replace:true})}/>;
}
export function FormGroup({ children, formId, open, onOpenChange }: {
    children: ReactNode;
    formId: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [active, setActive] = useRouteForm(formId);
    return <FormContext.Provider value={{ open: open ?? active, setOpen: onOpenChange ?? setActive }}>{children}</FormContext.Provider>;
}
export function FormTrigger({ children, asChild }: {
    children: ReactNode;
    asChild?: boolean;
}) {
    const context = useContext(FormContext);
    if (context.open)
        return null;
    if (asChild && React.isValidElement<any>(children))
        return React.cloneElement(children, { onClick: (event: any) => { children.props.onClick?.(event); if (!event.defaultPrevented)
                context.setOpen(true); } });
    return <button className="fc-pill min-h-11" onClick={() => context.setOpen(true)}>{children}</button>;
}
function text(nodes: ReactNode): string { let result = ''; React.Children.forEach(nodes, node => { if (typeof node === 'string' || typeof node === 'number')
    result += node;
else if (React.isValidElement<any>(node))
    result += text(node.props.children); }); return result; }
function titleIn(nodes: ReactNode): string { let result = ''; React.Children.forEach(nodes, node => { if (!React.isValidElement<any>(node) || result)
    return; result = node.type === FormTitle ? text(node.props.children) : titleIn(node.props.children); }); return result; }
export function FormContent({ children, variant = 'standard', title, onCancel, headerActions }: {
    children: ReactNode;
    variant?: 'standard' | 'training';
    title?: string;
    onCancel?: () => void;
    headerActions?: ReactNode;
}) {
    const context = useContext(FormContext), store = useFormStore();
    const active = formForPath();
    const dirty = useRef(Boolean(history.state?.fitcircleDraftFence) || store.dirtyForms.has(active?.id ?? '')), allowedToLeave = useRef(false), root = useRef<HTMLDivElement>(null);
    const fence = useRef(history.state?.fitcircleDraftFence ?? `form-draft-${Date.now()}-${Math.random()}`);
    const markDirty = () => {
        if (!allowedToLeave.current && !dirty.current) {
            dirty.current = true;
            if(active)store.dirtyForms.add(active.id);
            // A same-route history fence keeps the form mounted while Back asks.
            history.pushState({...history.state, ...nextFormHistoryDepth(), fitcircleDraftFence:fence.current}, '', window.location.href);
        }
    };
    const close = () => { if (dirty.current && !window.confirm('Discard unsaved changes?'))
        return; dirty.current = false; delete document.documentElement.dataset.formSaving; (onCancel ?? (() => context.setOpen(false)))(); };
    useEffect(() => {
        if(active && dirty.current){
            store.dirtyForms.add(active.id);
            if(!history.state?.fitcircleDraftFence)history.pushState({...history.state, ...nextFormHistoryDepth(),fitcircleDraftFence:fence.current},'',window.location.href);
        }
        const clear = () => { allowedToLeave.current=true;dirty.current = false;if(active)store.dirtyForms.delete(active.id); };
        const unload = (event: BeforeUnloadEvent) => { if (dirty.current) {
            event.preventDefault();
            event.returnValue = '';
        } };
        const pop = (event: PopStateEvent) => {
            if (!dirty.current || history.state?.fitcircleDraftFence === fence.current) return;
            event.stopImmediatePropagation();
            if (!window.confirm('Discard unsaved changes?')) {
                history.pushState({...history.state, ...nextFormHistoryDepth(), fitcircleForm:{...store.values}, fitcircleDraftFence:fence.current}, '', window.location.href);
                return;
            }
            dirty.current=false;
            delete document.documentElement.dataset.formSaving;
            closeForm(store);
        };
        const link = (event: MouseEvent) => {
            const anchor = (event.target as Element)?.closest('a[href]');
            if (dirty.current && anchor && anchor.getAttribute('target') !== '_blank' && !anchor.hasAttribute('download') && anchor.getAttribute('href') !== location.href && !window.confirm('Discard unsaved changes?')) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        window.addEventListener(FORM_EXIT, clear);
        window.addEventListener('beforeunload', unload);
        window.addEventListener('popstate', pop, true);
        document.addEventListener('click', link, true);
        return () => { window.removeEventListener(FORM_EXIT, clear); window.removeEventListener('beforeunload', unload); window.removeEventListener('popstate', pop, true); document.removeEventListener('click', link, true); delete document.documentElement.dataset.formSaving; };
    }, []);
    // Standalone content (goal/workout pages) has an explicit cancel callback.
    if (!active || (!onCancel && !context.open))
        return null;
    const heading = active.title || title || titleIn(children);
    return <section className="form-page" aria-label={heading} data-form-page={active.id}>
    <AppHeader><PageHeader title={heading} onBack={close} actions={headerActions} className={headerActions ? "!grid-cols-[44px_minmax(0,1fr)_auto] px-4" : undefined}/></AppHeader>
    <div ref={root} className={cn('form-page-content',variant==='training'&&'training-editor')} onPointerDownCapture={event=>{
        // Radix Select opens on pointerdown and suppresses its trigger click.
        if((event.target as Element).closest('[role="combobox"]') && !['food-search','food-scan','exercise-catalog'].includes(active.group))markDirty();
    }} onKeyDownCapture={event=>{
        if(['Enter',' ','ArrowDown','ArrowUp'].includes(event.key) && (event.target as Element).closest('[role="combobox"]') && !['food-search','food-scan','exercise-catalog'].includes(active.group))markDirty();
    }} onInputCapture={() => { if (!['food-search', 'food-scan', 'exercise-catalog'].includes(active.group))
        markDirty(); }} onChangeCapture={() => { if (!['food-search', 'food-scan', 'exercise-catalog'].includes(active.group))
        markDirty(); }} onClickCapture={event => {
            const button = (event.target as Element)?.closest('button');
            if (!button)
                return;
            // Planner buttons mutate a routine draft rather than submitting it.
            // Track those changes just like inputs before nested navigation.
            if (button.closest('[data-planning-edit]')) {
                delete document.documentElement.dataset.formSaving;
                markDirty();
                return;
            }
            const label = button.getAttribute('aria-label') ?? button.textContent?.trim() ?? '';
            // Cancel is an explicit discard; Back and browser navigation remain guarded.
            if (/^cancel$/i.test(label))
                dirty.current = false;
            if (/^(save|add|create|start|log|update|delete)/i.test(label))
                document.documentElement.dataset.formSaving = 'true';
            else {
                delete document.documentElement.dataset.formSaving;
                if ((button.hasAttribute('aria-pressed') || button.getAttribute('role') === 'combobox' || button.closest('.editor-days')) && !button.closest('.goal-editor-segments') && !['food-search', 'food-scan', 'exercise-catalog'].includes(active.group))
                    markDirty();
            }
        }}>{children}</div>
  </section>;
}
export function FormHeader({ children, className }: {
    children: ReactNode;
    className?: string;
}) {
    const hidden=React.Children.toArray(children).every(node=>React.isValidElement<any>(node)&&(node.type===FormTitle||node.props.className?.includes('sr-only')));
    return <div className={cn('form-introduction',hidden&&'sr-only',className)}>{children}</div>;
}
export function FormTitle(_props: React.HTMLAttributes<HTMLHeadingElement>) { return null; }
export function FormDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) { return <p {...props} className={cn(className,'text-left')}>{children}</p>; }
/** Page actions stay in document flow, with the primary action before Cancel. */
export function FormActions({primary,secondary}:{primary:ReactNode;secondary?:ReactNode}) {
    return <footer className="form-actions">{primary&&<div className="form-action-primary">{primary}</div>}{secondary&&<div className="form-action-secondary">{secondary}</div>}</footer>;
}
export function FormFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={cn('form-footer', className)}>{children}</div>; }
