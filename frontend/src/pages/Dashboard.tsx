import React, { useEffect, useState } from "react";
import axios from "axios";
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold">Total Users</h2>
          <p className="text-3xl font-bold">{stats?.totalUsers}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold">Total Orders</h2>
          <p className="text-3xl font-bold">{stats?.totalOrders}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold">Total Products</h2>
          <p className="text-3xl font-bold">{stats?.totalProducts}</p>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <ul className="divide-y divide-gray-200">
          {activityLog.map((activity) => (
            <li key={activity.id} className="py-2">
              <p>{activity.action}</p>
              <p className="text-sm text-gray-500">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Graph */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          Orders and Users Over Time
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
            <Line type="monotone" dataKey="users" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
