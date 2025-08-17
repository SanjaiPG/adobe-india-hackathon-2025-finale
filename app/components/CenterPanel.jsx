"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAppState, useAppActions } from "./AppStateContext";

export default function CenterPanel() {
    /* --------------------------------------------------------------------- */
    /* ░░░  GLOBAL STATE  ░░░ */
    const { files, currentPdfId, loading, errors } = useAppState();
    const {
        setLoading,
        setError,
        clearError,
        setSnippets
    } = useAppActions();

    /* --------------------------------------------------------------------- */
    /* ░░░  REFS & STATE  ░░░ */
    const viewerDivRef = useRef(null);   // <div id="pdf-viewer">
    const adobeViewerRef = useRef(null);   // AdobeDC.View instance
    const scriptLoadedRef = useRef(false);  // PDF Embed SDK loaded?
    const previewReadyRef = useRef(null);   // Promise that resolves after previewFile
    const [clientId, setClientId] = useState(null);

    const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

    /* --------------------------------------------------------------------- */
    /* ░░░  HELPERS  ░░░ */

    /* Load Adobe PDF Embed SDK exactly once */
    const loadSdk = useCallback(() => new Promise((res, rej) => {
        if (scriptLoadedRef.current || window.AdobeDC) return res();
        const script = document.createElement("script");
        script.id = "adobe-dc-sdk";
        script.src = "https://documentservices.adobe.com/view-sdk/main.js";
        script.onload = () => { scriptLoadedRef.current = true; res(); };
        script.onerror = () => rej(new Error("Adobe PDF SDK failed to load"));
        document.head.appendChild(script);
    }), []);

    /* Fetch clientId from backend route */
    const fetchClientId = useCallback(async () => {
        if (clientId) return clientId;
        const r = await fetch("/api/config/adobe");
        if (!r.ok) throw new Error("Unable to fetch Adobe client ID");
        const { clientId: id } = await r.json();
        setClientId(id);
        return id;
    }, [clientId]);

    /* Create / re-create viewer and preview file */
    const initViewer = useCallback(async file => {
        setLoading("viewer", true); clearError("viewer");
        try {
            await loadSdk();                      // ① ensure SDK script
            const id = await fetchClientId();     // ② ensure clientId

            /* Destroy any previous viewer */
            if (adobeViewerRef.current) viewerDivRef.current.innerHTML = "";

            /* New viewer instance */
            const viewer = new window.AdobeDC.View({
                clientId: id,
                divId: "pdf-viewer-container"
            });
            adobeViewerRef.current = viewer;

            /* Preview-options (NO linearization) */
            const cfg = {
                embedMode: "SIZED_CONTAINER",
                defaultViewMode: "FIT_WIDTH",
                showPrintPDF: false,
                showDownloadPDF: false,
                showLeftHandPanel: false,
                showAnnotationTools: false
            };

            /* Build content object */
            let content;
            if (file.file) {
                /* Local File -> use arrayBuffer promise */
                content = {
                    promise: file.file.arrayBuffer(),
                    metaData: { fileName: file.name }
                };
            } else if (file.url) {
                content = {
                    location: { url: file.url },
                    metaData: { fileName: file.name }
                };
            } else {
                throw new Error("No file data supplied");
            }

            /* Preview the PDF */
            previewReadyRef.current =
                await viewer.previewFile({ content, metaData: content.metaData }, cfg);

            /* Register selection callback ONCE per preview */
            viewer.registerCallback(
                window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
                async ev => {
                    if (ev.type !== "PREVIEW_SELECTION_END") return;
                    const text = ev.data?.selectedText?.trim();
                    if (!text) return;
                    handleSelection(text);
                },
                {
                    enableFilePreviewEvents: true,
                    listenOn: [window.AdobeDC.View.Enum.FilePreviewEvents.PREVIEW_SELECTION_END]
                }
            );

            setLoading("viewer", false);
        } catch (e) {
            console.error(e);
            setError("viewer", e.message);
            setLoading("viewer", false);
        }
    }, [loadSdk, fetchClientId, setError, setLoading]);

    /* --------------------------------------------------------------------- */
    /* ░░░  TEXT-SELECTION HANDLER  ░░░ */
    const handleSelection = async text => {
        setLoading("snippets", true); clearError("snippets");
        try {
            if (USE_MOCK) {
                /* --- MOCK PAYLOAD --- */
                setSnippets([
                    { id: "1", heading: "Mock Section", snippet: text, page: 1, pdfId: currentPdfId }
                ]);
            } else {
                const r = await fetch("/api/semantic/related", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text, currentPdfId })
                });
                if (!r.ok) throw new Error("Backend error");
                const { snippets } = await r.json();
                setSnippets(snippets || []);
            }
        } catch (e) {
            setError("snippets", e.message);
        } finally {
            setLoading("snippets", false);
        }
    };

    /* --------------------------------------------------------------------- */
    /* ░░░  EFFECTS  ░░░ */
    /* Re-init when currentPdfId changes */
    useEffect(() => {
        if (!currentPdfId || !files.has(currentPdfId)) return;
        initViewer(files.get(currentPdfId));
    }, [currentPdfId, files, initViewer]);

    /* Cleanup on unmount */
    useEffect(() => () => {
        if (viewerDivRef.current) viewerDivRef.current.innerHTML = "";
        adobeViewerRef.current = null;
    }, []);

    /* --------------------------------------------------------------------- */
    /* ░░░  RENDER  ░░░ */
    return (
        <div className="center-panel">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="header">
                <h2 className="header-title">
                    {currentPdfId && files.has(currentPdfId)
                        ? files.get(currentPdfId).name
                        : "Select or upload a PDF"}
                </h2>
            </div>

            {/* ── Viewer / States ────────────────────────────────────── */}
            <div className="viewer-container">
                {loading.viewer && (
                    <Overlay error={false}>
                        <Spinner />
                        <p className="overlay-text">Loading PDF viewer…</p>
                    </Overlay>
                )}

                {errors.viewer && (
                    <Overlay error={true}>
                        <h3 className="error-title">Failed to load PDF</h3>
                        <p className="error-message">{errors.viewer}</p>
                        <button
                            className="retry-button"
                            onClick={() => {
                                clearError("viewer");
                                if (currentPdfId && files.has(currentPdfId))
                                    initViewer(files.get(currentPdfId));
                            }}
                        >
                            Retry
                        </button>
                    </Overlay>
                )}

                {!currentPdfId && !loading.viewer && !errors.viewer && (
                    <Overlay error={false}>
                        <p className="overlay-text">No PDF selected</p>
                    </Overlay>
                )}

                {/* Adobe viewer container */}
                <div
                    id="pdf-viewer-container"
                    ref={viewerDivRef}
                    className="pdf-viewer"
                />
            </div>
        </div>
    );
}

/* ───────────────────────────  Small Helpers  ─────────────────────────── */
function Overlay({ children, error }) {
    return (
        <div
            className={`overlay ${error ? "overlay-error" : "overlay-default"}`}
        >
            {children}
        </div>
    );
}

function Spinner() {
    return (
        <div className="spinner" />
    );
}