import React, { useState, useEffect } from "react";
import { ArrowLeft, Pill, Plus, Edit2, Trash2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
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
  
  const [tempSupplementLogs, setTempSupplementLogs] = useState<{id: number, name: string, taken: boolean}[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/calendar")}
          className="text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
          title="Back to Calendar"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-xl font-bold text-white">Supplements</h1>
        
        <AddSupplementDialog 
          onSupplementAdded={() => window.location.reload()}
        />
      </div>

      <div className="space-y-6">
        {/* Today's Supplements */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Pill className="w-6 h-6 text-green-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Today's Supplements</h2>
              <p className="text-sm text-slate-400">{format(new Date(), "MMMM d, yyyy")}</p>
            </div>
          </div>

          {tempSupplementLogs.length > 0 ? (
            <div className="space-y-3">
              {tempSupplementLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleSupplementToggle(log.id)}
                      className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                        log.taken
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {log.taken && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                    <span className={`font-medium ${log.taken ? 'text-green-400' : 'text-white'}`}>
                      {log.name}
                    </span>
                  </div>
                  <span className={`text-sm ${log.taken ? 'text-green-400' : 'text-slate-400'}`}>
                    {log.taken ? 'Taken' : 'Not taken'}
                  </span>
                </div>
              ))}
              
              <button
                onClick={handleSaveSupplements}
                className="w-full mt-4 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium"
              >
                Save Today's Log
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No supplements added yet</p>
            </div>
          )}
        </div>

        {/* Manage Supplements - Collapsible */}
        <Collapsible open={isManageOpen} onOpenChange={setIsManageOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            <h2 className="text-lg font-semibold text-white">Manage Supplements</h2>
            {isManageOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 bg-slate-800 rounded-xl p-6">
              {allSupplements.length > 0 ? (
                <div className="space-y-3">
                  {allSupplements.map(supplement => (
                    <div key={supplement.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-xl">
                      {editingId === supplement.id ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-800 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-400"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingName("");
                            }}
                            className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <Pill className="w-4 h-4 text-green-400" />
                            <span className="text-white font-medium">{supplement.name}</span>
                            <span className="text-xs text-slate-400">
                              {supplement.amount} {supplement.measurementType}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditSupplement(supplement.id, supplement.name)}
                              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
                              title="Edit supplement"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSupplement(supplement.id)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                              title="Delete supplement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">No supplements added yet</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="bg-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-300">
            <Calendar className="w-4 h-4 inline mr-2" />
            Tip: Tap any day on the calendar to view or edit past supplement logs
          </p>
        </div>
      </div>


    </div>
  );
}