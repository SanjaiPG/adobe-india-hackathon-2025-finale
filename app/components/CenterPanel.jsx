"use client";

import React, { useEffect, useRef } from 'react';
import { useAppState, useAppActions } from './AppStateContext';
import './CenterPanel.css';

const CenterPanel = () => {
    const { files, currentPdfId } = useAppState();
    const { setSnippets } = useAppActions();
    const viewerRef = useRef(null);
    const adobeDCViewRef = useRef(null);

    // Get current file data
    const currentFile = currentPdfId ? files.get(currentPdfId) : null;

    useEffect(() => {
        // Load Adobe DC View SDK if not already loaded
        const loadAdobeSDK = () => {
            return new Promise((resolve) => {
                if (window.AdobeDC) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
                script.onload = () => {
                    document.addEventListener('adobe_dc_view_sdk.ready', resolve);
                };
                document.head.appendChild(script);
            });
        };

        const displayPDF = async () => {
            if (!currentFile || !viewerRef.current) return;

            try {
                await loadAdobeSDK();

                // Clear previous viewer instance
                if (adobeDCViewRef.current) {
                    viewerRef.current.innerHTML = '';
                    adobeDCViewRef.current = null;
                }

                // Create new viewer div
                const viewerDiv = document.createElement('div');
                viewerDiv.id = `adobe-dc-view-${currentPdfId}`;
                viewerDiv.style.height = '100%';
                viewerDiv.style.width = '100%';
                viewerRef.current.appendChild(viewerDiv);

                // Convert file to base64 or blob URL
                const fileUrl = URL.createObjectURL(currentFile.file);

                // Initialize Adobe DC View
                adobeDCViewRef.current = new window.AdobeDC.View({
                    clientId: process.env.NEXT_PUBLIC_PDF_EMBED_API_KEY, // Replace with your actual client ID
                    divId: viewerDiv.id
                });

                // Preview the file
                const previewFilePromise = adobeDCViewRef.current.previewFile({
                    content: { location: { url: fileUrl } },
                    metaData: { fileName: currentFile.name }
                }, {
                    embedMode: "SIZED_CONTAINER",
                    showDownloadPDF: true,
                    showPrintPDF: true,
                    showLeftHandPanel: true,
                    showAnnotationTools: false
                });

                // Register callback for text selection
                adobeDCViewRef.current.registerCallback(
                    window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
                    function(event) {
                        if (event.type === "PREVIEW_SELECTION_END") {
                            previewFilePromise.then(adobeViewer => {
                                adobeViewer.getAPIs().then(apis => {
                                    apis.getSelectedContent()
                                        .then(result => {
                                            if (result.type === 'text' && result.data) {
                                                setSnippets([result.data]); // Set the selected text as snippet
                                            }
                                        })
                                        .catch(error => console.error('Error getting selected content:', error));
                                });
                            });
                        }
                    }, { enableFilePreviewEvents: true }
                );

            } catch (error) {
                console.error('Error displaying PDF:', error);
            }
        };

        displayPDF();

        // Cleanup function
        return () => {
            if (adobeDCViewRef.current && viewerRef.current) {
                viewerRef.current.innerHTML = '';
                adobeDCViewRef.current = null;
            }
        };
    }, [currentFile, currentPdfId, setSnippets]);

    return (
        <div className="center-panel">
            <div className="toolbar">
                {currentFile && (
                    <div className="toolbar-content">
                        <span className="current-file-name">{currentFile.name}</span>
                        <div className="toolbar-actions">
                            {/* Add any toolbar buttons here if needed */}
                        </div>
                    </div>
                )}
            </div>

            <div className="pdf-viewer">
                {currentFile ? (
                    <div ref={viewerRef} className="adobe-viewer-container" />
                ) : (
                    <div className="no-pdf-message">
                        <div className="no-pdf-icon">
                            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="no-pdf-title">No document selected</h3>
                        <p className="no-pdf-text">
                            Upload a PDF file and click on it to view here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CenterPanel;