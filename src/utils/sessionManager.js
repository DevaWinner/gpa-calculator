const DB_NAME = "gpaCalculator";
const DB_VERSION = 1;
const SESSION_STORE = "sessions";

let dbPromise = null;
let ensureInitialSessionPromise = null;

export const generateId = () => {
	return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

const sortSessions = (sessions) =>
	[...sessions].sort((a, b) => b.lastModified - a.lastModified);

const toSessionMeta = (record) => ({
	id: record.id,
	name: record.name,
	lastModified: record.lastModified,
});

const requestToPromise = (request) =>
	new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () =>
			reject(request.error || new Error("IndexedDB request failed"));
	});

const openDatabase = () => {
	if (dbPromise) {
		return dbPromise;
	}

	dbPromise = new Promise((resolve, reject) => {
		if (typeof indexedDB === "undefined") {
			reject(new Error("IndexedDB is not available in this browser"));
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains(SESSION_STORE)) {
				db.createObjectStore(SESSION_STORE, { keyPath: "id" });
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () =>
			reject(request.error || new Error("Failed to open IndexedDB"));
		request.onblocked = () =>
			reject(new Error("IndexedDB upgrade blocked by another tab"));
	});

	return dbPromise;
};

const getObjectStore = async (mode) => {
	const db = await openDatabase();
	return db.transaction(SESSION_STORE, mode).objectStore(SESSION_STORE);
};

const getSessionRecord = async (sessionId) => {
	const store = await getObjectStore("readonly");
	return requestToPromise(store.get(sessionId));
};

const putSessionRecord = async (record) => {
	const store = await getObjectStore("readwrite");
	await requestToPromise(store.put(record));
	return record;
};

const deleteSessionRecord = async (sessionId) => {
	const store = await getObjectStore("readwrite");
	await requestToPromise(store.delete(sessionId));
};

export const getSessionIndex = async () => {
	const store = await getObjectStore("readonly");
	const records = await requestToPromise(store.getAll());
	return sortSessions(records.map(toSessionMeta));
};

export const loadSessionData = async (sessionId) => {
	const record = await getSessionRecord(sessionId);
	return record?.data ?? null;
};

export const saveSessionData = async (sessionId, data) => {
	const existing = await getSessionRecord(sessionId);
	const nextRecord = {
		id: sessionId,
		name: existing?.name || "Untitled Transcript",
		lastModified: Date.now(),
		data,
	};

	await putSessionRecord(nextRecord);
	return toSessionMeta(nextRecord);
};

export const createNewSession = async (
	name = "Untitled Transcript",
	data = null
) => {
	const session = {
		id: generateId(),
		name,
		lastModified: Date.now(),
		data,
	};

	await putSessionRecord(session);
	return toSessionMeta(session);
};

export const ensureInitialSession = async (
	name = "Untitled Transcript",
	data = null
) => {
	if (!ensureInitialSessionPromise) {
		ensureInitialSessionPromise = (async () => {
			const index = await getSessionIndex();

			if (index.length > 0) {
				const session = index[0];
				const sessionData = await loadSessionData(session.id);
				return { index, session, data: sessionData };
			}

			const session = await createNewSession(name, data);
			const nextIndex = await getSessionIndex();

			return { index: nextIndex, session, data };
		})().finally(() => {
			ensureInitialSessionPromise = null;
		});
	}

	return ensureInitialSessionPromise;
};

export const deleteSession = async (sessionId) => {
	await deleteSessionRecord(sessionId);
	return getSessionIndex();
};

export const renameSession = async (sessionId, newName) => {
	const existing = await getSessionRecord(sessionId);

	if (!existing) {
		return getSessionIndex();
	}

	await putSessionRecord({
		...existing,
		name: newName,
		lastModified: Date.now(),
	});

	return getSessionIndex();
};
