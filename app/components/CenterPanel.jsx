import React from 'react';
import './CenterPanel.css';

const CenterPanel = () => {
    return (
        <div className="center-panel">
            <div className="toolbar">
                {/* Optional toolbar/buttons */}
            </div>

            <div className="pdf-viewer">
                {/* This div keeps a 1:1.414 aspect ratio */}
            </div>
        </div>
    );
};

export default CenterPanel;
