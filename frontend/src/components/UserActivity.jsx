import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseclient";
import "./UserActivity.css";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

const UserActivity = () => {
  const [urls, setUrls] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState([]);
  const [reportType, setReportType] = useState("PDF");
  const [currentPageURLs, setCurrentPageURLs] = useState(1);
  const [currentPageLogs, setCurrentPageLogs] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;
  const userId = supabase.auth.getUser().then(({ data }) => data?.user?.id);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: urlData } = await supabase
        .from("tbl_crawledurls")
        .select("*")
        .eq("user_id", await userId)
        .order("submitted_time", { ascending: false });
    
      const { data: logData } = await supabase
        .from("tbl_log")
        .select(`
          *,
          tbl_crawledurls (url)
        `)
        .eq("user_id", await userId)
        .order("timestamp", { ascending: false });
    
      setUrls(urlData || []);
      setLogs(logData || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (url_id) => {
    setSelectedUrls((prev) =>
      prev.includes(url_id) ? prev.filter((id) => id !== url_id) : [...prev, url_id]
    );
  };

  const handleGenerateReport = async () => {
    if (selectedUrls.length === 0) {
      alert("Select at least one URL.");
      return;
    }
  
    for (const urlId of selectedUrls) {
      const urlItem = urls.find((u) => u.url_id === urlId);
  
      // Fetch SEO and UI/UX issue IDs
      const { data: seoIssues = [] } = await supabase
        .from("tbl_seoissues")
        .select("issue_id")
        .eq("url_id", urlId);
  
      const { data: uiuxIssues = [] } = await supabase
        .from("tbl_uiuxissues")
        .select("issue_id")
        .eq("url_id", urlId);
  
      const issueIds = [...seoIssues, ...uiuxIssues].map(i => i.issue_id);
  
      const { data: issueDetails = [] } = await supabase
        .from("tbl_issuepolicy")
        .select("*")
        .in("issue_id", issueIds);
  
      if (reportType === "PDF") {
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
        doc.text(`URL: ${urlItem.url}`, margin, y);
        y += 10;
        doc.text(`Checked On: ${new Date(urlItem.submitted_time).toLocaleString()}`, margin, y);
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
        
        if (seoIssues.length > 0) {
          for (const [index, issue] of seoIssues.entries()) {
            const detail = issueDetails.find(i => i.issue_id === issue.issue_id);
            if (detail) {
              doc.setFont("helvetica", "bold");
              y = addTextWithPageBreak(`${index + 1}. ${detail.issue_name}`, margin, y, 180);
              doc.setFont("helvetica", "normal");
              y = addTextWithPageBreak(`Description: ${detail.description || 'N/A'}`, margin + 5, y, 180);
              y = addTextWithPageBreak(`Severity: ${detail.severity || 'N/A'}`, margin + 5, y, 180);
              y = addTextWithPageBreak(`Recommendation: ${detail.recommendation}`, margin + 5, y, 180);
              y += 10;
            }
          }
        } else {
          y = addTextWithPageBreak("No SEO issues found.", margin, y, 180);
        }

        // UI/UX Issues Section
        doc.setFontSize(14);
        y += 10;
        y = addTextWithPageBreak("UI/UX Issues", margin, y, 180);
        y += 5;
        
        if (uiuxIssues.length > 0) {
          for (const [index, issue] of uiuxIssues.entries()) {
            const detail = issueDetails.find(i => i.issue_id === issue.issue_id);
            if (detail) {
              doc.setFont("helvetica", "bold");
              y = addTextWithPageBreak(`${index + 1}. ${detail.issue_name}`, margin, y, 180);
              doc.setFont("helvetica", "normal");
              y = addTextWithPageBreak(`Description: ${detail.description || 'N/A'}`, margin + 5, y, 180);
              y = addTextWithPageBreak(`Severity: ${detail.severity || 'N/A'}`, margin + 5, y, 180);
              y = addTextWithPageBreak(`Recommendation: ${detail.recommendation}`, margin + 5, y, 180);
              y += 10;
            }
          }
        } else {
          y = addTextWithPageBreak("No UI/UX issues found.", margin, y, 180);
        }

        doc.save(`Report_${urlItem.url_id}.pdf`);
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
                children: [new TextRun({ text: `URL: ${urlItem.url}`, size: 22 })],
                spacing: { after: 200 }
              }),
              new Paragraph({
                children: [new TextRun({ text: `Checked On: ${new Date(urlItem.submitted_time).toLocaleString()}`, size: 22 })],
                spacing: { after: 400 }
              }),
              new Paragraph({
                children: [new TextRun({ text: "SEO Issues", bold: true, size: 24 })],
                spacing: { after: 200 }
              }),
              ...(seoIssues.length > 0 ? 
                seoIssues.flatMap((issue, i) => {
                  const detail = issueDetails.find(d => d.issue_id === issue.issue_id);
                  return detail ? [
                    new Paragraph({
                      children: [new TextRun({ text: `${i + 1}. ${detail.issue_name}`, bold: true })],
                      spacing: { after: 100 }
                    }),
                    new Paragraph({
                      children: [new TextRun(`Description: ${detail.description || 'N/A'}`)],
                      spacing: { after: 100 }
                    }),
                    new Paragraph({
                      children: [new TextRun(`Severity: ${detail.severity || 'N/A'}`)],
                      spacing: { after: 100 }
                    }),
                    new Paragraph({
                      children: [new TextRun(`Recommendation: ${detail.recommendation}`)],
                      spacing: { after: 200 }
                    })
                  ] : [];
                }) : [
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
              ...(uiuxIssues.length > 0 ? 
                uiuxIssues.flatMap((issue, i) => {
                  const detail = issueDetails.find(d => d.issue_id === issue.issue_id);
                  return detail ? [
                    new Paragraph({
                      children: [new TextRun({ text: `${i + 1}. ${detail.issue_name}`, bold: true })],
                      spacing: { after: 100 }
                    }),
                    new Paragraph({
                      children: [new TextRun(`Description: ${detail.description || 'N/A'}`)],
                      spacing: { after: 100 }
                    }),
                    new Paragraph({
                      children: [new TextRun(`Severity: ${detail.severity || 'N/A'}`)],
                      spacing: { after: 100 }
                    }),
                    new Paragraph({
                      children: [new TextRun(`Recommendation: ${detail.recommendation}`)],
                      spacing: { after: 200 }
                    })
                  ] : [];
                }) : [
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
        saveAs(blob, `Report_${urlItem.url_id}.docx`);
      }
      const servertime=new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata' 
      });
      // Insert log
      await supabase.from("tbl_log").insert({
        user_id: await userId,
        url_id: urlItem.url_id,
        action: "Report Generated",
        timestamp: servertime,
      });
    }
  
    setSelectedUrls([]);
  };

  const handleExportCSV = () => {
    const rows = [["S.No", "URL", "Action", "Timestamp"]];
  
    logs.forEach((log, index) => {
      const url = log.tbl_crawledurls?.url || "N/A";
      const formattedTime = `"${new Date(log.timestamp).toLocaleString()}"`;
      rows.push([index + 1, url, log.action, formattedTime]);
    });
  
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = "activity_logs.csv";
    a.click();
  };

  const paginatedURLs = urls.slice(
    (currentPageURLs - 1) * itemsPerPage,
    currentPageURLs * itemsPerPage
  );
  const paginatedLogs = logs.slice(
    (currentPageLogs - 1) * itemsPerPage,
    currentPageLogs * itemsPerPage
  );

  // Pagination controls for URLs
  const renderURLPagination = () => {
    const totalPages = Math.ceil(urls.length / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button 
          onClick={() => setCurrentPageURLs(prev => Math.max(prev - 1, 1))}
          disabled={currentPageURLs === 1}
        >
          &laquo;
        </button>
        {currentPageURLs > 1 && (
          <button onClick={() => setCurrentPageURLs(1)}>1</button>
        )}
        {currentPageURLs > 2 && <span>...</span>}
        <button className="active-page">{currentPageURLs}</button>
        {currentPageURLs < totalPages - 1 && <span>...</span>}
        {currentPageURLs < totalPages && (
          <button onClick={() => setCurrentPageURLs(totalPages)}>
            {totalPages}
          </button>
        )}
        <button 
          onClick={() => setCurrentPageURLs(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPageURLs === totalPages}
        >
          &raquo;
        </button>
      </div>
    );
  };

  // Pagination controls for Logs
  const renderLogPagination = () => {
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button 
          onClick={() => setCurrentPageLogs(prev => Math.max(prev - 1, 1))}
          disabled={currentPageLogs === 1}
        >
          &laquo;
        </button>
        {currentPageLogs > 1 && (
          <button onClick={() => setCurrentPageLogs(1)}>1</button>
        )}
        {currentPageLogs > 2 && <span>...</span>}
        <button className="active-page">{currentPageLogs}</button>
        {currentPageLogs < totalPages - 1 && <span>...</span>}
        {currentPageLogs < totalPages && (
          <button onClick={() => setCurrentPageLogs(totalPages)}>
            {totalPages}
          </button>
        )}
        <button 
          onClick={() => setCurrentPageLogs(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPageLogs === totalPages}
        >
          &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="user-activity-container">
      {loading ? (
        <div className="loading-animation">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <h2>Activity History</h2>

          {/* Crawled URLs Section */}
          <section className="section">
            <h3>Crawled URLs</h3>
            <select className="select-doc" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="PDF">PDF</option>
              <option value="DOC">DOC</option>
            </select>
            <button className="button-activity" onClick={handleGenerateReport}>Generate Report</button>

            <table className="table-activity">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Sl No</th>
                  <th>URL</th>
                  <th>Checked Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedURLs.map((item, idx) => (
                  <tr key={`url-${item.url_id || idx}`}>
                    <td>
                      {item.status === "completed" ? (
                        <input
                          type="checkbox"
                          checked={selectedUrls.includes(item.url_id)}
                          onChange={() => handleSelect(item.url_id)}
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>{(currentPageURLs - 1) * itemsPerPage + idx + 1}</td>
                    <td>{item.url}</td>
                    <td>{new Date(item.submitted_time).toLocaleString()}</td>
                    <td><span className={`status-badge ${item.status}`}>
                      
                      {item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderURLPagination()}
          </section>

          {/* Activity Logs Section */}
          <section className="section">
            <h3>Activity Logs</h3>
            <button className="button-activitylog" onClick={handleExportCSV}>Export CSV</button>
            <table className="table-activity">
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>URL</th>
                  <th>Action</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log, idx) => (
                  <tr key={`log-${log.id || idx}-${new Date(log.timestamp).getTime()}`}>
                    <td>{(currentPageLogs - 1) * itemsPerPage + idx + 1}</td>
                    <td>{log.tbl_crawledurls?.url || "N/A"}</td>
                    <td>{log.action}</td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderLogPagination()}
          </section>
        </>
      )}
    </div>
  );
};

export default UserActivity;