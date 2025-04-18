import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseclient";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import "./adminstatistics.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminStatistics = () => {
  const [logData, setLogData] = useState([]);
  const [userData, setUserData] = useState({});
  const [crawledUrls, setCrawledUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");
  const [seoIssues, setSeoIssues] = useState([]);
  const [uiuxIssues, setUiuxIssues] = useState([]);
  const [issuePolicies, setIssuePolicies] = useState({});

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch user data first to map IDs to names
    const { data: users, error: userError } = await supabase
      .from("tbl_user")
      .select("id, name");
    
    if (userError) {
      console.error("Error fetching users:", userError);
      return;
    }

    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user.name;
    });
    setUserData(userMap);

    // Fetch issue policies to map issue_id to severity
    const { data: policies, error: policyError } = await supabase
      .from("tbl_issuepolicy")
      .select("issue_id, severity");

    if (!policyError) {
      const policyMap = {};
      policies.forEach(policy => {
        policyMap[policy.issue_id] = policy.severity;
      });
      setIssuePolicies(policyMap);
    } else {
      console.error("Error fetching issue policies:", policyError);
    }

    // Set date range filter
    let dateFilter = new Date();
    if (timeRange === "week") {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeRange === "month") {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (timeRange === "year") {
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    // Fetch log data
    const { data: logs, error: logError } = await supabase
      .from("tbl_log")
      .select("*")
      .gte("timestamp", dateFilter.toISOString());

    // Fetch crawled URLs data
    const { data: urls, error: urlsError } = await supabase
      .from("tbl_crawledurls")
      .select("*")
      .gte("submitted_time", dateFilter.toISOString());

    if (!logError) {
      setLogData(logs);
    } else {
      console.error("Error fetching logs:", logError);
    }

    if (!urlsError) {
      setCrawledUrls(urls);
    } else {
      console.error("Error fetching crawled URLs:", urlsError);
    }

    // Fetch issues data only if we have URLs
    if (urls && urls.length > 0) {
      const urlIds = urls.map(url => url.url_id);

      const { data: seoIssuesData, error: seoError } = await supabase
        .from("tbl_seoissues")
        .select("*")
        .in("url_id", urlIds);

      const { data: uiuxIssuesData, error: uiuxError } = await supabase
        .from("tbl_uiuxissues")
        .select("*")
        .in("url_id", urlIds);

      if (!seoError) {
        setSeoIssues(seoIssuesData);
      } else {
        console.error("Error fetching SEO issues:", seoError);
      }

      if (!uiuxError) {
        setUiuxIssues(uiuxIssuesData);
      } else {
        console.error("Error fetching UI/UX issues:", uiuxError);
      }
    }

    setLoading(false);
  };

  // Process action data with exact matching
  const processActionData = () => {
    const actionCounts = {
      "URL Checked": 0,
      "Report Generated": 0,
      "URL Checking Failed": 0,
      "Other": 0
    };

    logData.forEach(log => {
      if (log.action === "URL Checked") {
        actionCounts["URL Checked"]++;
      } else if (log.action === "Report Generated") {
        actionCounts["Report Generated"]++;
      } else if (log.action === "URL Checking Failed") {
        actionCounts["URL Checking Failed"]++;
      } else {
        actionCounts["Other"]++;
      }
    });

    return actionCounts;
  };

  // Process time series data with exact action matching
  const processTimeSeriesData = () => {
    const groupedData = {};
    const dateFormatOptions = timeRange === "year" 
      ? { month: "short" } 
      : timeRange === "month" 
        ? { day: "numeric" } 
        : { weekday: "short" };

    logData.forEach(log => {
      const date = new Date(log.timestamp);
      const dateKey = date.toLocaleDateString("en-US", dateFormatOptions);
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          "URL Checked": 0,
          "Report Generated": 0,
          "URL Checking Failed": 0
        };
      }

      if (log.action === "URL Checked") {
        groupedData[dateKey]["URL Checked"]++;
      } else if (log.action === "Report Generated") {
        groupedData[dateKey]["Report Generated"]++;
      } else if (log.action === "URL Checking Failed") {
        groupedData[dateKey]["URL Checking Failed"]++;
      }
    });

    return groupedData;
  };

  // Process crawled URLs status data
  const processUrlStatusData = () => {
    const statusCounts = {
      "Completed": 0,
      "Failed": 0,
      "In Progress": 0
    };

    crawledUrls.forEach(url => {
      if (url.status === "completed") statusCounts["Completed"]++;
      else if (url.status === "failed") statusCounts["Failed"]++;
      else statusCounts["In Progress"]++;
    });

    return statusCounts;
  };

  // Process crawled URLs over time
  const processUrlsOverTime = () => {
    const groupedData = {};
    const dateFormatOptions = timeRange === "year" 
      ? { month: "short" } 
      : timeRange === "month" 
        ? { day: "numeric" } 
        : { weekday: "short" };

    crawledUrls.forEach(url => {
      const date = new Date(url.submitted_time);
      const dateKey = date.toLocaleDateString("en-US", dateFormatOptions);
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          "Completed": 0,
          "Failed": 0
        };
      }

      if (url.status === "completed") groupedData[dateKey]["Completed"]++;
      else if (url.status === "failed") groupedData[dateKey]["Failed"]++;
    });

    return groupedData;
  };

  // Process issue data
  const processIssueData = () => {
    const issueCounts = {
      "SEO Issues": seoIssues.length,
      "UI/UX Issues": uiuxIssues.length
    };

    return issueCounts;
  };

  const processIssueSeverityData = () => {
    const severityCounts = {
      "high": 0,
      "medium": 0,
      "low": 0
    };

    // Process SEO issues
    seoIssues.forEach(issue => {
      const severity = issuePolicies[issue.issue_id] || "Medium";
      severityCounts[severity]++;
    });

    // Process UI/UX issues
    uiuxIssues.forEach(issue => {
      const severity = issuePolicies[issue.issue_id] || "Medium";
      severityCounts[severity]++;
    });

    return severityCounts;
  };

  const processIssuesByUrl = () => {
    const urlIssueCounts = {};

    crawledUrls.forEach(url => {
      const seoCount = seoIssues.filter(issue => issue.url_id === url.url_id).length;
      const uiuxCount = uiuxIssues.filter(issue => issue.url_id === url.url_id).length;
      urlIssueCounts[url.url] = {
        total: seoCount + uiuxCount,
        seo: seoCount,
        uiux: uiuxCount
      };
    });

    // Get top 5 URLs with most issues
    const sortedUrls = Object.entries(urlIssueCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);

    return sortedUrls;
  };

  // Prepare chart data
  const actionCounts = processActionData();
  const timeSeriesData = processTimeSeriesData();
  const urlStatusData = processUrlStatusData();
  const urlsOverTimeData = processUrlsOverTime();
  const issueCounts = processIssueData();
  const severityCounts = processIssueSeverityData();
  const topIssueUrls = processIssuesByUrl();

  // Pie Chart Data
  const pieChartData = {
    labels: Object.keys(actionCounts).filter(key => actionCounts[key] > 0),
    datasets: [
      {
        data: Object.keys(actionCounts)
          .filter(key => actionCounts[key] > 0)
          .map(key => actionCounts[key]),
        backgroundColor: [
          "#36A2EB",
          "#FFCE56",
          "#FF6384",
          "#4BC0C0"
        ],
        hoverBackgroundColor: [
          "#36A2EB",
          "#FFCE56",
          "#FF6384",
          "#4BC0C0"
        ]
      }
    ]
  };

  // Line Chart Data
  const timeSeriesChartData = {
    labels: Object.keys(timeSeriesData),
    datasets: [
      {
        label: "URL Checked",
        data: Object.values(timeSeriesData).map(d => d["URL Checked"]),
        backgroundColor: "#36A2EB",
        borderColor: "#36A2EB",
        borderWidth: 2,
        tension: 0.4,
        fill: false
      },
      {
        label: "Report Generated",
        data: Object.values(timeSeriesData).map(d => d["Report Generated"]),
        backgroundColor: "#FFCE56",
        borderColor: "#FFCE56",
        borderWidth: 2,
        tension: 0.4,
        fill: false
      },
      {
        label: "URL Checking Failed",
        data: Object.values(timeSeriesData).map(d => d["URL Checking Failed"]),
        backgroundColor: "#FF6384",
        borderColor: "#FF6384",
        borderWidth: 2,
        tension: 0.4,
        fill: false
      }
    ]
  };

  // Top Users Data
  const userActivity = {};
  logData.forEach(log => {
    if (!userActivity[log.user_id]) {
      userActivity[log.user_id] = 0;
    }
    userActivity[log.user_id]++;
  });

  const sortedUsers = Object.entries(userActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const barChartData = {
    labels: sortedUsers.map(([userId]) => userData[userId] || `User ${userId}`),
    datasets: [
      {
        label: "Activity Count",
        data: sortedUsers.map(([, count]) => count),
        backgroundColor: "#4BC0C0",
        borderColor: "#4BC0C0",
        borderWidth: 1
      }
    ]
  };

  // URL Status Chart Data
  const urlStatusChartData = {
    labels: Object.keys(urlStatusData),
    datasets: [
      {
        data: Object.values(urlStatusData),
        backgroundColor: ["#4BC0C0", "#FF6384", "#FFCE56"],
        borderWidth: 1
      }
    ]
  };

  // URLs Over Time Chart Data
  const urlsOverTimeChartData = {
    labels: Object.keys(urlsOverTimeData),
    datasets: [
      {
        label: "Completed",
        data: Object.values(urlsOverTimeData).map(d => d["Completed"]),
        borderColor: "#4BC0C0",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1
      },
      {
        label: "Failed",
        data: Object.values(urlsOverTimeData).map(d => d["Failed"]),
        borderColor: "#FF6384",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.1
      }
    ]
  };

  // Issue Type Chart Data
  const issueTypeChartData = {
    labels: Object.keys(issueCounts),
    datasets: [{
      data: Object.values(issueCounts),
      backgroundColor: ["#36A2EB", "#FFCE56"],
      borderWidth: 1
    }]
  };

  // Issue Severity Chart Data
  const issueSeverityChartData = {
    labels: Object.keys(severityCounts),
    datasets: [{
      data: Object.values(severityCounts),
      backgroundColor: ["#FF6384", "#FFCE56", "#4BC0C0"],
      borderWidth: 1
    }]
  };

  // Top URLs with Issues Chart Data
  const topUrlsChartData = {
    labels: topIssueUrls.map(([url]) => url.length > 30 ? `${url.substring(0, 30)}...` : url),
    datasets: [{
      label: "Total Issues",
      data: topIssueUrls.map(([, counts]) => counts.total),
      backgroundColor: "#4BC0C0",
      borderColor: "#4BC0C0",
      borderWidth: 1
    }]
  };

  return (
    <div className="admin-content">
      <h2>Statistics</h2>
      
      <div className="time-range-selector">
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-range-dropdown"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-animation">
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      ) : (
        <>
          {/* User Activity Section */}
          <div className="statistics-section">
            <h3 className="section-title">User Activity</h3>
            <div className="statistics-grid">
              {/* Action Distribution Pie Chart */}
              <div className="chart-container">
                <h4>Action Distribution</h4>
                <div className="chart-wrapper" style={{ position: 'relative', height: '300px' }}>
                  <Pie 
                    data={pieChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            padding: 20,
                            font: {
                              size: 12
                            },
                            boxWidth: 15
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Activity Over Time Line Chart */}
              <div className="chart-container">
                <h4>Activity Over Time</h4>
                <div className="chart-wrapper" style={{ position: 'relative', height: '300px' }}>
                  <Line
                    data={timeSeriesChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                          },
                          ticks: {
                            stepSize: 1
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 20
                          }
                        }
                      },
                      elements: {
                        line: {
                          tension: 0.4
                        },
                        point: {
                          radius: 4,
                          hoverRadius: 6
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Top Users Bar Chart */}
              <div className="chart-container">
                <h4>Top Active Users</h4>
                <div className="chart-wrapper" style={{ position: 'relative', height: '300px' }}>
                  <Bar
                    data={barChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `Actions: ${context.raw}`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="stats-summary">
                <h4>Quick Stats</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h5>Total Actions</h5>
                    <p>{logData.length}</p>
                  </div>
                  <div className="stat-card">
                    <h5>URLs Checked</h5>
                    <p>{actionCounts["URL Checked"]}</p>
                  </div>
                  <div className="stat-card">
                    <h5>Reports Generated</h5>
                    <p>{actionCounts["Report Generated"]}</p>
                  </div>
                  <div className="stat-card">
                    <h5>Failed Checks</h5>
                    <p>{actionCounts["URL Checking Failed"]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Crawled URLs Section */}
          <div className="statistics-section">
            <h3 className="section-title">Crawled URLs</h3>
            <div className="statistics-grid">
              {/* URL Status Distribution */}
              <div className="chart-container">
                <h4>URL Status Distribution</h4>
                <div className="chart-wrapper" style={{ position: 'relative', height: '300px' }}>
                  <Pie 
                    data={urlStatusChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            padding: 20,
                            font: {
                              size: 12
                            },
                            boxWidth: 15
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((context.raw / total) * 100);
                              return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* URLs Over Time */}
              <div className="chart-container">
                <h4>URLs Over Time</h4>
                <div className="chart-wrapper" style={{ position: 'relative', height: '300px' }}>
                  <Line 
                    data={urlsOverTimeChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 20
                          }
                        }
                      },
                      elements: {
                        line: {
                          tension: 0.4
                        },
                        point: {
                          radius: 4,
                          hoverRadius: 6
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Recent URLs */}
              <div className="chart-container">
                <h4>Recent URLs</h4>
                <div className="urls-list">
                  {crawledUrls.slice(0, 5).map((url, index) => (
                    <div key={url.url_id} className="url-item">
                      <p><strong>{index + 1}.</strong> {url.url}</p>
                      <span className={`status-badge ${url.status}`}>
                        {url.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* URL Stats Summary */}
              <div className="stats-summary">
                <h4>URL Stats</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h5>Total URLs</h5>
                    <p>{crawledUrls.length}</p>
                  </div>
                  <div className="stat-card">
                    <h5>Completed</h5>
                    <p>{urlStatusData["Completed"]}</p>
                  </div>
                  <div className="stat-card">
                    <h5>Failed</h5>
                    <p>{urlStatusData["Failed"]}</p>
                  </div>
                  <div className="stat-card">
                    <h5>In Progress</h5>
                    <p>{urlStatusData["In Progress"]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Issues Found Section */}
          <div className="statistics-section">
            <h3 className="section-title">Issues Found</h3>
            <div className="statistics-grid">
              {/* Issue Type Distribution */}
              <div className="chart-container">
                <h4>Issue Type Distribution</h4>
                <div className="chart-wrapper" style={{ position: 'relative', height: '300px' }}>
                  <Doughnut 
                    data={issueTypeChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            padding: 20,
                            font: {
                              size: 12
                            },
                            boxWidth: 15
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((context.raw / total) * 100);
                              return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Issue Severity Distribution */}
              <div className="chart-container">
                <h4>Issue Severity Distribution</h4>
                <div className="chart-wrapper" style={{ position: 'relative', height: '300px' }}>
                  <Pie 
                    data={issueSeverityChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            padding: 20,
                            font: {
                              size: 12
                            },
                            boxWidth: 15
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((context.raw / total) * 100);
                              return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Top URLs with Issues */}
              <div className="chart-container">
                <h4>Top URLs with Issues</h4>
                <div className="chart-wrapper" style={{ position: 'relative', height: '300px' }}>
                  <Bar 
                    data={topUrlsChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      scales: {
                        x: {
                          beginAtZero: true
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const urlData = topIssueUrls[context.dataIndex];
                              return [
                                `Total Issues: ${context.raw}`,
                                `SEO Issues: ${urlData[1].seo}`,
                                `UI/UX Issues: ${urlData[1].uiux}`
                              ];
                            },
                            afterLabel: function(context) {
                              const fullUrl = topIssueUrls[context.dataIndex][0];
                              return `URL: ${fullUrl}`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Issue Stats Summary */}
              <div className="stats-summary">
                <h4>Issue Stats</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h5>Total Issues</h5>
                    <p>{seoIssues.length + uiuxIssues.length}</p>
                  </div>
                  <div className="stat-card">
                    <h5>SEO Issues</h5>
                    <p>{seoIssues.length}</p>
                  </div>
                  <div className="stat-card">
                    <h5>UI/UX Issues</h5>
                    <p>{uiuxIssues.length}</p>
                  </div>
                  <div className="stat-card">
                    <h5>High Severity</h5>
                    <p>{severityCounts["high"]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminStatistics;