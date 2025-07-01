
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Download, FileText, X } from 'lucide-react';
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
  chartConfig: ChartConfig;
  onUpdate: (config: ChartConfig) => void;
  onRemove: () => void;
}

const InteractiveChart = ({ inputs, chartConfig, onUpdate, onRemove }: Props) => {
  const [chartData, setChartData] = useState<any[]>([]);

  // Get available elements based on type
  const getAvailableElements = () => {
    if (chartConfig.elementType === 'glazing') {
      return [
        ...inputs.proposedBuilding.glazingElements.map(el => ({ id: el.id, name: el.name, type: 'glazing' }))
      ];
    } else {
      return [
        ...inputs.proposedBuilding.buildingElements.map(el => ({ id: el.id, name: el.name, type: 'building' }))
      ];
    }
  };

  // Calculate chart data based on configuration
  useEffect(() => {
    const data = [];
    let maxHeatLoss = 0;

    // First pass to find maximum heat loss
    for (let value = chartConfig.start; value <= chartConfig.stop; value += chartConfig.step) {
      const heatLoss = calculateHeatLoss(value);
      maxHeatLoss = Math.max(maxHeatLoss, heatLoss);
    }

    // Second pass to calculate energy saved
    for (let value = chartConfig.start; value <= chartConfig.stop; value += chartConfig.step) {
      const heatLoss = calculateHeatLoss(value);
      const energySaved = maxHeatLoss > 0 ? ((maxHeatLoss - heatLoss) / maxHeatLoss * 100) : 0;
      
      data.push({
        value: parseFloat(value.toFixed(2)),
        heatLoss,
        energySaved
      });
    }

    setChartData(data);
  }, [chartConfig, inputs]);

  const calculateHeatLoss = (value: number) => {
    let totalUAValue = 0;

    // Calculate base UA value from all elements
    inputs.proposedBuilding.glazingElements.forEach(glazing => {
      const area = glazing.northArea + glazing.southArea + glazing.eastArea + glazing.westArea;
      if (chartConfig.elementType === 'glazing' && glazing.id === chartConfig.elementId) {
        const uValue = chartConfig.valueType === 'uValue' ? value : (1 / value);
        totalUAValue += area * uValue;
      } else {
        totalUAValue += area * glazing.uValue;
      }
    });

    inputs.proposedBuilding.buildingElements.forEach(element => {
      if (chartConfig.elementType === 'building' && element.id === chartConfig.elementId) {
        const rValue = chartConfig.valueType === 'rValue' ? value : (1 / value);
        totalUAValue += element.area / rValue;
      } else {
        totalUAValue += element.area / element.rValue;
      }
    });

    return totalUAValue * inputs.climateData.heatingDegreeDays;
  };

  const downloadChart = () => {
    const csvContent = [
      ['Value', 'Heat Loss (Btu/year)', 'Energy Saved (%)'].join(','),
      ...chartData.map(row => [row.value, row.heatLoss, row.energySaved.toFixed(2)].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chartConfig.title.replace(/\s+/g, '_')}_analysis.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const availableElements = getAvailableElements();
  const selectedElement = availableElements.find(el => el.id === chartConfig.elementId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex-1">
          <Input
            value={chartConfig.title}
            onChange={(e) => onUpdate({ ...chartConfig, title: e.target.value })}
            className="font-semibold"
          />
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadChart}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Element Type</Label>
            <Select
              value={chartConfig.elementType}
              onValueChange={(value: 'glazing' | 'building') => 
                onUpdate({ ...chartConfig, elementType: value, elementId: '' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glazing">Glazing</SelectItem>
                <SelectItem value="building">Building Element</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Element</Label>
            <Select
              value={chartConfig.elementId}
              onValueChange={(value) => onUpdate({ ...chartConfig, elementId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select element" />
              </SelectTrigger>
              <SelectContent>
                {availableElements.map(el => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Value Type</Label>
            <Select
              value={chartConfig.valueType}
              onValueChange={(value: 'rValue' | 'uValue') => 
                onUpdate({ ...chartConfig, valueType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rValue">R-Value</SelectItem>
                <SelectItem value="uValue">U-Value</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Start</Label>
            <Input
              type="number"
              step="0.1"
              value={chartConfig.start}
              onChange={(e) => onUpdate({ ...chartConfig, start: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Step</Label>
            <Input
              type="number"
              step="0.1"
              value={chartConfig.step}
              onChange={(e) => onUpdate({ ...chartConfig, step: parseFloat(e.target.value) || 0.1 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Stop</Label>
            <Input
              type="number"
              step="0.1"
              value={chartConfig.stop}
              onChange={(e) => onUpdate({ ...chartConfig, stop: parseFloat(e.target.value) || 1 })}
            />
          </div>
        </div>

        {selectedElement && chartData.length > 0 && (
          <div className="mt-6">
            <ChartContainer config={{}} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <XAxis 
                    dataKey="value" 
                    label={{ 
                      value: `${selectedElement.name} ${chartConfig.valueType === 'rValue' ? 'R-Value' : 'U-Value'} ${chartConfig.valueType === 'rValue' ? '(ft²·°F·h/Btu)' : '(Btu/ft²·°F·h)'}`, 
                      position: 'insideBottom', 
                      offset: -5 
                    }}
                  />
                  <YAxis 
                    yAxisId="left"
                    label={{ value: 'Heat Loss (Btu/year)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Energy Saved (%)', angle: 90, position: 'insideRight' }}
                    domain={[0, 100]}
                  />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length > 0) {
                        return (
                          <div className="bg-white p-2 border rounded shadow">
                            <p className="font-medium">
                              {chartConfig.valueType === 'rValue' ? 'R-Value' : 'U-Value'}: {label}
                            </p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{color: entry.color}}>
                                {entry.dataKey === 'energySaved' ? 
                                  `Energy Saved: ${Number(entry.value).toFixed(1)}%` : 
                                  `Heat Loss: ${Number(entry.value).toLocaleString()} Btu/year`}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="heatLoss" 
                    fill="#156082"
                    name="Heat Loss"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="energySaved" 
                    stroke="#e97132" 
                    strokeWidth={2}
                    dot={{ fill: '#e97132', strokeWidth: 1, r: 3 }}
                    name="Energy Saved %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveChart;
