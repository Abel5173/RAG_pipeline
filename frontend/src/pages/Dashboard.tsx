/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
}

interface Activity {
  id: number;
  action: string;
  timestamp: string;
}

interface GraphData {
  date: string;
  orders: number;
  users: number;
}

const Dashboard: React.FC = () => {
  const { role } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activityLog, setActivityLog] = useState<Activity[]>([]);
  const [graphData, setGraphData] = useState<GraphData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch summary stats
        const statsResponse = await axios.get(
          "http://localhost:8000/api/v1/stats"
        );
        setStats(statsResponse.data);

        // Fetch recent activity log
        const activityResponse = await axios.get(
          "http://localhost:8000/api/v1/activity"
        );
        setActivityLog(activityResponse.data);

        // Fetch graph data
        const graphResponse = await axios.get(
          "http://localhost:8000/api/v1/stats/graph"
        );
        setGraphData(graphResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p>Welcome, Admin! Here are your admin-specific stats and tools.</p>
      </div>
    );
  }

  if (role === "staff") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        <p>Welcome, Staff! Here are your staff-specific stats and tools.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome! Your role is not recognized.</p>
    </div>
  );
};

export default Dashboard;
