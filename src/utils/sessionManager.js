// src/utils/sessionManager.js

const INDEX_KEY = "gpa_sessions_index";
const SESSION_PREFIX = "gpa_session_";

export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get the list of all available sessions
export const getSessionIndex = () => {
    try {
        const index = localStorage.getItem(INDEX_KEY);
        return index ? JSON.parse(index) : [];
    } catch (e) {
        console.error("Failed to load session index", e);
        return [];
    }
};

// Save the list of sessions
export const saveSessionIndex = (index) => {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
};

// Load a specific session's data
export const loadSessionData = (sessionId) => {
    try {
        const data = localStorage.getItem(`${SESSION_PREFIX}${sessionId}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error(`Failed to load session ${sessionId}`, e);
        return null;
    }
};

// Save a specific session's data
export const saveSessionData = (sessionId, data) => {
    localStorage.setItem(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(data));
};

// Create a new session and return its ID
export const createNewSession = (name = "Untitled Transcript") => {
    const id = generateId();
    const newSession = { id, name, lastModified: Date.now() };
    
    const index = getSessionIndex();
    index.push(newSession);
    saveSessionIndex(index);
    
    return newSession;
};

// Delete a session
export const deleteSession = (sessionId) => {
    const index = getSessionIndex().filter(s => s.id !== sessionId);
    saveSessionIndex(index);
    localStorage.removeItem(`${SESSION_PREFIX}${sessionId}`);
    return index; // Return updated index
};

// Rename a session
export const renameSession = (sessionId, newName) => {
    const index = getSessionIndex().map(s => 
        s.id === sessionId ? { ...s, name: newName, lastModified: Date.now() } : s
    );
    saveSessionIndex(index);
    return index;
};

// Migrate legacy data if it exists
export const migrateLegacyData = (legacyKey) => {
    const legacyData = localStorage.getItem(legacyKey);
    if (legacyData) {
        try {
            const data = JSON.parse(legacyData);
            const session = createNewSession("Legacy Transcript");
            saveSessionData(session.id, data);
            localStorage.removeItem(legacyKey); // Clean up
            return session.id;
        } catch (e) {
            console.error("Migration failed", e);
        }
    }
    return null;
};
