import { createContext, useContext, useRef, useState, useEffect, useSyncExternalStore, type ReactNode, type SetStateAction, type Dispatch } from 'react';
import { useLocation } from 'wouter';
import { appPath, formForPath, definitions, ownerPath, allowFormExit, type FormDefinition } from '@/lib/form-routes';
import { hydrateForm } from '@/lib/form-hydration';
type Values = Record<string, any>;
type Store = {
    owner: string;
    values: Values;
    listeners: Set<() => void>;
    dirtyForms: Set<string>;
    closeTask?: object;
    closing?: boolean;
    navigate: ReturnType<typeof useLocation>[1];
};
const Context = createContext<Store | null>(null);
export function useFormStore() { const value = useContext(Context); if (!value)
    throw Error('Form navigation needs an owner'); return value; }
function snapshot(store: Store) { return { ...store.values }; }
function commitHistory(store: Store) {
    if (!formForPath())
        return;
    history.replaceState({ ...history.state, fitcircleForm: snapshot(store) }, '', window.location.href);
}
export function FormOwner({ owner, children }: {
    owner: string;
    children: ReactNode;
}) {
    const [, navigate] = useLocation();
    const store = useRef<Store>({ owner, values: {}, listeners: new Set(), dirtyForms:new Set(), navigate }).current;
    store.navigate = navigate;
    const [ready, setReady] = useState(!formForPath());
    const [failure, setFailure] = useState('');
    useEffect(() => {
        let disposed = false;
        if (!ready)
            hydrateForm(formForPath()!, history.state?.fitcircleForm ?? {}).then(values => {
                if (!disposed) {
                    store.values = values;
                    setReady(true);
                }
            }).catch(error => { if (!disposed) {
                setFailure(error instanceof Error ? error.message : 'This form could not be opened.');
                setReady(true);
            } });
        const restore = () => { if(store.closing)return;const values = history.state?.fitcircleForm; if (values) {
            store.values = { ...store.values, ...values };
            store.listeners.forEach(fn => fn());
        } };
        window.addEventListener('popstate', restore);
        return () => { disposed = true; window.removeEventListener('popstate', restore); };
    }, []);
    if (!ready)
        return <p role="status" className="p-4">Opening form…</p>;
    if (failure)
        return <section className="p-4 space-y-4"><h1 className="text-xl font-bold">Form unavailable</h1><p role="alert">{failure} Your records have not been changed.</p><button className="fc-pill min-h-11 text-accent-text" onClick={() => { allowFormExit(); navigate(ownerPath(owner), { replace: true }); setFailure(''); }}>Back</button></section>;
    return <Context.Provider value={store}>{children}</Context.Provider>;
}
/** Same state API as React; only transient form context is copied into history. */
export function useRouteState<T>(key: string, initial: T | (() => T)): [
    T,
    Dispatch<SetStateAction<T>>
] {
    const store = useFormStore();
    if (!(key in store.values))
        store.values[key] = typeof initial === 'function' ? (initial as () => T)() : initial;
    const value = useSyncExternalStore(fn => { store.listeners.add(fn); return () => { store.listeners.delete(fn); }; }, () => store.values[key]) as T;
    return [value, next => { store.values[key] = typeof next === 'function' ? (next as (old: T) => T)(store.values[key]) : next; commitHistory(store); store.listeners.forEach(fn => fn()); }];
}
function definition(store: Store, group: string): FormDefinition {
    const candidates = definitions.filter(d => d.owner === store.owner && d.group === group), v = store.values;
    if (group === 'workout')
        return candidates.find(d => d.id.endsWith(v.editingWorkout ? '-edit' : '-new'))!;
    if (group === 'routine')
        return candidates.find(d => d.id.endsWith(v.editingRoutine ? '-edit' : '-new'))!;
    if (group === 'fasting-entry')
        return candidates.find(d => d.id === (v.editingLog ? 'fasting-edit' : 'fasting-add'))!;
    if (group === 'food-custom')
        return candidates.find(d => d.id === (v.editingEntryId ? 'food-custom-edit' : 'food-custom'))!;
    if (group === 'profile-edit')
        return candidates.find(d => d.id === (v.editor === 'goals' ? 'profile-goals' : 'profile-edit'))!;
    if (group === 'meditation-add')
        return candidates.find(d => d.id === (v.meditationIntent === 'start' ? 'meditation-start' : 'meditation-add'))!;
    return candidates[0];
}
export function openForm(store: Store, group: string) {
    const def = definition(store, group);
    if (!def)
        throw Error(`Unknown form ${group}`);
    store.closeTask = undefined;
    let path = def.owner === 'overview' ? ownerPath('overview') + def.path : def.path;
    const v = store.values, params = new URLSearchParams();
    const record = group === 'workout' ? v.editingWorkout : group === 'routine' ? v.editingRoutine : group === 'cardio-edit' || group === 'hydration-edit' ? v.editingEntry : group === 'fasting-entry' ? v.editingLog : group === 'meditation-edit' ? v.editingSession : group === 'food-edit' ? v.editingEntry : group === 'database-edit' ? v.editingFood : null;
    const id = record?.id ?? (group === 'food-entry' ? v.addingFood?.id : group === 'food-custom' ? v.editingEntryId : undefined);
    if (id)
        params.set('id', id);
    const date = v.selectedDate ?? record?.date;
    if (date)
        params.set('date', date);
    if (store.owner === 'food-tracker')
        params.set('meal', v.searchMeal ?? 'breakfast');
    if (v.selectedRoutineId)
        params.set('routine', v.selectedRoutineId);
    if (params.size)
        path += '?' + params;
    const previous = group === 'food-entry' && formForPath()?.group === 'food-custom' && document.documentElement.dataset.formSaving ? (history.state?.fitcircleFormReturn ?? ownerPath(store.owner)) : appPath() + window.location.search;
    if (formForPath()?.id === def.id) {
        commitHistory(store);
        return;
    }
    const root = history.state?.fitcircleFormRoot ?? (formForPath() ? ownerPath(store.owner) : previous);
    store.navigate(path, { state: { fitcircleForm: snapshot(store), fitcircleFormReturn: previous, fitcircleFormRoot: root } });
}
export function closeForm(store: Store) {
    allowFormExit();
    const save = Boolean(document.documentElement.dataset.formSaving);
    delete document.documentElement.dataset.formSaving;
    const def = formForPath();
    const target = save && def?.id !== 'cardio-type' ? history.state?.fitcircleFormRoot : history.state?.fitcircleFormReturn;
    const destination=target || ownerPath(store.owner), values=snapshot(store);
    const finish=()=>{store.closing=false;store.navigate(destination,{replace:true,state:{fitcircleForm:values}});};
    if(history.state?.fitcircleDraftFence){
        store.closing=true;
        // Consume the editor's same-route draft fence before replacing its URL.
        return new Promise<void>(resolve=>{
            window.addEventListener('popstate',()=>{finish();resolve();},{once:true});
            history.back();
        });
    }
    finish();
    return Promise.resolve();
}
export function useRouteForm(group: string): [
    boolean,
    Dispatch<SetStateAction<boolean>>
] {
    const store = useFormStore();
    useLocation();
    const open = formForPath()?.group === group;
    return [open, next => {
            const value = typeof next === 'function' ? next(open) : next;
            if (value)
                openForm(store, group);
            else if (formForPath()?.group === group) {
                const task = {};
                store.closeTask = task;
                queueMicrotask(() => { if (store.closeTask === task && formForPath()?.group === group) {
                    store.closeTask = undefined;
                    closeForm(store);
                } });
            }
        }];
}
export function useRecordFormState<T>(key: string, initial: T, group: string): [
    T,
    Dispatch<SetStateAction<T>>
] {
    const store = useFormStore();
    const [value, setValue] = useRouteState(key, initial);
    return [value, next => { const updated = typeof next === 'function' ? (next as (old: T) => T)(value) : next; setValue(updated); if (updated !== null)
            openForm(store, group);
        else if (formForPath()?.group === group)
            closeForm(store); }];
}
