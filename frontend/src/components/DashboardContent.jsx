import React, { useEffect, useState } from "react";
import "./dashboard.css";
import Chart from "react-apexcharts";
import { supabase } from "../supabaseclient";

const DashboardContent = ({ user }) => {
  const [urlsCount, setUrlsCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [failedOrPendingCount, setFailedOrPendingCount] = useState(0);
  const [totalIssues, setTotalIssues] = useState(0);
  const [seoCount, setSeoCount] = useState(0);
  const [uiuxCount, setUiuxCount] = useState(0);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const { data: userData, error: userError } = await supabase
        .from("tbl_user")
        .select("name")
        .eq("id", user.id)
        .single();

      if (!userError && userData) {
        setFullName(userData.name);
      }

      // Fetch crawled URLs
      const { data: urls, error: urlError } = await supabase
        .from("tbl_crawledurls")
        .select("url_id, status")
        .eq("user_id", user.id);

      if (urls && !urlError) {
        setUrlsCount(urls.length);
        setCompletedCount(urls.filter((u) => u.status === "completed").length);
        setFailedOrPendingCount(urls.filter((u) => u.status !== "completed").length);

        const urlIds = urls.map((u) => u.url_id);

        // Fetch SEO issues
        const { data: seoIssues } = await supabase
          .from("tbl_seoissues")
          .select("*")
          .in("url_id", urlIds);

        // Fetch UI/UX issues
        const { data: uiuxIssues } = await supabase
          .from("tbl_uiuxissues")
          .select("*")
          .in("url_id", urlIds);

        const seo = seoIssues?.length || 0;
        const uiux = uiuxIssues?.length || 0;

        setSeoCount(seo);
        setUiuxCount(uiux);
        setTotalIssues(seo + uiux);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="dashboard-content">
     <h2>Welcome, {fullName || "User"}!</h2>

      <div className="card-container">
        {/* URLs Crawled Card */}
        <div className="card">
          <h3>URLs Crawled: {urlsCount}</h3>
          <Chart
            type="donut"
            width="100%"
            height="250"
            series={[completedCount, failedOrPendingCount]}
            options={{
              labels: ["Completed", "Failed/Pending"],
              colors: ["#00e396", "#feb019"],
              legend: { position: "bottom" },
            }}
          />
        </div>

        {/* Issues Card */}
        <div className="card">
          <h3>Total Issues Detected: {totalIssues}</h3>
          <Chart
            type="donut"
            width="100%"
            height="250"
            series={[seoCount, uiuxCount]}
            options={{
              labels: ["SEO Issues", "UI/UX Issues"],
              colors: ["#775DD0", "#FF4560"],
              legend: { position: "bottom" },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
