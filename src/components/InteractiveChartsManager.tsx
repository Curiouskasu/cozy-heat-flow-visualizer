
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import InteractiveChart from './InteractiveChart';
import { CalculatorInputs } from "./HeatTransferCalculator";

interface ChartConfig {
  id: string;
  title: string;
  elementType: 'glazing' | 'building';
  elementId: string;
  valueType: 'rValue' | 'uValue';
  start: number;
  step: number;
  stop: number;
}

interface Props {
  inputs: CalculatorInputs;
}

const InteractiveChartsManager = ({ inputs }: Props) => {
  const [charts, setCharts] = useState<ChartConfig[]>([]);

  const addChart = () => {
    const newChart: ChartConfig = {
      id: Date.now().toString(),
      title: `Analysis Chart ${charts.length + 1}`,
      elementType: 'glazing',
      elementId: '',
      valueType: 'uValue',
      start: 0.1,
      step: 0.05,
      stop: 0.8
    };
    setCharts([...charts, newChart]);
  };

  const updateChart = (id: string, config: ChartConfig) => {
    setCharts(charts.map(chart => chart.id === id ? config : chart));
  };

  const removeChart = (id: string) => {
    setCharts(charts.filter(chart => chart.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Interactive Analysis Charts</h2>
        <Button onClick={addChart} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Chart
        </Button>
      </div>

      {charts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No analysis charts yet. Click "Add Chart" to create your first interactive chart.</p>
        </div>
      )}

      <div className="space-y-6">
        {charts.map(chart => (
          <InteractiveChart
            key={chart.id}
            inputs={inputs}
            chartConfig={chart}
            onUpdate={(config) => updateChart(chart.id, config)}
            onRemove={() => removeChart(chart.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveChartsManager;
