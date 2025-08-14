"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function PDFAnalyzer() {
    const [selectedPDF, setSelectedPDF] = useState({
        name: "Bodea Brochure.pdf",
        url: "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Bodea%20Brochure.pdf"
    });

    useEffect(() => {
        const interval = setInterval(() => {
            if (window.AdobeDC) {
                clearInterval(interval);
                const adobeClientId = process.env.NEXT_PUBLIC_PDF_EMBED_API_KEY;
                const adobeDCView = new window.AdobeDC.View({
                    clientId: adobeClientId,
                    divId: "pdf-preview",
                });

                adobeDCView.previewFile(
                    {
                        content: { location: { url: selectedPDF.url } },
                        metaData: { fileName: selectedPDF.name },
                    },
                    { embedMode: "SIZED_CONTAINER" }
                );
            }
        }, 200);
        return () => clearInterval(interval);
    }, [selectedPDF]);

    const pdfFiles = [
        { name: "Bodea Brochure.pdf", url: "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Bodea%20Brochure.pdf" },
        { name: "Annual Report.pdf", url: "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Adobe%20Annual%20Report.pdf" },
        { name: "Marketing Plan.pdf", url: "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Marketing%20Brochure.pdf" }
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
            <Script src="https://acrobatservices.adobe.com/view-sdk/viewer.js" strategy="beforeInteractive" />

            {/* LEFT COLUMN - PDF Titles */}
            <div style={{ flex: "0 0 20%", borderRight: "1px solid #ddd", padding: "1rem" }}>
                <h2 style={{ marginBottom: "1rem" }}>PDF's</h2>
                {pdfFiles.map((pdf, idx) => (
                    <div
                        key={idx}
                        style={{
                            padding: "0.5rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                            backgroundColor: selectedPDF.name === pdf.name ? "#f5f5f5" : "transparent",
                            marginBottom: "0.5rem"
                        }}
                        onClick={() => setSelectedPDF(pdf)}
                    >
                        <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{pdf.name.split(".")[0]}</div>
                        <div style={{ fontSize: "0.8rem", color: "#555" }}>{pdf.name}</div>
                    </div>
                ))}
            </div>

            {/* CENTER COLUMN - Search, Upload, Thumbnails, PDF Viewer */}
            <div style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column" }}>
                {/* Search + Upload Bar */}
                <div style={{ display: "flex", marginBottom: "1rem", gap: "0.5rem" }}>
                    <input
                        type="text"
                        placeholder="Search PDFs"
                        style={{
                            flex: 1,
                            padding: "0.5rem",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            background: "#ffecec"
                        }}
                    />
                    
                </div>

                {/* Thumbnails */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    {pdfFiles.map((pdf, idx) => (
                        <div
                            key={idx}
                            onClick={() => setSelectedPDF(pdf)}
                            style={{
                                width: "80px",
                                height: "100px",
                                background: "#f5f5f5",
                                borderRadius: "6px",
                                border: selectedPDF.name === pdf.name ? "2px solid red" : "1px solid #ccc",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                textAlign: "center"
                            }}
                        >
                            📄
                        </div>
                    ))}
                </div>

                {/* PDF Preview */}
                <div
                    id="pdf-preview"
                    style={{
                        flex: 1,
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        overflow: "hidden"
                    }}
                />
            </div>

            {/* RIGHT COLUMN - AI Insights */}
            <div style={{
                flex: "0 0 25%",
                borderLeft: "1px solid #ddd",
                padding: "1rem",
                display: "flex",
                flexDirection: "column"
            }}>
                <button
                style={{
                    background: "red",
                    // alignItems: "center",
                    marginLeft:350,
                    width: 70,
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.5rem 1rem",
                    cursor: "pointer"
                }}
            >
                        Upload
                    </button>
                <h3 style={{ marginBottom: "0.5rem" }}>AI Insights</h3>
                <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                    AI-generated insights based on selected text
                </p>
                
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#fdecec",
                    borderRadius: "8px",
                    padding: "0.8rem"
                }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        background: "#ddd",
                        borderRadius: "4px",
                        marginRight: "0.8rem"
                    }} />
                    <div>
                        <div style={{ fontWeight: "bold" }}>Podcast Episode Title</div>
                        <div style={{ fontSize: "0.8rem", color: "#555" }}>Podcast Name</div>
                    </div>
                    <button style={{
                        marginLeft: "auto",
                        background: "red",
                        border: "none",
                        color: "white",
                        borderRadius: "50%",
                        width: "35px",
                        height: "35px",
                        cursor: "pointer"
                    }}>
                        ▶
                    </button>
                </div>
            </div>
        </div>
    );
}
