import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseclient';
import { jsPDF } from 'jspdf';
import './UserActivity.css';

const AdminReports = () => {
  const [urls, setUrls] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCrawledUrls();
  }, []);

  const fetchCrawledUrls = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tbl_crawledurls')
        .select(`
          *,
          tbl_user(name)
        `)
        .order('submitted_time', { ascending: false });

      if (error) throw error;
      setUrls(data || []);
    } catch (error) {
      console.error('Error fetching URLs:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUrlReport = async (urlItem) => {
    try {
      // Fetch SEO and UI/UX issues for this URL
      const { data: seoIssues = [] } = await supabase
        .from('tbl_seoissues')
        .select('issue_id')
        .eq('url_id', urlItem.url_id);

      const { data: uiuxIssues = [] } = await supabase
        .from('tbl_uiuxissues')
        .select('issue_id')
        .eq('url_id', urlItem.url_id);

      const issueIds = [...seoIssues, ...uiuxIssues].map(i => i.issue_id);

      const { data: issueDetails = [] } = await supabase
        .from('tbl_issuepolicy')
        .select('*')
        .in('issue_id', issueIds);

      // Create PDF
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
      y = addText("Website Audit Report", margin, y, "bold", 16);
      y = addText(`Crawled By: ${urlItem.tbl_user?.name || 'Unknown'}`, margin, y);
      y = addText(`URL: ${urlItem.url}`, margin, y);
      y = addText(`Checked At: ${new Date(urlItem.submitted_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, margin, y);
      y += 10;

      // SEO Issues Section
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

      // UI/UX Issues Section
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

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  const paginatedUrls = urls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPagination = () => {
    const totalPages = Math.ceil(urls.length / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          &laquo;
        </button>
        {currentPage > 1 && (
          <button onClick={() => setCurrentPage(1)}>1</button>
        )}
        {currentPage > 2 && <span>...</span>}
        <button className="active-page">{currentPage}</button>
        {currentPage < totalPages - 1 && <span>...</span>}
        {currentPage < totalPages && (
          <button onClick={() => setCurrentPage(totalPages)}>
            {totalPages}
          </button>
        )}
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="admin-content">
      {loading ? (
        <div className="loading-animation">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <h2>Admin Crawled URLs Report</h2>

          <section className="section">
            <h3>Crawled URLs</h3>
            <table className="table-activity">
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>User</th>
                  <th>URL</th>
                  <th>Checked Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUrls.map((item, idx) => (
                  <tr key={`url-${item.url_id || idx}`}>
                    <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td>{item.tbl_user?.name || 'Unknown'}</td>
                    <td>{item.url}</td>
                    <td>
                      {new Date(item.submitted_time).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata'
                      })}
                    </td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status === 'completed' && (
                        <button 
                          className="generate-report-btn"
                          onClick={() => generateUrlReport(item)}
                        >
                          Generate Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderPagination()}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminReports;