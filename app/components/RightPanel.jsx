"use client";

import React from 'react';
import { useAppState } from './AppStateContext';
import './RightPanel.css';

const RightPanel = () => {
    const { snippets } = useAppState();

    return (
        <div className="right-panel">
            <h3>Selected Text</h3>
            {snippets.length > 0 ? (
                <div className="selected-text">
                    {snippets.map((snippet, index) => (
                        <p key={index}>{snippet}</p>
                    ))}
                </div>
            ) : (
                <p>No text selected</p>
            )}
        </div>
    );
};

export default RightPanel;