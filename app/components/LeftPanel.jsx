import React from 'react';
import './LeftPanel.css';

const LeftPanel = () => {
    return (
        <div className="left-panel">
            <h3 className="left-title">PDF's</h3>
            <button className="top-button">Button</button>

            <div className="pdf-list">
                {/* Placeholder for PDF items */}
            </div>

            <button className="bottom-button">Upload PDF</button>
        </div>
    );
};

export default LeftPanel;
