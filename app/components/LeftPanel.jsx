import React from 'react';
import './LeftPanel.css';

const LeftPanel = () => {
    return (
        <div className="left-panel">
            <h3 className="left-title">PDF's</h3>

            {/* To make this button center */}
            <div className="top-button-container">
                <button className="top-button">Upload PDF</button>
            </div>

            {/* If not center use this alone*/}
            {/* <button class="top-button">Upload PDF</button> */}

            <div className="pdf-list">
            </div>

            <input
                type="text"
                className="search-bar"
                placeholder="Search PDFs..."
            />
        </div>
    );
};

export default LeftPanel;
