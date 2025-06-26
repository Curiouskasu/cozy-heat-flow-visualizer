
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart } from 'recharts';
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
    { name: 'North', area: inputs.northGlazingArea, color: '#000000' },
    { name: 'South', area: inputs.southGlazingArea, color: '#333333' },
    { name: 'East', area: inputs.eastGlazingArea, color: '#666666' },
    { name: 'West', area: inputs.westGlazingArea, color: '#999999' },
  ];

  const envelopeComponentsData = [
    { name: 'Glazing', area: results.totalGlazingArea, rValue: inputs.glazingRValue },
    { name: 'Soffit', area: inputs.soffitArea, rValue: inputs.soffitRValue },
    { name: 'Basement', area: inputs.basementArea, rValue: inputs.basementRValue },
    { name: 'Roof', area: inputs.roofArea, rValue: inputs.roofRValue },
    { name: 'Floor', area: inputs.floorArea, rValue: inputs.floorRValue },
    { name: 'Opaque Walls', area: inputs.opaqueWallArea, rValue: inputs.opaqueWallRValue },
  ];

  // Total calculated energy vs current energy load
  const totalCalculatedEnergy = results.envelopeHeatGain + results.envelopeHeatLoss + 
                               results.infiltrationHeatGain + results.infiltrationHeatLoss + 
                               results.solarHeatGain;
  
  const percentageDifference = ((totalCalculatedEnergy - inputs.currentEnergyLoad) / inputs.currentEnergyLoad * 100).toFixed(1);
  
  const energyComparisonData = [
    {
      name: 'Current Energy Load (Qc)',
      value: inputs.currentEnergyLoad,
      unit: 'Btu/year'
    },
    {
      name: `Calculated Load (${percentageDifference}% ${parseFloat(percentageDifference) >= 0 ? 'increase' : 'decrease'})`,
      value: totalCalculatedEnergy,
      unit: 'Btu/year'
    }
  ];

  // R-value analysis data for opaque walls (R-5 to R-40, increment 5)
  const rValueAnalysisData = [];
  const baselineHeatLoss = (results.totalGlazingArea / inputs.glazingRValue) +
                          (inputs.soffitArea / inputs.soffitRValue) +
                          (inputs.basementArea / inputs.basementRValue) +
                          (inputs.roofArea / inputs.roofRValue) +
                          (inputs.floorArea / inputs.floorRValue) +
                          (inputs.opaqueWallArea / 0.1); // R-0 approximation
  const baselineEnvelopeHeatLoss = baselineHeatLoss * inputs.heatingDegreeDays;

  for (let r = 5; r <= 40; r += 5) {
    const totalUAValue = (results.totalGlazingArea / inputs.glazingRValue) +
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / inputs.roofRValue) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / r);
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    const energySaved = ((baselineEnvelopeHeatLoss - envelopeHeatLoss) / baselineEnvelopeHeatLoss * 100);
    
    rValueAnalysisData.push({
      rValue: r,
      heatLoss: envelopeHeatLoss,
      energySaved: energySaved
    });
  }

  // Glazing U-value analysis (U 0.3 to U 0.1, increment 0.02)
  const glazingUValueAnalysisData = [];
  const baselineGlazingHeatLoss = (results.totalGlazingArea * 10) * inputs.heatingDegreeDays; // U-10 approximation

  for (let u = 0.3; u >= 0.1; u -= 0.02) {
    const totalUAValue = (results.totalGlazingArea * u) +
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / inputs.roofRValue) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / inputs.opaqueWallRValue);
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    const energySaved = ((baselineGlazingHeatLoss - (results.totalGlazingArea * u) * inputs.heatingDegreeDays) / baselineGlazingHeatLoss * 100);
    
    glazingUValueAnalysisData.push({
      uValue: parseFloat(u.toFixed(2)),
      heatLoss: envelopeHeatLoss,
      energySaved: energySaved
    });
  }

  // Roof R-value analysis (R-10 to R-80, increment 10)
  const roofRValueAnalysisData = [];
  const baselineRoofHeatLoss = (inputs.roofArea / 0.1) * inputs.heatingDegreeDays; // R-0 approximation

  for (let r = 10; r <= 80; r += 10) {
    const totalUAValue = (results.totalGlazingArea / inputs.glazingRValue) +
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / r) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / inputs.opaqueWallRValue);
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    const energySaved = ((baselineRoofHeatLoss - (inputs.roofArea / r) * inputs.heatingDegreeDays) / baselineRoofHeatLoss * 100);
    
    roofRValueAnalysisData.push({
      rValue: r,
      heatLoss: envelopeHeatLoss,
      energySaved: energySaved
    });
  }

  const chartConfig = {
    value: { label: "Value", color: "#000000" },
    area: { label: "Area", color: "#333333" },
    heatLoss: { label: "Heat Loss", color: "#000000" },
    energySaved: { label: "Energy Saved %", color: "#666666" },
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
                <Bar dataKey="value">
                  {heatFlowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.type === 'gain' ? '#ffffff' : '#000000'} stroke="#000000" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Energy Load Comparison (Btu/year)</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChart('energy-comparison-chart', 'energy-comparison')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyComparisonData} id="energy-comparison-chart">
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100} 
                  fontSize={12} 
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
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
                <Bar dataKey="value" fill="#000000" />
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
                <Bar dataKey="area" fill="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Opaque Wall R-Value Analysis</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChart('wall-rvalue-chart', 'wall-rvalue-analysis')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rValueAnalysisData} id="wall-rvalue-chart">
                <XAxis 
                  dataKey="rValue" 
                  label={{ value: 'Opaque Wall R-Value (ft²·°F·h/Btu)', position: 'insideBottom', offset: -5 }}
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
                          <p className="font-medium">R-Value: {label} ft²·°F·h/Btu</p>
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
                  fill="#000000"
                  name="Heat Loss"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="energySaved" 
                  stroke="#666666" 
                  strokeWidth={2}
                  dot={{ fill: '#666666', strokeWidth: 1, r: 3 }}
                  name="Energy Saved %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Glazing U-Value Analysis</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChart('glazing-uvalue-chart', 'glazing-uvalue-analysis')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={glazingUValueAnalysisData} id="glazing-uvalue-chart">
                <XAxis 
                  dataKey="uValue" 
                  label={{ value: 'Glazing U-Value (Btu/ft²·°F·h)', position: 'insideBottom', offset: -5 }}
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
                          <p className="font-medium">U-Value: {label} Btu/ft²·°F·h</p>
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
                  fill="#000000"
                  name="Heat Loss"
                  barSize={10}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="energySaved" 
                  stroke="#666666" 
                  strokeWidth={2}
                  dot={{ fill: '#666666', strokeWidth: 1, r: 2 }}
                  name="Energy Saved %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roof R-Value Analysis</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChart('roof-rvalue-chart', 'roof-rvalue-analysis')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100">
              <ComposedChart data={roofRValueAnalysisData} id="roof-rvalue-chart">
                <XAxis 
                  dataKey="rValue" 
                  label={{ value: 'Roof R-Value (ft²·°F·h/Btu)', position: 'insideBottom', offset: -5 }}
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
                          <p className="font-medium">R-Value: {label} ft²·°F·h/Btu</p>
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
                  fill="#000000"
                  name="Heat Loss"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="energySaved" 
                  stroke="#666666" 
                  strokeWidth={2}
                  dot={{ fill: '#666666', strokeWidth: 1, r: 3 }}
                  name="Energy Saved %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorChartsComponent;
