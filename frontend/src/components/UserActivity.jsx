import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseclient";
import "./UserActivity.css";
import jsPDF from "jspdf";
import "jspdf-autotable";

const UserActivity = () => {
  const [urls, setUrls] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState([]);
  const [reportType, setReportType] = useState("PDF");
  const [currentPageURLs, setCurrentPageURLs] = useState(1);
  const [currentPageLogs, setCurrentPageLogs] = useState(1);
  const itemsPerPage = 10;
  const userId = supabase.auth.getUser().then(({ data }) => data?.user?.id);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: urlData } = await supabase
      .from("tbl_crawledurls")
      .select("*")
      .eq("user_id", await userId);
  
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
  
        // Helper function to add text with page breaks
        const addText = (text, x, y, font = "normal", size = 12, indent = 0) => {
          doc.setFontSize(size);
          doc.setFont("helvetica", font);
          const lines = doc.splitTextToSize(text, 180 - indent);
          
          for (let i = 0; i < lines.length; i++) {
            if (y >= pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(lines[i], x + indent, y);
            y += 7;
          }
          return y;
        };
  
        // Add header
        y = addText("Site Intel Audit Report", margin, y, "bold", 16);
        y = addText(`URL: ${urlItem.url}`, margin, y);
        y = addText(`Checked At: ${new Date(urlItem.submitted_time).toLocaleString()}`, margin, y);
        y += 10;
  
        // SEO Issues
        y = addText("SEO Issues", margin, y, "bold", 14);
        y += 5;
  
        if (seoIssues.length === 0) {
          y = addText("- No issues found.", margin, y);
        } else {
          seoIssues.forEach((issue, index) => {
            const detail = issueDetails.find(i => i.issue_id === issue.issue_id);
            if (detail) {
              y = addText(`${index + 1}. ${detail.issue_name}`, margin, y, "bold");
              y = addText(`Description: ${detail.description}`, margin, y, "normal", 12, 5);
              y = addText(`Severity: ${detail.severity}`, margin, y, "normal", 12, 5);
              y = addText(`Recommendation: ${detail.recommendation}`, margin, y, "normal", 12, 5);
              y += 5;
            }
          });
        }
  
        // UI/UX Issues
        y += 10;
        y = addText("UI/UX Issues", margin, y, "bold", 14);
        y += 5;
  
        if (uiuxIssues.length === 0) {
          y = addText("- No issues found.", margin, y);
        } else {
          uiuxIssues.forEach((issue, index) => {
            const detail = issueDetails.find(i => i.issue_id === issue.issue_id);
            if (detail) {
              y = addText(`${index + 1}. ${detail.issue_name}`, margin, y, "bold");
              y = addText(`Description: ${detail.description}`, margin, y, "normal", 12, 5);
              y = addText(`Severity: ${detail.severity}`, margin, y, "normal", 12, 5);
              y = addText(`Recommendation: ${detail.recommendation}`, margin, y, "normal", 12, 5);
              y += 5;
            }
          });
        }
  
        doc.save(`Report_${urlItem.url_id}.pdf`);
      } else {
        // Improved DOC generation with HTML formatting
        const htmlContent = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
              <meta charset="UTF-8">
              <title>Site Intel Audit Report</title>
              <style>
                body {
                  font-family: "Times New Roman", Times, serif;
                  line-height: 1.5;
                  margin: 20px;
                }
                h1 {
                  color: #2c3e50;
                  font-size: 18pt;
                  border-bottom: 2px solid #2c3e50;
                  padding-bottom: 5px;
                }
                h2 {
                  color: #2c3e50;
                  font-size: 16pt;
                  margin-top: 20px;
                  border-bottom: 1px solid #ddd;
                  padding-bottom: 3px;
                }
                .url-info {
                  margin-bottom: 20px;
                }
                .issue {
                  margin-bottom: 15px;
                  page-break-inside: avoid;
                }
                .issue-title {
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .issue-detail {
                  margin-left: 20px;
                  margin-bottom: 3px;
                }
                .no-issues {
                  color: #666;
                  font-style: italic;
                }
              </style>
            </head>
            <body>
              <h1>Site Intel Audit Report</h1>
              
              <div class="url-info">
                <p>URL:${urlItem.url}</p>
                <p>Checked At: ${new Date(urlItem.submitted_time).toLocaleString()}</p>
              </div>
              
              <h2>SEO Issues</h2>
              ${seoIssues.length === 0 ? 
                '<p class="no-issues">No SEO issues found.</p>' : 
                seoIssues.map((issue, index) => {
                  const detail = issueDetails.find(i => i.issue_id === issue.issue_id);
                  return detail ? `
                    <div class="issue">
                      <div class="issue-title">${index + 1}. ${detail.issue_name}</div>
                      <div class="issue-detail"><strong>Description:</strong> ${detail.description || 'N/A'}</div>
                      <div class="issue-detail"><strong>Severity:</strong> ${detail.severity || 'N/A'}</div>
                      <div class="issue-detail"><strong>Recommendation:</strong> ${detail.recommendation}</div>
                    </div>
                  ` : '';
                }).join('')
              }
              
              <h2>UI/UX Issues</h2>
              ${uiuxIssues.length === 0 ? 
                '<p class="no-issues">No UI/UX issues found.</p>' : 
                uiuxIssues.map((issue, index) => {
                  const detail = issueDetails.find(i => i.issue_id === issue.issue_id);
                  return detail ? `
                    <div class="issue">
                      <div class="issue-title">${index + 1}. ${detail.issue_name}</div>
                      <div class="issue-detail"><strong>Description:</strong> ${detail.description || 'N/A'}</div>
                      <div class="issue-detail"><strong>Severity:</strong> ${detail.severity || 'N/A'}</div>
                      <div class="issue-detail"><strong>Recommendation:</strong> ${detail.recommendation}</div>
                    </div>
                  ` : '';
                }).join('')
              }
            </body>
          </html>
        `;

        // Create blob with proper MIME type
        const blob = new Blob(['\ufeff', htmlContent], { type: "application/msword" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Report_${urlItem.url_id}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
  
      // Insert log
      await supabase.from("tbl_log").insert({
        user_id: await userId,
        url_id: urlItem.url_id,
        action: "report generated",
        timestamp: new Date().toISOString(),
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
                <td>{item.status}</td>
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
    </div>
  );
};

export default UserActivity;