import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { supabase } from "../supabaseclient";
import "./checkurl.css";

const CheckURL = ({ user }) => {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [urlId, setUrlId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    if (!url.trim()) {
      alert("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("http://127.0.0.1:8000/check-url/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          browser: "firefox",
          user_id: String(user.id),
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch results");

      const data = await response.json();
      const timestamp = new Date().toLocaleString();
      setUrlId(data.url_id || null);

      // Process issues from the API response
      const seoIssues = data.seo_issues || [];
      const uiuxIssues = data.uiux_issues || [];

      // Fetch issue details for all issues
      const fetchIssueDetails = async (issueIds) => {
        if (!issueIds || issueIds.length === 0) return [];
        
        const { data: issuesData, error } = await supabase
          .from("tbl_issuepolicy")
          .select("*")
          .in("issue_id", issueIds);

        if (error) {
          console.error("Error fetching issues:", error);
          return [];
        }
        return issuesData || [];
      };

      const [seoDetails, uiuxDetails] = await Promise.all([
        fetchIssueDetails(seoIssues),
        fetchIssueDetails(uiuxIssues)
      ]);

      const formattedResult = {
        id: results.length + 1,
        url: data.url,
        timestamp,
        seoIssues: seoDetails,
        uiuxIssues: uiuxDetails
      };

      setResults([formattedResult, ...results]);
    } catch (error) {
      console.error("Error checking URL:", error);
      setErrorMsg("Something went wrong while checking the URL. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ... (keep all the imports and component setup code the same until downloadReport function)

const downloadReport = async (result, type = "pdf") => {
  if (type === "pdf") {
    const doc = new jsPDF();
    let y = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // Add title
    doc.setFontSize(16);
    doc.text("Website Audit Report", margin, y);
    y += 10;
    
    // Add URL and timestamp
    doc.setFontSize(12);
    doc.text(`URL: ${result.url}`, margin, y);
    y += 10;
    doc.text(`Checked On: ${result.timestamp}`, margin, y);
    y += 15;

    // Helper function to add text with page breaks
    const addTextWithPageBreak = (text, x, y, maxWidth) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      for (let i = 0; i < lines.length; i++) {
        if (y >= pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(lines[i], x, y);
        y += 7;
      }
      return y;
    };

    // SEO Issues Section
    doc.setFontSize(14);
    y = addTextWithPageBreak("SEO Issues", margin, y, 180);
    y += 5;
    
    if (result.seoIssues.length > 0) {
      for (const [index, issue] of result.seoIssues.entries()) {
        doc.setFont("helvetica", "bold");
        y = addTextWithPageBreak(`${index + 1}. ${issue.issue_name}`, margin, y, 180);
        doc.setFont("helvetica", "normal");
        y = addTextWithPageBreak(`Description: ${issue.description || 'N/A'}`, margin + 5, y, 180);
        // y = addTextWithPageBreak(`Priority: ${issue.priority || 'N/A'}`, margin + 5, y, 180);
        y = addTextWithPageBreak(`Severity: ${issue.severity || 'N/A'}`, margin + 5, y, 180);
        y = addTextWithPageBreak(`Recommendation: ${issue.recommendation}`, margin + 5, y, 180);
        y += 10;
      }
    } else {
      y = addTextWithPageBreak("No SEO issues found.", margin, y, 180);
      }

    // UI/UX Issues Section
    doc.setFontSize(14);
    y += 10;
    y = addTextWithPageBreak("UI/UX Issues", margin, y, 180);
    y += 5;
    
    if (result.uiuxIssues.length > 0) {
      for (const [index, issue] of result.uiuxIssues.entries()) {
        doc.setFont("helvetica", "bold");
        y = addTextWithPageBreak(`${index + 1}. ${issue.issue_name}`, margin, y, 180);
        doc.setFont("helvetica", "normal");
        y = addTextWithPageBreak(`Description: ${issue.description || 'N/A'}`, margin + 5, y, 180);
        // y = addTextWithPageBreak(`Priority: ${issue.priority || 'N/A'}`, margin + 5, y, 180);
        y = addTextWithPageBreak(`Severity: ${issue.severity || 'N/A'}`, margin + 5, y, 180);
        y = addTextWithPageBreak(`Recommendation: ${issue.recommendation}`, margin + 5, y, 180);
        y += 10;
      }
    } else {
      y = addTextWithPageBreak("No UI/UX issues found.", margin, y, 180);
    }

    doc.save("website_audit_report.pdf");
  } else {
    // DOCX Formatting
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Website Audit Report", bold: true, size: 28 })],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `URL: ${result.url}`, size: 22 })],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `Checked On: ${result.timestamp}`, size: 22 })],
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [new TextRun({ text: "SEO Issues", bold: true, size: 24 })],
            spacing: { after: 200 }
          }),
          ...(result.seoIssues.length > 0 ? 
            result.seoIssues.flatMap((issue, i) => [
              new Paragraph({
                children: [new TextRun({ text: `${i + 1}. ${issue.issue_name}`, bold: true })],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [new TextRun(`Description: ${issue.description || 'N/A'}`)],
                spacing: { after: 100 }
              }),
              // new Paragraph({
              //   children: [new TextRun(`Priority: ${issue.priority || 'N/A'}`)],
              //   spacing: { after: 100 }
              // }),
              new Paragraph({
                children: [new TextRun(`Severity: ${issue.severity || 'N/A'}`)],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [new TextRun(`Recommendation: ${issue.recommendation}`)],
                spacing: { after: 200 }
              })
            ]) : [
              new Paragraph({
                children: [new TextRun("No SEO issues found.")],
                spacing: { after: 200 }
              })
            ]
          ),
          new Paragraph({
            children: [new TextRun({ text: "UI/UX Issues", bold: true, size: 24 })],
            spacing: { after: 200 }
          }),
          ...(result.uiuxIssues.length > 0 ? 
            result.uiuxIssues.flatMap((issue, i) => [
              new Paragraph({
                children: [new TextRun({ text: `${i + 1}. ${issue.issue_name}`, bold: true })],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [new TextRun(`Description: ${issue.description || 'N/A'}`)],
                spacing: { after: 100 }
              }),
              // new Paragraph({
              //   children: [new TextRun(`Priority: ${issue.priority || 'N/A'}`)],
              //   spacing: { after: 100 }
              // }),
              new Paragraph({
                children: [new TextRun(`Severity: ${issue.severity || 'N/A'}`)],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [new TextRun(`Recommendation: ${issue.recommendation}`)],
                spacing: { after: 200 }
              })
            ]) : [
              new Paragraph({
                children: [new TextRun("No UI/UX issues found.")],
                spacing: { after: 200 }
              })
            ]
          ),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "website_audit_report.docx");
  }

  if (urlId) {
    await fetch("http://127.0.0.1:8000/log-report/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: String(user.id),
        url_id: urlId,
      }),
    });
  }
};

// ... (keep the rest of the component code the same)

  const renderIssues = (issues) => {
    if (issues.length === 0) {
      return <li>No issues found.</li>;
    }
    
    return issues.map((issue, index) => (
      <li key={index}>
        <strong>{index + 1}. {issue.issue_name}</strong><br />
        <strong>Description:</strong> {issue.description || 'N/A'}<br />
        {/* <strong>Priority:</strong> {issue.priority || 'N/A'}<br /> */}
        <strong>Severity:</strong> {issue.severity || 'N/A'}<br />
        <strong>Recommendation:</strong> {issue.recommendation}
      </li>
    ));
  };

  return (
    <div className="checkurl-wrapper">
      <div className="checkurl-left">
        <div className="url-card">
          <h3>Check a URL</h3>
          <input
            type="text"
            placeholder="Enter URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={handleSubmit}>Submit</button>
          {errorMsg && <p className="error-message">{errorMsg}</p>}
        </div>

        <div className="results-section">
          {loading ? (
            <div className="skeleton-loader"></div>
          ) : (
            results.map((result) => (
              <div className="result-card" key={result.id}>
                <h2>Website Audit Report</h2>
                <p><strong>URL:</strong> {result.url}</p>
                <p><strong>Checked On:</strong> {result.timestamp}</p>
                
                <h3>SEO Issues</h3>
                <ul>
                  {renderIssues(result.seoIssues)}
                </ul>
                
                <h3>UI/UX Issues</h3>
                <ul>
                  {renderIssues(result.uiuxIssues)}
                </ul>
                
                <div className="generate-btn-group">
                  <button className="generate-btn" onClick={() => downloadReport(result, "pdf")}>Download PDF</button>
                  <button className="generate-btn" onClick={() => downloadReport(result, "docx")}>Download DOCX</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckURL;