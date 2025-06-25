
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';
import { CalculatorInputs, CalculatorResults } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

const CalculatorChartsComponent = ({ inputs, results }: Props) => {
  // Download chart as PNG function
  const downloadChart = (chartId: string, filename: string) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;

    const svg = chartElement.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    canvas.width = svg.clientWidth || 800;
    canvas.height = svg.clientHeight || 400;
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Heat flow data with proper color coding and units
  const heatFlowData = [
    { 
      name: 'Envelope Heat Loss', 
      value: results.envelopeHeatLoss, 
      type: 'loss',
      unit: 'Btu/year'
    },
    { 
      name: 'Infiltration Heat Loss', 
      value: results.infiltrationHeatLoss, 
      type: 'loss',
      unit: 'Btu/year'
    },
    { 
      name: 'Envelope Heat Gain', 
      value: results.envelopeHeatGain, 
      type: 'gain',
      unit: 'Btu/year'
    },
    { 
      name: 'Infiltration Heat Gain', 
      value: results.infiltrationHeatGain, 
      type: 'gain',
      unit: 'Btu/year'
    },
    { 
      name: 'Solar Heat Gain', 
      value: results.solarHeatGain, 
      type: 'gain',
      unit: 'Btu/year'
    },
  ];

  const glazingData = [
    { name: 'North', area: inputs.northGlazingArea, color: '#8b5cf6' },
    { name: 'South', area: inputs.southGlazingArea, color: '#f59e0b' },
    { name: 'East', area: inputs.eastGlazingArea, color: '#10b981' },
    { name: 'West', area: inputs.westGlazingArea, color: '#ef4444' },
  ];

  const envelopeComponentsData = [
    { name: 'Glazing', area: results.totalGlazingArea, rValue: inputs.glazingRValue },
    { name: 'Soffit', area: inputs.soffitArea, rValue: inputs.soffitRValue },
    { name: 'Basement', area: inputs.basementArea, rValue: inputs.basementRValue },
    { name: 'Roof', area: inputs.roofArea, rValue: inputs.roofRValue },
    { name: 'Floor', area: inputs.floorArea, rValue: inputs.floorRValue },
    { name: 'Opaque Walls', area: inputs.opaqueWallArea, rValue: inputs.opaqueWallRValue },
  ];

  // R-value analysis data - varying opaque wall R-value in increments of 2.5
  const rValueAnalysisData = [];
  for (let r = 5; r <= 25; r += 2.5) {
    const totalUAValue = (results.totalGlazingArea / inputs.glazingRValue) +
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / inputs.roofRValue) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / r);
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    
    rValueAnalysisData.push({
      rValue: r,
      heatLoss: envelopeHeatLoss
    });
  }

  const chartConfig = {
    value: { label: "Value", color: "hsl(var(--chart-1))" },
    area: { label: "Area", color: "hsl(var(--chart-2))" },
    heatLoss: { label: "Heat Loss", color: "hsl(var(--chart-3))" },
  };

  // Custom bar component for heat flow chart
  const CustomBar = (props: any) => {
    const { payload } = props;
    const color = payload?.type === 'gain' ? '#ef4444' : '#3b82f6';
    return <Bar {...props} fill={color} />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Heat Flow Summary (Btu/year)</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChart('heat-flow-chart', 'heat-flow-summary')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatFlowData} id="heat-flow-chart">
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100} 
                  fontSize={12} 
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm">
                            {data.value.toLocaleString()} {data.unit}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value"
                  fill={(entry: any) => entry.type === 'gain' ? '#ef4444' : '#3b82f6'}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Glazing Area Distribution (ft²)</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChart('glazing-chart', 'glazing-distribution')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart id="glazing-chart">
                <Pie
                  data={glazingData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="area"
                  label={({ name, value }) => `${name}: ${value} ft²`}
                >
                  {glazingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm">{data.area} ft²</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Envelope Heat Loss vs Opaque Wall R-Value</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChart('rvalue-chart', 'rvalue-analysis')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rValueAnalysisData} id="rvalue-chart">
                <XAxis 
                  dataKey="rValue" 
                  label={{ value: 'Opaque Wall R-Value (ft²·°F·h/Btu)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Envelope Heat Loss (Btu/year)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload[0]) {
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="font-medium">R-Value: {label} ft²·°F·h/Btu</p>
                          <p className="text-sm">
                            Heat Loss: {payload[0].value?.toLocaleString()} Btu/year
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="heatLoss" 
                  stroke="var(--color-heatLoss)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-heatLoss)', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Building Envelope Components (ft²)</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChart('envelope-chart', 'envelope-components')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={envelopeComponentsData} id="envelope-chart">
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100} 
                  fontSize={12} 
                />
                <YAxis label={{ value: 'Area (ft²)', angle: -90, position: 'insideLeft' }} />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm">Area: {data.area} ft²</p>
                          <p className="text-sm">R-Value: {data.rValue} ft²·°F·h/Btu</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="area" fill="var(--color-area)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorChartsComponent;
