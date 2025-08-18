// RightPanel.jsx (updated with fallback logic for headings)
"use client";

import React from 'react';
import { useAppState, useAppActions } from './AppStateContext';
import './RightPanel.css';

const RightPanel = () => {
    const {
        snippets,
        relevantSections,
        insights,
        audioUrl,
        loading,
        errors,
        currentPdfId,
        files
    } = useAppState();

    const {
        setCurrentPdf,
        setJumpToPage,
        generateInsights,
        generatePodcast,
        extractHeadingsParallel
    } = useAppActions();

    const currentOutline = currentPdfId ? files.get(currentPdfId)?.outline || [] : [];
    const allOutlines = Array.from(files.values()).map(fileData => ({
        id: fileData.id,
        name: fileData.name,
        outline: fileData.outline || [],
        geminiHeadings: fileData.geminiHeadings || []
    }));

    const handleSectionClick = (section) => {
        if (currentPdfId === section.pdfId) {
            setJumpToPage(section.page);
        } else {
            setCurrentPdf(section.pdfId);
            setJumpToPage(section.page);
        }
    };

    const handleHeadingClick = (pdfId, page) => {
        if (currentPdfId !== pdfId) {
            setCurrentPdf(pdfId);
        }
        setJumpToPage(page);
    };

    const handleRetryHeadingExtraction = () => {
        const filesArray = Array.from(files.values()).filter(f => f.file);
        if (filesArray.length > 0) {
            extractHeadingsParallel(filesArray);
        }
    };

    // Helper function to get headings for display (Gemini first, fallback to PDF.js)
    const getHeadingsForDisplay = (file) => {
        // If Gemini found headings, use those
        if (file.geminiHeadings && file.geminiHeadings.length > 0) {
            return {
                headings: file.geminiHeadings,
                source: 'AI-Detected',
                count: file.geminiHeadings.length
            };
        }

        // Otherwise, fallback to PDF.js outline
        if (file.outline && file.outline.length > 0) {
            return {
                headings: file.outline,
                source: 'Structure-Based',
                count: file.outline.length
            };
        }

        // No headings found
        return {
            headings: [],
            source: 'None',
            count: 0
        };
    };

    return (
        <div className="right-panel">
            {/* Selected Text Section */}
            <div className="section">
                <h3>Selected Text</h3>
                {snippets.length > 0 ? (
                    <div className="selected-text">
                        {snippets.map((snippet, index) => (
                            <div key={index} className="snippet">
                                <div className="snippet-text">{snippet}</div>
                                <div className="snippet-actions">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(snippet)}
                                        className="snippet-action-button"
                                        title="Copy to clipboard"
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">✏️</div>
                        <div className="empty-state-text">Select text in the PDF viewer</div>
                    </div>
                )}
            </div>

            {/* Relevant Sections */}
            <div className="section">
                <h3>Relevant Sections</h3>
                {loading.sections ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                        <p className="spinner-text">Finding relevant sections...</p>
                    </div>
                ) : errors.sections ? (
                    <p className="error">{errors.sections}</p>
                ) : relevantSections.length > 0 ? (
                    <ul className="relevant-sections">
                        {relevantSections.map((section, index) => (
                            <li
                                key={index}
                                onClick={() => handleSectionClick(section)}
                                className="section-item"
                            >
                                <div className="section-content">
                                    <div className="section-title">{section.title}</div>
                                    <div className="section-page">Page {section.page}</div>
                                </div>
                                <div className="section-arrow">→</div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <div className="empty-state-text">Select text to find relevant sections</div>
                    </div>
                )}
            </div>

            {/* Smart Headings Section - Shows AI-detected with fallback */}
            <div className="headings-section">
                <div className="section-header">
                    <h3>Document Headings</h3>
                    {errors.headings && (
                        <button
                            onClick={handleRetryHeadingExtraction}
                            className="retry-button"
                            title="Retry heading extraction"
                        >
                            🔄
                        </button>
                    )}
                </div>

                {loading.headings ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                        <p className="spinner-text">Analyzing PDFs with Gemini 2.5 Flash...</p>
                    </div>
                ) : errors.headings ? (
                    <div className="error-container">
                        <p className="error">{errors.headings}</p>
                        <button onClick={handleRetryHeadingExtraction} className="retry-button-large">
                            Retry Extraction
                        </button>
                    </div>
                ) : allOutlines.length > 0 ? (
                    <div className="headings-accordion">
                        {allOutlines.map((file) => {
                            const displayData = getHeadingsForDisplay(file);
                            return (
                                <div key={file.id} className="file-headings-group">
                                    <details open>
                                        <summary className="file-summary">
                                            <div className="file-info">
                                                <span className="file-name">{file.name}</span>
                                                <div className="file-meta">
                                                    <span className={`source-badge ${displayData.source === 'AI-Detected' ? 'ai' : 'structure'}`}>
                                                        {displayData.source}
                                                    </span>
                                                    <span className="heading-count">
                                                        {displayData.count} headings
                                                    </span>
                                                </div>
                                            </div>
                                        </summary>
                                        <div className="headings-list">
                                            {displayData.headings.length > 0 ? (
                                                displayData.headings.map((heading, index) => (
                                                    <div
                                                        key={index}
                                                        className={`heading-item ${heading.level.toLowerCase()} ${currentPdfId === file.id ? 'current-file' : ''
                                                            }`}
                                                        onClick={() => handleHeadingClick(file.id, heading.page)}
                                                    >
                                                        <div className="heading-level">{heading.level}</div>
                                                        <div className="heading-content">
                                                            <div className="heading-text">{heading.text}</div>
                                                            <div className="heading-page">Page {heading.page}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-headings">
                                                    <div className="no-headings-icon">📄</div>
                                                    <div className="no-headings-text">
                                                        No headings detected in this document
                                                    </div>
                                                    <button
                                                        onClick={handleRetryHeadingExtraction}
                                                        className="retry-single-button"
                                                    >
                                                        Retry Analysis
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📚</div>
                        <div className="empty-state-text">Upload PDFs to detect headings</div>
                    </div>
                )}
            </div>


            {/* Action Buttons */}
            <div className="action-buttons">
                <button
                    onClick={generateInsights}
                    disabled={loading.insights || !snippets.length}
                    className="action-button insights-button"
                >
                    {loading.insights ? (
                        <span className="button-content">
                            <div className="button-spinner"></div>
                            Generating...
                        </span>
                    ) : (
                        <span className="button-content">
                            💡 Generate Insights
                        </span>
                    )}
                </button>
                <button
                    onClick={generatePodcast}
                    disabled={loading.audio || !snippets.length}
                    className="action-button podcast-button"
                >
                    {loading.audio ? (
                        <span className="button-content">
                            <div className="button-spinner"></div>
                            Creating...
                        </span>
                    ) : (
                        <span className="button-content">
                            🎙️ Generate Podcast
                        </span>
                    )}
                </button>
            </div>

            {/* Insights Section */}
            <div className="section">
                <h3>Insights</h3>
                {loading.insights ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                        <p className="spinner-text">Generating insights...</p>
                    </div>
                ) : errors.insights ? (
                    <p className="error">{errors.insights}</p>
                ) : insights ? (
                    <div className="insights-content">
                        <div className="insights-text">{insights}</div>
                        <button
                            onClick={() => navigator.clipboard.writeText(insights)}
                            className="copy-button"
                            title="Copy insights"
                        >
                            📋 Copy
                        </button>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">💡</div>
                        <div className="empty-state-text">Select text and click "Generate Insights"</div>
                    </div>
                )}
            </div>

            {/* Podcast Section */}
            <div className="section">
                <h3>Podcast</h3>
                {loading.audio ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                        <p className="spinner-text">Generating podcast...</p>
                    </div>
                ) : errors.audio ? (
                    <p className="error">{errors.audio}</p>
                ) : audioUrl ? (
                    <div className="podcast-container">
                        <audio controls className="podcast-player" src={audioUrl}>
                            Your browser does not support the audio element.
                        </audio>
                        <div className="podcast-actions">
                            <button
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = audioUrl;
                                    a.download = 'podcast.wav';
                                    a.click();
                                }}
                                className="download-button"
                            >
                                💾 Download
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎙️</div>
                        <div className="empty-state-text">Select text and click "Generate Podcast"</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightPanel;
