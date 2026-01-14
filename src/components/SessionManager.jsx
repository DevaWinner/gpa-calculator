import { useState, useEffect, useRef } from "react";

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
    const drawerRef = useRef(null);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target)) {
                // Check if the click was on the toggle button (which we can't easily ref here without context, 
                // but usually the button click handles the toggle. We just need to ensure we don't close immediately if clicking open)
                // For now, simple outside click.
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

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
        <div 
            ref={drawerRef}
            className="fixed left-6 bottom-20 z-[60] w-72 h-[50vh] bg-white shadow-2xl rounded-2xl flex flex-col border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-2xl">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Transcript Library</h3>
                <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {sessions.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-4">No saved transcripts.</p>
                )}
                
                {sessions.map((session) => (
                    <div 
                        key={session.id}
                        onClick={() => {
                            if (session.id !== activeSessionId) {
                                onSwitchSession(session.id);
                            }
                        }}
                        className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            session.id === activeSessionId 
                                ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm" 
                                : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                        }`}
                    >
                        <div className="flex-1 min-w-0 mr-2">
                            {editingId === session.id ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="text" 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                        autoFocus
                                        className="w-full text-xs font-semibold text-gray-900 bg-white border border-indigo-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700 p-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-sm font-bold truncate ${session.id === activeSessionId ? "text-indigo-900" : "text-gray-700"}`}>
                                            {session.name}
                                        </h4>
                                        {session.id === activeSessionId && (
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {formatDate(session.lastModified)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleStartEdit(session); }}
                                className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-white"
                                title="Rename"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            {sessions.length > 1 && (
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onDeleteSession(session.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-white"
                                    title="Delete"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button 
                    onClick={onCreateSession}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-all text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    New Transcript
                </button>
            </div>
        </div>
    );
}

export default SessionManager;