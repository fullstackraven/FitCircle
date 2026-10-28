import { PageHeader, EmptyState } from '@/components/ui/presentation';
import '@/styles/supplements.css';
import React, { useState, useEffect, useRef } from "react";
import { Pill, Plus, Edit2, Trash2, Calendar, ChevronDown, ChevronUp, Check, SlidersHorizontal } from "lucide-react";
import { useLocation } from "wouter";
import { useSupplements } from "@/hooks/use-supplements";
import { AddSupplementDialog } from "@/components/AddSupplementDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

export function SupplementsPage() {
  const [, navigate] = useLocation();
  const {
    supplements: allSupplements,
    getSupplementLogsForDate,
    setSupplementLog,
    deleteSupplement,
    editSupplement
  } = useSupplements();
  
  // Check if we came from wellness page
  const urlParams = new URLSearchParams(window.location.search);
  const fromWellness = urlParams.get('from') === 'wellness';
  
  const handleBack = () => {
    if (fromWellness) {
      navigate('/wellness');
    } else {
      navigate('/calendar');
    }
  };
  
  const [tempSupplementLogs, setTempSupplementLogs] = useState<{id: number, name: string, taken: boolean}[]>([]);
  const addTriggerRef = useRef<HTMLDivElement>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    // Load today's supplement logs
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const logsData = getSupplementLogsForDate(dateStr);
    const supplementLogs = allSupplements.map(supplement => ({
      id: supplement.id,
      name: supplement.name,
      taken: logsData[supplement.id] || false
    }));
    setTempSupplementLogs(supplementLogs);
  }, []);

  const handleSupplementToggle = (supplementId: number) => {
    setTempSupplementLogs(prev =>
      prev.map(log =>
        log.id === supplementId
          ? { ...log, taken: !log.taken }
          : log
      )
    );
  };

  const handleSaveSupplements = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    tempSupplementLogs.forEach(log => {
      setSupplementLog(dateStr, log.id, log.taken);
    });
    alert('Supplement log saved successfully!');
  };

  const handleEditSupplement = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      editSupplement(editingId, { name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
      // Refresh the page to show updated data
      window.location.reload();
    }
  };

  const handleDeleteSupplement = (id: number) => {
    if (window.confirm("Are you sure you want to delete this supplement?")) {
      deleteSupplement(id);
      // Refresh the page to show updated data
      window.location.reload();
    }
  };

  const takenCount = tempSupplementLogs.filter(log => log.taken).length;
  const supplementById = new Map(allSupplements.map(supplement => [supplement.id, supplement]));
  return (
    <div className="fitcircle-page supplements-page">
      <div className="fitcircle-container">
        <PageHeader title="Supplements" onBack={handleBack} actions={<div ref={addTriggerRef} className="supplement-add-trigger"><AddSupplementDialog onSupplementAdded={() => window.location.reload()}/></div>} />
        <section className="fc-section supplements-card" aria-labelledby="daily-supplements-heading">
          <div className="flex items-center gap-3 mb-4">
            <span className="supplement-heading-icon"><Pill size={25}/></span>
            <div className="min-w-0 flex-1"><h2 id="daily-supplements-heading" className="font-bold text-base text-strong">Today's Supplements</h2><p className="text-xs text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM d")}</p></div>
            <div className="text-right shrink-0"><strong className="block text-xl text-accent-text" data-testid="supplement-completion">{takenCount}/{tempSupplementLogs.length}</strong><span className="text-[9px] uppercase tracking-wide text-muted-foreground">Completed</span></div>
          </div>
          <div className="overview-progress" role="progressbar" aria-label="Supplements taken" aria-valuemin={0} aria-valuemax={tempSupplementLogs.length || 1} aria-valuenow={takenCount} aria-valuetext={`${takenCount} of ${tempSupplementLogs.length} supplements taken`}><div style={{width:`${tempSupplementLogs.length ? takenCount / tempSupplementLogs.length * 100 : 0}%`}}/></div>
          <div className="overview-supplement-list">
            {tempSupplementLogs.map(log => {
              const supplement = supplementById.get(log.id);
              return <button key={log.id} type="button" role="checkbox" aria-label={log.name} aria-checked={log.taken} onClick={()=>handleSupplementToggle(log.id)} className={`overview-supplement-row ${log.taken ? 'supplement-taken' : ''}`}>
                <span className={`overview-check ${log.taken ? 'is-taken' : ''}`} aria-hidden="true">{log.taken && <Check size={16}/>}</span>
                <span className="overview-supplement-name"><span className="block font-semibold text-strong">{log.name}</span>{supplement && <span className="block text-xs text-muted-foreground mt-0.5">{supplement.amount} {supplement.measurementType}</span>}</span>
                <span className={log.taken ? 'text-accent-text' : 'text-muted-foreground'}>{log.taken ? 'Taken' : 'Not taken'}</span>
              </button>;
            })}
            {!tempSupplementLogs.length && <EmptyState>No supplements added yet</EmptyState>}
          </div>
          {!!tempSupplementLogs.length && <button onClick={handleSaveSupplements} className="fc-pill fc-action fc-action-primary w-full supplement-save"><Check size={19}/>Save Today's Log</button>}
        </section>
        <Collapsible open={isManageOpen} onOpenChange={setIsManageOpen} className="fc-section supplements-card mt-4 !p-0">
          <CollapsibleTrigger className="supplement-manage-trigger"><SlidersHorizontal size={20} className="text-muted-foreground shrink-0"/><h2 className="flex-1 text-left font-semibold text-base text-strong">Manage Supplements</h2>{isManageOpen ? <ChevronUp size={19}/> : <ChevronDown size={19}/>}</CollapsibleTrigger>
          <CollapsibleContent className="border-t border-separator p-4">
            <p className="text-xs text-muted-foreground mb-3">View saved quantities and edit your supplement list.</p>
            {allSupplements.map(supplement => <div key={supplement.id} className="supplement-management-row">
              {editingId === supplement.id ? <div className="flex flex-wrap items-center gap-2 w-full">
                <input type="text" aria-label="Supplement name" value={editingName} onChange={e=>setEditingName(e.target.value)} className="min-w-0 w-full rounded-lg border border-control-muted-border bg-input-background text-strong px-3 py-2" autoFocus/>
                <button onClick={handleSaveEdit} className="fc-pill min-h-11 px-4 bg-action text-on-action text-sm">Save</button>
                <button onClick={()=>{setEditingId(null);setEditingName('');}} className="fc-pill min-h-11 px-4 border border-control-border text-supporting text-sm">Cancel</button>
              </div> : <>
                <Pill size={17} className="text-accent-text shrink-0"/>
                <div className="min-w-0 flex-1"><span className="block text-sm font-semibold text-strong break-words">{supplement.name}</span><span className="block text-xs text-muted-foreground mt-0.5">{supplement.amount} {supplement.measurementType}</span></div>
                <button onClick={()=>handleEditSupplement(supplement.id,supplement.name)} title="Edit supplement" aria-label={`Edit ${supplement.name}`} className="fc-pill fc-icon-button supplement-edit"><Edit2 size={17}/></button>
                <button onClick={()=>handleDeleteSupplement(supplement.id)} title="Delete supplement" aria-label={`Delete ${supplement.name}`} className="fc-pill fc-icon-button supplement-delete"><Trash2 size={18}/></button>
              </>}
            </div>)}
            {!allSupplements.length && <EmptyState>No supplements added yet</EmptyState>}
            <button onClick={()=>addTriggerRef.current?.querySelector('button')?.click()} className="fc-pill fc-action fc-action-secondary w-full mt-3 supplement-add-secondary"><Plus size={18}/>Add Supplement</button>
          </CollapsibleContent>
        </Collapsible>
        <p className="flex items-start gap-2 mt-5 text-xs text-muted-foreground leading-relaxed"><Calendar size={17} className="shrink-0 mt-0.5"/>Tip: Tap any day on the calendar to view or edit past supplement logs</p>
      </div>
    </div>
  );
}
