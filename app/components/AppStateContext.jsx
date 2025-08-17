"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Action types
const ActionTypes = {
    SET_FILES: 'SET_FILES',
    ADD_FILES: 'ADD_FILES',
    REMOVE_FILE: 'REMOVE_FILE',
    SET_CURRENT_PDF: 'SET_CURRENT_PDF',
    SET_SNIPPETS: 'SET_SNIPPETS',
    SET_INSIGHTS: 'SET_INSIGHTS',
    SET_AUDIO: 'SET_AUDIO',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
    files: new Map(), // Map<string, { id: string, name: string, file?: File, url?: string }>
    currentPdfId: null,
    snippets: [],
    insights: null,
    audioUrl: null,
    loading: {
        files: false,
        viewer: false,
        snippets: false,
        insights: false,
        audio: false
    },
    errors: {
        files: null,
        viewer: null,
        snippets: null,
        insights: null,
        audio: null
    }
};

// Reducer function
const appStateReducer = (state, action) => {
    switch (action.type) {
        case ActionTypes.SET_FILES: {
            const filesMap = new Map();
            action.payload.forEach(fileData => {
                filesMap.set(fileData.id, fileData);
            });
            return { ...state, files: filesMap };
        }

        case ActionTypes.ADD_FILES: {
            const newFiles = new Map(state.files);
            action.payload.forEach(fileData => {
                newFiles.set(fileData.id, fileData);
            });
            return { ...state, files: newFiles };
        }

        case ActionTypes.REMOVE_FILE: {
            const newFiles = new Map(state.files);
            const fileData = newFiles.get(action.payload);

            // Clean up object URL if exists
            if (fileData?.url && fileData.url.startsWith('blob:')) {
                URL.revokeObjectURL(fileData.url);
            }

            newFiles.delete(action.payload);

            // If removing current PDF, clear it
            const newCurrentPdfId = state.currentPdfId === action.payload ? null : state.currentPdfId;

            return {
                ...state,
                files: newFiles,
                currentPdfId: newCurrentPdfId
            };
        }

        case ActionTypes.SET_CURRENT_PDF:
            return { ...state, currentPdfId: action.payload };

        case ActionTypes.SET_SNIPPETS:
            return { ...state, snippets: action.payload || [] };

        case ActionTypes.SET_INSIGHTS:
            return { ...state, insights: action.payload };

        case ActionTypes.SET_AUDIO:
            return { ...state, audioUrl: action.payload };

        case ActionTypes.SET_LOADING:
            return {
                ...state,
                loading: { ...state.loading, [action.payload.key]: action.payload.value }
            };

        case ActionTypes.SET_ERROR:
            return {
                ...state,
                errors: { ...state.errors, [action.payload.key]: action.payload.value }
            };

        case ActionTypes.CLEAR_ERROR:
            return {
                ...state,
                errors: { ...state.errors, [action.payload]: null }
            };

        default:
            return state;
    }
};

// Context creation
const AppStateContext = createContext(null);

// Helper function to generate deterministic PDF ID
const generatePdfId = (file) => {
    return `${file.name}_${file.size}_${file.lastModified}`;
};

// Helper function to load files from localStorage
const loadFilesFromStorage = () => {
    if (typeof window === 'undefined') return [];

    try {
        const savedFiles = localStorage.getItem('pdf-app-files');
        return savedFiles ? JSON.parse(savedFiles) : [];
    } catch (error) {
        console.warn('Failed to load files from localStorage:', error);
        return [];
    }
};

// Helper function to save files to localStorage
const saveFilesToStorage = (filesMap) => {
    if (typeof window === 'undefined') return;

    try {
        const filesToSave = Array.from(filesMap.values()).map(fileData => ({
            id: fileData.id,
            name: fileData.name,
            // Don't save File objects, only URLs
            ...(fileData.url && !fileData.url.startsWith('blob:') && { url: fileData.url })
        }));

        localStorage.setItem('pdf-app-files', JSON.stringify(filesToSave));
        localStorage.setItem('pdf-app-current', localStorage.getItem('pdf-app-current') || '');
    } catch (error) {
        console.warn('Failed to save files to localStorage:', error);
    }
};

// Provider component
export const AppStateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appStateReducer, initialState);

    // Removed loading from localStorage to clear PDFs on refresh
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Clear localStorage to ensure no files are loaded
            localStorage.removeItem('pdf-app-files');
            localStorage.removeItem('pdf-app-current');
        }
    }, []);

    // Save files to localStorage when files change
    useEffect(() => {
        saveFilesToStorage(state.files);
    }, [state.files]);

    // Save current PDF ID to localStorage when it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('pdf-app-current', state.currentPdfId || '');
        }
    }, [state.currentPdfId]);

    // Action creators
    const addFiles = useCallback((files) => {
        const fileDataArray = Array.from(files).map(file => ({
            id: generatePdfId(file),
            name: file.name,
            file,
            url: URL.createObjectURL(file)
        }));

        dispatch({ type: ActionTypes.ADD_FILES, payload: fileDataArray });

        // Auto-select first file if no current PDF
        if (!state.currentPdfId && fileDataArray.length > 0) {
            dispatch({ type: ActionTypes.SET_CURRENT_PDF, payload: fileDataArray[0].id });
        }
    }, [state.currentPdfId]);

    const removeFile = useCallback((fileId) => {
        dispatch({ type: ActionTypes.REMOVE_FILE, payload: fileId });
    }, []);

    const setCurrentPdf = useCallback((pdfId) => {
        dispatch({ type: ActionTypes.SET_CURRENT_PDF, payload: pdfId });
    }, []);

    const setSnippets = useCallback((snippets) => {
        dispatch({ type: ActionTypes.SET_SNIPPETS, payload: snippets });
    }, []);

    const setInsights = useCallback((insights) => {
        dispatch({ type: ActionTypes.SET_INSIGHTS, payload: insights });
    }, []);

    const setAudio = useCallback((audioUrl) => {
        dispatch({ type: ActionTypes.SET_AUDIO, payload: audioUrl });
    }, []);

    const setLoading = useCallback((key, value) => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: { key, value } });
    }, []);

    const setError = useCallback((key, value) => {
        dispatch({ type: ActionTypes.SET_ERROR, payload: { key, value } });
    }, []);

    const clearError = useCallback((key) => {
        dispatch({ type: ActionTypes.CLEAR_ERROR, payload: key });
    }, []);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            Array.from(state.files.values()).forEach(fileData => {
                if (fileData.url && fileData.url.startsWith('blob:')) {
                    URL.revokeObjectURL(fileData.url);
                }
            });
        };
    }, [state.files]);

    const contextValue = {
        ...state,
        actions: {
            addFiles,
            removeFile,
            setCurrentPdf,
            setSnippets,
            setInsights,
            setAudio,
            setLoading,
            setError,
            clearError
        }
    };

    return (
        <AppStateContext.Provider value={contextValue}>
            {children}
        </AppStateContext.Provider>
    );
};

// Custom hooks
export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error('useAppState must be used within AppStateProvider');
    }
    return context;
};

export const useAppActions = () => {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error('useAppActions must be used within AppStateProvider');
    }
    return context.actions;
};

export default AppStateProvider;