import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: intelligence, isLoading: loadingIntel } = useQuery<any[]>({
    queryKey: ["/api/intelligence"],
  });

  const { data: alerts, isLoading: loadingAlerts } = useQuery<any[]>({
    queryKey: ["/api/alerts"],
  });

  if (loadingIntel || loadingAlerts) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const classificationData = intelligence?.reduce((acc: any, item) => {
    acc[item.classification] = (acc[item.classification] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(classificationData || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const sentimentData = intelligence?.reduce((acc: any, item) => {
    const sentiment = item.aiProcessed?.sentiment || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {});

  const sentimentChartData = Object.entries(sentimentData || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Intelligence Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts?.filter(a => a.status === "active").map((alert) => (
              <div key={alert.id} className="p-2 bg-secondary rounded">
                <div className="font-medium">{alert.title}</div>
                <div className="text-sm text-muted-foreground">{alert.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {intelligence?.slice(0, 5).map((intel) => (
              <div key={intel.id} className="p-2 bg-secondary rounded">
                <div className="font-medium">{intel.title}</div>
                <div className="text-sm text-muted-foreground">
                  Classification: {intel.classification}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
