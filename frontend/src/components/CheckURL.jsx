import React, { useState } from "react";
import { supabase } from "../supabaseclient";
import "./checkurl.css";

const CheckURL = ({ user }) => {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) {
      alert("Please enter a valid URL");
      return;
    }

    setLoading(true);

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

      const allIssueIds = [...data.seo_issues, ...data.uiux_issues];

      const issueDetails = await Promise.all(
        allIssueIds.map(async (id) => {
          const { data: issueData, error } = await supabase
            .from("tbl_issuepolicy")
            .select("*")
            .eq("issue_id", id)
            .single();

          if (error) {
            console.error("Error fetching issue:", error);
            return null;
          }

          return issueData;
        })
      );

      const validIssues = issueDetails.filter((issue) => issue !== null);

      const formattedResult = {
        id: results.length + 1,
        url: data.url,
        timestamp,
        issues: validIssues,
      };

      setResults([formattedResult, ...results]);
    } catch (error) {
      console.error("Error checking URL:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (result) => {
    const content = result.issues
      .map((i, idx) =>
        `Issue ${idx + 1}:\nType: ${i.type}\nName: ${i.issue_name}\nRecommendation: ${i.recommendation}\n`
      )
      .join("\n");

    const blob = new Blob(
      [`URL: ${result.url}\nTime: ${result.timestamp}\n\n${content}`],
      { type: "text/plain" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "report.txt";
    link.click();
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
        </div>

        <div className="results-section">
          {loading ? (
            <div className="skeleton-loader"></div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <div className="result-card" key={result.id}>
                <p><strong>URL:</strong> {result.url}</p>
                <p><strong>Checked On:</strong> {result.timestamp}</p>
                <h4>Issues Found:</h4>
                <ul>
                  {result.issues.length > 0 ? (
                    result.issues.map((issue, index) => (
                      <li key={index}>
                        <strong>Type:</strong> {issue.type} <br />
                        <strong>Name:</strong> {issue.issue_name} <br />
                        <strong>Recommendation:</strong> {issue.recommendation}
                      </li>
                    ))
                  ) : (
                    <li>No issues found.</li>
                  )}
                </ul>
                <button className="generate-btn" onClick={() => downloadReport(result)}>Generate Report</button>
              </div>
            ))
          ) : (
            <p>No results yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckURL;
