"use client";

import React, { useRef, useState } from 'react';
import { useAppState, useAppActions } from './AppStateContext';
import './LeftPanel.css';

const LeftPanel = () => {
    const { files, currentPdfId, loading, errors } = useAppState();
    const { addFiles, removeFile, setCurrentPdf, setLoading, setError, clearError } = useAppActions();

    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    // Handle file selection from input
    const handleFileSelect = (event) => {
        const selectedFiles = event.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            handleFiles(selectedFiles);
        }
        // Reset input value to allow selecting same file again
        event.target.value = '';
    };

    // Handle drag and drop
    const handleDragOver = (event) => {
        event.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragOver(false);

        const droppedFiles = event.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            handleFiles(droppedFiles);
        }
    };

    // Process selected files
    const handleFiles = (fileList) => {
        setLoading('files', true);
        clearError('files');

        try {
            // Filter for PDF files only
            const pdfFiles = Array.from(fileList).filter(file =>
                file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            );

            if (pdfFiles.length === 0) {
                setError('files', 'Please select PDF files only');
                setLoading('files', false);
                return;
            }

            if (pdfFiles.length !== fileList.length) {
                setError('files', `Only ${pdfFiles.length} PDF files were added out of ${fileList.length} selected`);
            }

            // Add files to state
            addFiles(pdfFiles);
            setLoading('files', false);

        } catch (error) {
            console.error('Error processing files:', error);
            setError('files', 'Failed to process selected files');
            setLoading('files', false);
        }
    };

    // Handle file click to load in viewer
    const handleFileClick = (fileId) => {
        if (fileId !== currentPdfId) {
            setCurrentPdf(fileId);
        }
    };

    // Handle file removal
    const handleRemoveFile = (event, fileId) => {
        event.stopPropagation(); // Prevent file selection

        if (window.confirm('Are you sure you want to remove this file from the library?')) {
            removeFile(fileId);
        }
    };

    // Clear all files
    const handleClearAll = () => {
        if (files.size === 0) return;

        if (window.confirm(`Remove all ${files.size} files from the library?`)) {
            Array.from(files.keys()).forEach(fileId => {
                removeFile(fileId);
            });
        }
    };

    const filesArray = Array.from(files.values());

    return (
        <div className="left-panel">
            {/* Header */}
            <div className="header">
                <div className="header-content">
                    <h2 className="header-title">Document Library</h2>
                    <span className="file-count">{files.size}</span>
                </div>
            </div>

            {/* Upload Area */}
            <div className="upload-area">
                <div
                    className={`upload-container ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="application/pdf,.pdf"
                        onChange={handleFileSelect}
                        className="upload-input"
                        disabled={loading.files}
                    />

                    <div className="upload-content">
                        {loading.files ? (
                            <div className="spinner">
                                <div className="spinner-circle"></div>
                                <p className="spinner-text">Processing files...</p>
                            </div>
                        ) : (
                            <>
                                <div className="upload-icon">
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="upload-text">
                                        <span className="highlight">Click to upload</span> or drag & drop
                                    </p>
                                    <p className="upload-subtext">PDF files only</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Error display */}
                {errors.files && (
                    <div className="error-message">{errors.files}</div>
                )}

                {/* Bulk actions */}
                {files.size > 0 && (
                    <div className="bulk-actions">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bulk-button"
                            disabled={loading.files}
                        >
                            Add More
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="bulk-button clear-button"
                            disabled={loading.files}
                        >
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* File List */}
            <div className="file-list">
                {files.size === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="empty-text">No documents yet</p>
                        <p className="empty-subtext">Upload PDFs to get started</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filesArray.map((fileData) => (
                            <div
                                key={fileData.id}
                                onClick={() => handleFileClick(fileData.id)}
                                className={`file-item ${currentPdfId === fileData.id ? 'active' : ''}`}
                            >
                                <div className="file-content">
                                    {/* PDF Icon */}
                                    <div className="file-icon-container">
                                        <div className={`file-icon ${currentPdfId === fileData.id ? 'active' : 'inactive'}`}>
                                            <svg className="file-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* File Info */}
                                    <div className="file-info">
                                        <p className={`file-name ${currentPdfId === fileData.id ? 'active' : ''}`}>
                                            {fileData.name}
                                        </p>

                                        <div className="file-meta">
                                            {fileData.file && (
                                                <span className="file-size">{(fileData.file.size / 1024 / 1024).toFixed(1)} MB</span>
                                            )}
                                            {currentPdfId === fileData.id && (
                                                <span className="current-badge">Current</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => handleRemoveFile(e, fileData.id)}
                                        className="remove-button"
                                        title="Remove file"
                                    >
                                        <svg className="remove-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {files.size > 0 && (
                <div className="footer">
                    <p className="footer-text">
                        Click a document to view • Drag files to upload
                    </p>
                </div>
            )}
        </div>
    );
};

export default LeftPanel;
