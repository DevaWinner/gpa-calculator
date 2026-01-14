import { useState, useEffect } from "react";

function SessionManager({ 
    isOpen, 
    onClose, 
    activeSessionId, 
    sessions, 
    onSwitchSession, 
    onCreateSession, 
    onRenameSession, 
    onDeleteSession 
}) {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");

    if (!isOpen) return null;

    const handleStartEdit = (session) => {
        setEditingId(session.id);
        setEditName(session.name);
    };

    const handleSaveEdit = () => {
        if (editName.trim()) {
            onRenameSession(editingId, editName.trim());
        }
        setEditingId(null);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden max-h-[80vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Transcript Library</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {sessions.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No saved transcripts found.</p>
                    )}
                    
                    {sessions.map((session) => (
                        <div 
                            key={session.id}
                            className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                                session.id === activeSessionId 
                                    ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200" 
                                    : "bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm"
                            }`}
                        >
                            <div className="flex-1 min-w-0 mr-3" onClick={() => session.id !== activeSessionId && onSwitchSession(session.id)}>
                                {editingId === session.id ? (
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="text" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                            autoFocus
                                            className="w-full text-sm font-semibold text-gray-900 bg-white border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className={`cursor-pointer ${session.id === activeSessionId ? "" : "hover:text-indigo-600"}`}>
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-sm font-bold truncate ${session.id === activeSessionId ? "text-indigo-900" : "text-gray-700"}`}>
                                                {session.name}
                                            </h4>
                                            {session.id === activeSessionId && (
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded">Active</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Modified: {formatDate(session.lastModified)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleStartEdit(session); }}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Rename"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                {sessions.length > 1 && (
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if(window.confirm(`Delete "${session.name}"? This cannot be undone.`)) {
                                                onDeleteSession(session.id);
                                            }
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button 
                        onClick={onCreateSession}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        New Transcript
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SessionManager;
