// AppStateContext.jsx (Fixed for Next.js SSR)
"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// Dynamic import for PDF.js (client-side only)
let pdfjs = null;

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
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_RELEVANT_SECTIONS: 'SET_RELEVANT_SECTIONS',
    SET_JUMP_TO_PAGE: 'SET_JUMP_TO_PAGE',
    UPDATE_FILE_HEADINGS: 'UPDATE_FILE_HEADINGS'
};

// Initial state
const initialState = {
    files: new Map(),
    currentPdfId: null,
    snippets: [],
    insights: null,
    audioUrl: null,
    relevantSections: [],
    jumpToPage: null,
    loading: {
        files: false,
        viewer: false,
        snippets: false,
        insights: false,
        audio: false,
        sections: false,
        headings: false
    },
    errors: {
        files: null,
        viewer: null,
        snippets: null,
        insights: null,
        audio: null,
        sections: null,
        headings: null
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

        case ActionTypes.SET_RELEVANT_SECTIONS:
            return { ...state, relevantSections: action.payload || [] };

        case ActionTypes.SET_JUMP_TO_PAGE:
            return { ...state, jumpToPage: action.payload };

        case ActionTypes.UPDATE_FILE_HEADINGS: {
            const newFiles = new Map(state.files);
            action.payload.forEach(({ fileId, headings }) => {
                const fileData = newFiles.get(fileId);
                if (fileData) {
                    fileData.geminiHeadings = headings;
                }
            });
            return { ...state, files: newFiles };
        }

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

// Helper function to convert File to base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data:application/pdf;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
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
        if (filesMap.size === 0) {
            localStorage.removeItem('pdf-app-files');
            localStorage.removeItem('pdf-app-current');
        } else {
            const filesToSave = Array.from(filesMap.values()).map(fileData => ({
                id: fileData.id,
                name: fileData.name,
                ...(fileData.url && !fileData.url.startsWith('blob:') && { url: fileData.url })
            }));

            localStorage.setItem('pdf-app-files', JSON.stringify(filesToSave));
            localStorage.setItem('pdf-app-current', localStorage.getItem('pdf-app-current') || '');
        }
    } catch (error) {
        console.warn('Failed to save files to localStorage:', error);
    }
};

// Initialize PDF.js only on client-side
const initializePdfJs = async () => {
    if (typeof window === 'undefined') return null;

    try {
        const pdfjsModule = await import('pdfjs-dist');

        // Simple worker setup for Docker compatibility
        pdfjsModule.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.338/build/pdf.worker.min.js';

        return pdfjsModule;
    } catch (error) {
        console.error('Failed to load PDF.js:', error);
        return null;
    }
};

// Provider component
export const AppStateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appStateReducer, initialState);
    const [isClient, setIsClient] = useState(false);
    const [pdfJsReady, setPdfJsReady] = useState(false);

    // Initialize client-side components
    useEffect(() => {
        setIsClient(true);

        const loadPdfJs = async () => {
            const pdfjsModule = await initializePdfJs();
            if (pdfjsModule) {
                pdfjs = pdfjsModule;
                setPdfJsReady(true);
            }
        };

        loadPdfJs();
    }, []);

    // Clear localStorage on mount (client-side only)
    useEffect(() => {
        if (isClient) {
            localStorage.removeItem('pdf-app-files');
            localStorage.removeItem('pdf-app-current');
        }
    }, [isClient]);

    // Save files to localStorage when files change
    useEffect(() => {
        if (isClient) {
            saveFilesToStorage(state.files);
        }
    }, [state.files, isClient]);

    // Save current PDF ID to localStorage when it changes
    useEffect(() => {
        if (isClient) {
            localStorage.setItem('pdf-app-current', state.currentPdfId || '');
        }
    }, [state.currentPdfId, isClient]);

    // Handle snippets change: find relevant sections using LLM from other PDFs
    useEffect(() => {
        if (state.snippets.length === 0 || !state.currentPdfId) {
            dispatch({ type: ActionTypes.SET_RELEVANT_SECTIONS, payload: [] });
            dispatch({ type: ActionTypes.SET_INSIGHTS, payload: null });
            if (state.audioUrl) {
                URL.revokeObjectURL(state.audioUrl);
                dispatch({ type: ActionTypes.SET_AUDIO, payload: null });
            }
            return;
        }

        const findRelevantSections = async () => {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'sections', value: true } });
            try {
                const selectedText = state.snippets[0];
                const allHeadings = [];

                // Combine both Gemini headings and PDF.js outline
                state.files.forEach((fileData) => {
                    if (fileData.id !== state.currentPdfId) {
                        // Add Gemini headings
                        if (fileData.geminiHeadings && fileData.geminiHeadings.length > 0) {
                            fileData.geminiHeadings.forEach((heading) => {
                                allHeadings.push({
                                    pdfId: fileData.id,
                                    fileName: fileData.name,
                                    page: heading.page,
                                    level: heading.level,
                                    text: heading.text,
                                });
                            });
                        }

                        // Add PDF.js outline as fallback
                        if (fileData.outline && fileData.outline.length > 0) {
                            fileData.outline.forEach((heading) => {
                                allHeadings.push({
                                    pdfId: fileData.id,
                                    fileName: fileData.name,
                                    page: heading.page,
                                    level: heading.level,
                                    text: heading.text,
                                });
                            });
                        }
                    }
                });

                if (allHeadings.length === 0) {
                    throw new Error('No headings available in other documents');
                }

                const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const prompt = `
Selected text: ${selectedText}

Headings from other documents:
${allHeadings.map((h) => `${h.fileName} - Page ${h.page}: ${h.level} ${h.text}`).join('\n')}

Based on the selected text, select up to 5 most relevant headings from other PDFs. Output only a JSON array of objects like: [{"pdfId": "id", "page": number, "title": "heading text"}]
                `;

                const result = await model.generateContent(prompt);
                let responseText = result.response.text().trim();
                const jsonStart = responseText.indexOf('[');
                const jsonEnd = responseText.lastIndexOf(']') + 1;
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    responseText = responseText.substring(jsonStart, jsonEnd);
                }
                const relevant = JSON.parse(responseText);
                dispatch({
                    type: ActionTypes.SET_RELEVANT_SECTIONS,
                    payload: relevant.map((r) => ({ pdfId: r.pdfId, page: r.page, title: r.title })),
                });
            } catch (error) {
                console.error('Error finding relevant sections:', error);
                dispatch({ type: ActionTypes.SET_ERROR, payload: { key: 'sections', value: error.message } });
                dispatch({ type: ActionTypes.SET_RELEVANT_SECTIONS, payload: [] });
            } finally {
                dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'sections', value: false } });
            }
        };

        findRelevantSections();
    }, [state.snippets, state.files, state.currentPdfId]);

    // Enhanced parallel heading extraction with direct PDF processing
    const extractHeadingsParallel = useCallback(async (fileDataArray) => {
        if (!fileDataArray.length || !isClient) return;

        dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'headings', value: true } });
        dispatch({ type: ActionTypes.CLEAR_ERROR, payload: 'headings' });

        try {
            const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const headingPromises = fileDataArray.map(async (fileData) => {
                try {
                    // Convert PDF file to base64 for direct processing
                    const base64Data = await fileToBase64(fileData.file);

                    const prompt = `
Analyze this PDF document and extract ALL section headings, chapter titles, and subheadings.

For each heading found, provide:
1. The exact heading text (clean, without numbering or bullets)
2. The heading hierarchy level (H1 for main chapters/sections, H2 for subsections, H3 for sub-subsections)
3. Estimate the page number where this heading appears

Focus on:
- Chapter titles and section headings
- Subsection titles
- Any text that appears to be a structural heading
- Table of contents entries (if visible)
- Bold or larger text that serves as headers

Ignore:
- Regular paragraph text
- Captions
- Headers/footers with page numbers
- Short phrases that aren't actual headings

Return ONLY a JSON array in this exact format:
[
  {
    "page": 1,
    "text": "Introduction",
    "level": "H1"
  },
  {
    "page": 3,
    "text": "Background and Literature Review",
    "level": "H2"
  },
  {
    "page": 5,
    "text": "Methodology",
    "level": "H1"
  }
]

If no clear headings are found, return an empty array: []
                    `;

                    const contents = [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: 'application/pdf',
                                data: base64Data
                            }
                        }
                    ];

                    const result = await model.generateContent(contents);
                    let responseText = result.response.text().trim();

                    // Extract JSON from response
                    const jsonStart = responseText.indexOf('[');
                    const jsonEnd = responseText.lastIndexOf(']') + 1;

                    if (jsonStart === -1 || jsonEnd === -1) {
                        console.warn(`No JSON found in Gemini response for ${fileData.name}, using empty array`);
                        return { fileId: fileData.id, headings: [] };
                    }

                    const cleanJson = responseText.substring(jsonStart, jsonEnd);
                    const headings = JSON.parse(cleanJson);

                    // Validate and clean headings
                    const validHeadings = headings.filter(h =>
                        h.text &&
                        typeof h.text === 'string' &&
                        h.text.trim().length > 0 &&
                        h.page &&
                        typeof h.page === 'number' &&
                        h.level &&
                        ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(h.level)
                    ).map(h => ({
                        ...h,
                        text: h.text.trim()
                    }));

                    console.log(`Extracted ${validHeadings.length} headings from ${fileData.name}`);
                    return { fileId: fileData.id, headings: validHeadings };

                } catch (error) {
                    console.error(`Error extracting headings for ${fileData.name}:`, error);
                    return { fileId: fileData.id, headings: [] };
                }
            });

            // Wait for all heading extractions to complete
            const results = await Promise.all(headingPromises);

            // Update state with extracted headings
            dispatch({
                type: ActionTypes.UPDATE_FILE_HEADINGS,
                payload: results
            });

            // Log results for debugging
            const totalHeadings = results.reduce((sum, r) => sum + r.headings.length, 0);
            console.log(`Extracted ${totalHeadings} total headings from ${results.length} files`);

        } catch (error) {
            console.error('Error in parallel heading extraction:', error);
            dispatch({
                type: ActionTypes.SET_ERROR,
                payload: { key: 'headings', value: error.message }
            });
        } finally {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'headings', value: false } });
        }
    }, [isClient]);

    // Action creators
    const addFiles = useCallback(async (files) => {
        if (!isClient || !pdfJsReady || !pdfjs) {
            console.warn('PDF.js not ready or not on client side');
            return;
        }

        dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'files', value: true } });

        const fileDataArray = [];
        for (const file of files) {
            const id = generatePdfId(file);
            const url = URL.createObjectURL(file);
            let textPerPage = [];
            let headingsPerPage = [];
            let outline = [];
            let pageHeights = [];

            try {
                const pdf = await pdfjs.getDocument(url).promise;
                const fontSizes = [];

                for (let p = 1; p <= pdf.numPages; p++) {
                    const page = await pdf.getPage(p);
                    const viewport = page.getViewport({ scale: 1 });
                    pageHeights.push(viewport.height);
                    const content = await page.getTextContent();
                    const pageText = content.items.map((item) => item.str).join(' ');
                    textPerPage.push(pageText);

                    // Collect all spans for heading detection
                    const pageHeadings = [];
                    content.items.forEach((item) => {
                        if (item.str.trim()) {
                            fontSizes.push(item.height);
                            pageHeadings.push({
                                text: item.str.trim(),
                                fontSize: Math.round(item.height * 10) / 10,
                                isBold: item.fontName.toLowerCase().includes('bold'),
                                bbox: item.transform,
                            });
                        }
                    });

                    // Determine most common font size for this PDF
                    const mostCommonSize = fontSizes.length > 0
                        ? fontSizes.sort((a, b) => fontSizes.filter(v => v === a).length - fontSizes.filter(v => v === b).length).pop()
                        : 10;

                    // Filter likely headings
                    const potentialHeadings = pageHeadings.filter((info) => {
                        const text = info.text;
                        if (text.length > 100 || text.length < 2) return false;
                        const sizeFactor = info.fontSize > mostCommonSize * 1.05 ? 1 : 0;
                        const boldFactor = info.isBold ? 1 : 0;
                        const formatFactor = text.toUpperCase() === text || /^\d+[\.]/.test(text) || text.endsWith(':') ? 1 : 0;
                        return sizeFactor + boldFactor + formatFactor >= 2;
                    });

                    headingsPerPage.push(potentialHeadings);
                }

                // Build outline (existing logic)
                let allHeadings = [];
                headingsPerPage.forEach((pageHeadings, index) => {
                    allHeadings.push(
                        ...pageHeadings.map((h) => ({
                            ...h,
                            page: index + 1,
                        }))
                    );
                });

                const headingSizes = [...new Set(allHeadings.map((h) => h.fontSize))].sort((a, b) => b - a);
                const sizeToLevel = {};
                headingSizes.slice(0, 3).forEach((size, idx) => {
                    sizeToLevel[size] = `H${idx + 1}`;
                });

                for (const heading of allHeadings) {
                    const level = sizeToLevel[heading.fontSize];
                    if (!level) continue;

                    let text = heading.text.trim();
                    text = text.replace(/^[•\-\s]*/, '');
                    text = text.replace(/^\d+[\.\)]\s*/, '');
                    if (!text) continue;

                    if (outline.length) {
                        const last = outline[outline.length - 1];
                        if (
                            last.page === heading.page &&
                            last.level === level &&
                            Math.abs(heading.bbox[5] - last.bbox[5]) < 30
                        ) {
                            last.text += ` ${text}`;
                            continue;
                        }
                    }

                    outline.push({
                        level,
                        text,
                        page: heading.page,
                    });
                }
            } catch (error) {
                console.error(`Error extracting text/outline from ${file.name}:`, error);
            }

            fileDataArray.push({
                id,
                name: file.name,
                file,
                url,
                textPerPage,
                headingsPerPage,
                outline,
                geminiHeadings: [] // Initialize empty, will be populated by parallel extraction
            });
        }

        dispatch({ type: ActionTypes.ADD_FILES, payload: fileDataArray });
        dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'files', value: false } });

        // Auto-select first file if no current PDF
        if (!state.currentPdfId && fileDataArray.length > 0) {
            dispatch({ type: ActionTypes.SET_CURRENT_PDF, payload: fileDataArray[0].id });
        }

        // Extract headings in parallel after files are processed
        extractHeadingsParallel(fileDataArray);

    }, [state.currentPdfId, extractHeadingsParallel, isClient, pdfJsReady]);

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

    const setJumpToPage = useCallback((page) => {
        dispatch({ type: ActionTypes.SET_JUMP_TO_PAGE, payload: page });
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

    const generateInsights = useCallback(async () => {
        if (!state.snippets.length || state.loading.insights) return;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'insights', value: true } });
        try {
            const text = state.snippets[0];
            const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(`give me:
                One key insight in a single sentence.
                One 'Did you know?' fact in a single sentence.
                One contradiction or counterpoint in a single sentence.
                One inspiration or connection : for this ${text}`);
            dispatch({ type: ActionTypes.SET_INSIGHTS, payload: result.response.text() });
        } catch (error) {
            dispatch({ type: ActionTypes.SET_ERROR, payload: { key: 'insights', value: error.message } });
        } finally {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'insights', value: false } });
        }
    }, [state.snippets, state.loading.insights]);

    const generatePodcast = useCallback(async () => {
        if (!state.snippets.length || state.loading.audio) return;
        dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'audio', value: true } });
        try {
            const text = state.snippets[0];
            const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(`Create a 2-3 minute podcast script based on this text: ${text}`);
            const script = result.response.text();

            const speechConfig = sdk.SpeechConfig.fromSubscription(
                process.env.NEXT_PUBLIC_AZURE_TTS_KEY,
                process.env.NEXT_PUBLIC_AZURE_TTS_REGION
            );
            const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

            const audioResult = await new Promise((resolve, reject) => {
                synthesizer.speakTextAsync(
                    script,
                    (res) => {
                        if (res.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                            resolve(res);
                        } else {
                            reject(new Error('TTS synthesis failed'));
                        }
                    },
                    (err) => reject(err)
                );
            });

            const audioBlob = new Blob([audioResult.audioData], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            dispatch({ type: ActionTypes.SET_AUDIO, payload: audioUrl });
        } catch (error) {
            dispatch({ type: ActionTypes.SET_ERROR, payload: { key: 'audio', value: error.message } });
        } finally {
            dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'audio', value: false } });
        }
    }, [state.snippets, state.loading.audio]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            Array.from(state.files.values()).forEach(fileData => {
                if (fileData.url && fileData.url.startsWith('blob:')) {
                    URL.revokeObjectURL(fileData.url);
                }
            });
            if (state.audioUrl && state.audioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(state.audioUrl);
            }
        };
    }, [state.files, state.audioUrl]);

    // Show loading state while PDF.js is initializing
    if (!isClient) {
        return <div>Loading PDF processor...</div>;
    }

    const contextValue = {
        ...state,
        pdfJsReady,
        actions: {
            addFiles,
            removeFile,
            setCurrentPdf,
            setSnippets,
            setInsights,
            setAudio,
            setJumpToPage,
            setLoading,
            setError,
            clearError,
            generateInsights,
            generatePodcast,
            extractHeadingsParallel
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