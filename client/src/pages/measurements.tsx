import { PageHeader } from '@/components/ui/presentation';
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMeasurements } from "@/hooks/use-measurements";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface MeasurementFieldConfig {
  key: keyof import("@/hooks/use-measurements").MeasurementData;
  label: string;
  unit: string;
  category: string;
}

const measurementFields: MeasurementFieldConfig[] = [
  { key: "weight", label: "Weight", unit: "lbs", category: "Body" },
  { key: "height", label: "Height", unit: "in", category: "Body" },
  { key: "bodyFat", label: "Body Fat", unit: "%", category: "Body" },
  { key: "neck", label: "Neck", unit: "in", category: "Circumference" },
  { key: "chest", label: "Chest", unit: "in", category: "Circumference" },
  { key: "waist", label: "Waist", unit: "in", category: "Circumference" },
  { key: "hips", label: "Hips", unit: "in", category: "Circumference" },
  { key: "bicepLeft", label: "Bicep (L)", unit: "in", category: "Arms" },
  { key: "bicepRight", label: "Bicep (R)", unit: "in", category: "Arms" },
  { key: "forearmLeft", label: "Forearm (L)", unit: "in", category: "Arms" },
  { key: "forearmRight", label: "Forearm (R)", unit: "in", category: "Arms" },
  { key: "thighLeft", label: "Thigh (L)", unit: "in", category: "Legs" },
  { key: "thighRight", label: "Thigh (R)", unit: "in", category: "Legs" },
  { key: "calfLeft", label: "Calf (L)", unit: "in", category: "Legs" },
  { key: "calfRight", label: "Calf (R)", unit: "in", category: "Legs" },
];

export default function MeasurementsPage() {
  const [, navigate] = useLocation();

  // Check if we came from dashboard
  const fromDashboard =
    new URLSearchParams(window.location.search).get("from") === "dashboard";

  const handleBack = () => {
    navigate("/wellness");
  };
  const {
    addMeasurements,
    getLatestValue,
    getValueTrend,
    getChartData,
    error: measurementError,
  } = useMeasurements();
  const [saveError, setSaveError] = useState("");

  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});
  useEffect(() => {
    // Load latest values
    const initialValues: { [key: string]: string } = {};
    measurementFields.forEach((field) => {
      const latestValue = getLatestValue(field.key);
      initialValues[field.key] = latestValue?.toString() || "";
    });
    setInputValues(initialValues);
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
    setDirtyFields((prev) => ({ ...prev, [key]: true }));
  };

  const handleSave = () => {
    try {
      const patch = Object.fromEntries(
        measurementFields
          .filter(
            (field) => dirtyFields[field.key] && inputValues[field.key]?.trim(),
          )
          .map((field) => [field.key, Number(inputValues[field.key])]),
      );
      if (!Object.keys(patch).length)
        throw new Error("Enter at least one measurement.");
      addMeasurements(patch);
      setDirtyFields({});
      setSaveError("");
      alert("Measurements saved.");
    } catch (failure) {
      setSaveError((failure as Error).message);
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-accent-text" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-feature-red" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const categorizedFields = measurementFields.reduce(
    (acc, field) => {
      if (!acc[field.category]) acc[field.category] = [];
      acc[field.category].push(field);
      return acc;
    },
    {} as { [category: string]: MeasurementFieldConfig[] },
  );

  return (
    <div className="fitcircle-page">
      <div className="fitcircle-container">
        {/* Header */}
        <PageHeader title="Measurements" onBack={handleBack} />

        {(measurementError || saveError) && (
          <p role="alert" className="text-sm text-warning-soft mb-4">
            {measurementError || saveError}
          </p>
        )}
        {measurementError && (
          <Button variant="outline" onClick={() => navigate("/settings")}>
            Open Settings
          </Button>
        )}
        {/* Input Section */}
        <div className="space-y-6">
          {Object.entries(categorizedFields).map(([category, fields]) => (
            <section key={category} className="fitcircle-card-lg">
              <h2 className="text-lg font-semibold mb-4 text-strong">
                {category}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field.key}>
                    <Label
                      htmlFor={field.key}
                      className="text-supporting flex items-center space-x-2"
                    >
                      <span>{field.label}</span>
                      {getLatestValue(field.key) &&
                        getTrendIcon(getValueTrend(field.key))}
                    </Label>
                    <Input
                      id={field.key}
                      type="number"
                      value={inputValues[field.key] || ""}
                      step="0.1"
                      onChange={(e) =>
                        handleInputChange(field.key, e.target.value)
                      }
                      className="bg-surface-secondary border-control text-strong mt-1"
                    />
                    {getLatestValue(field.key) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last: {getLatestValue(field.key)}
                        {field.unit}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <Button
            disabled={!!measurementError}
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-on-action py-3 font-medium"
          >
            Save Measurements
          </Button>

          {/* Trend Graphs Section */}
          <section className="glass-panel bg-surface rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-strong">
              Trend Graphs
            </h2>

            <div className="flex overflow-x-auto space-x-4 pb-4 horizontal-scroll">
              {measurementFields
                .filter((field) => getChartData(field.key).length > 0)
                .map((field) => {
                  const chartData = getChartData(field.key).map((entry) => ({
                    date: new Date(entry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    }),
                    value: entry.value,
                  }));

                  return (
                    <div
                      key={field.key}
                      className="flex-shrink-0 w-80 bg-surface-secondary rounded-xl p-4"
                    >
                      <h3 className="text-lg font-semibold mb-2 text-strong flex items-center space-x-2">
                        <span>{field.label}</span>
                        {getTrendIcon(getValueTrend(field.key))}
                      </h3>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                              domain={
                                chartData.length === 1
                                  ? ["dataMin - 5", "dataMax + 5"]
                                  : ["auto", "auto"]
                              }
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="var(--chart-series)"
                              strokeWidth={2}
                              dot={{ r: 5, fill: "var(--chart-series)" }}
                              connectNulls={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Latest: {getLatestValue(field.key)}
                        {field.unit} |{chartData.length} data point
                        {chartData.length > 1 ? "s" : ""}
                        {chartData.length === 1 && (
                          <div className="text-xs text-feature-blue mt-1">
                            Add more entries to see trend line
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {measurementFields.filter(
              (field) => getChartData(field.key).length > 0,
            ).length === 0 && (
              <div className="text-center text-dim py-8">
                <div className="text-4xl mb-2">📈</div>
                <h3 className="text-md font-semibold mb-1">
                  No Trend Data Yet
                </h3>
                <p className="text-sm">
                  Add measurements to see trend graphs here
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
