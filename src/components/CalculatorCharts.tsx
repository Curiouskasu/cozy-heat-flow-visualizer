import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart } from 'recharts';
import { Download, FileText } from 'lucide-react';
import { CalculatorInputs, CalculatorResults } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

const CalculatorChartsComponent = ({ inputs, results }: Props) => {
  const [selectedBuildings, setSelectedBuildings] = React.useState<string[]>([]);
  const [showComparison, setShowComparison] = React.useState(false);

  // Toggle building selection for comparison
  const toggleBuildingSelection = (buildingName: string) => {
    setSelectedBuildings(prev => 
      prev.includes(buildingName)
        ? prev.filter(name => name !== buildingName)
        : [...prev, buildingName]
    );
  };

  // Download chart as PNG function
  const downloadChart = (chartId: string, filename: string) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;

    // Fix 1: Proper SVG type checking and casting
    let svg: SVGSVGElement | null = null;
    
    if (chartElement.tagName.toLowerCase() === 'svg') {
        svg = chartElement as unknown as SVGSVGElement;
    } else {
        svg = chartElement.querySelector('svg');
    }
    
    if (!svg) return;

    // Fix 2: Clone with proper typing
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fix 3: Handle getBBox() which might not exist on all elements
    let width: number, height: number;
    try {
        const bbox = svg.getBBox();
        width = bbox.width || svg.clientWidth || 800;
        height = bbox.height || svg.clientHeight || 400;
    } catch (e) {
        // Fallback if getBBox() fails
        width = svg.clientWidth || 800;
        height = svg.clientHeight || 400;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Fix 4: Ensure setAttribute gets string values
    svgClone.setAttribute('width', width.toString());
    svgClone.setAttribute('height', height.toString());
    svgClone.style.background = 'white';
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
            if (blob) {
                const link = document.createElement('a');
                link.download = `${filename}.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }
        }, 'image/png');
        
        URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
        console.error('Failed to load SVG image');
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
};
  // Download CSV function
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Heat gains and losses data - separated into components
  const heatComponentsData = [
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
  ];

  const glazingData = [
    { name: 'North', area: inputs.northGlazingArea, color: '#000000' },
    { name: 'South', area: inputs.southGlazingArea, color: '#333333' },
    { name: 'East', area: inputs.eastGlazingArea, color: '#666666' },
    { name: 'West', area: inputs.westGlazingArea, color: '#999999' },
  ];

  const envelopeComponentsData = [
    { name: 'Glazing', area: results.totalGlazingArea, rValue: inputs.glazingRValue, color: '#000000' },
    { name: 'Soffit', area: inputs.soffitArea, rValue: inputs.soffitRValue, color: '#1a1a1a' },
    { name: 'Basement', area: inputs.basementArea, rValue: inputs.basementRValue, color: '#333333' },
    { name: 'Roof', area: inputs.roofArea, rValue: inputs.roofRValue, color: '#4d4d4d' },
    { name: 'Floor', area: inputs.floorArea, rValue: inputs.floorRValue, color: '#666666' },
    { name: 'Opaque Walls', area: inputs.opaqueWallArea, rValue: inputs.opaqueWallRValue, color: '#808080' },
  ];

  // Glazing U-value analysis (U 0.1 to U 0.8, increment 0.05)
  const glazingUValueAnalysisData = [];
  let maxGlazingHeatLoss = 0;

  // First pass to find the maximum heat loss
  for (let u = 0.1; u <= 0.8; u += 0.05) {
    const totalUAValue = (results.totalGlazingArea * u) +
                        (inputs.soffitArea / (inputs.soffitRValue || 1)) +
                        (inputs.basementArea / (inputs.basementRValue || 1)) +
                        (inputs.roofArea / (inputs.roofRValue || 1)) +
                        (inputs.floorArea / (inputs.floorRValue || 1)) +
                        (inputs.opaqueWallArea / (inputs.opaqueWallRValue || 1));
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    maxGlazingHeatLoss = Math.max(maxGlazingHeatLoss, envelopeHeatLoss);
  }

  // Second pass to calculate energy saved compared to maximum
  for (let u = 0.1; u <= 0.8; u += 0.05) {
    const totalUAValue = (results.totalGlazingArea * u) +
                        (inputs.soffitArea / (inputs.soffitRValue || 1)) +
                        (inputs.basementArea / (inputs.basementRValue || 1)) +
                        (inputs.roofArea / (inputs.roofRValue || 1)) +
                        (inputs.floorArea / (inputs.floorRValue || 1)) +
                        (inputs.opaqueWallArea / (inputs.opaqueWallRValue || 1));
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    const energySaved = ((maxGlazingHeatLoss - envelopeHeatLoss) / maxGlazingHeatLoss * 100);
    
    glazingUValueAnalysisData.push({
      uValue: parseFloat(u.toFixed(2)),
      heatLoss: envelopeHeatLoss,
      energySaved: energySaved
    });
  }

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
  let maxWallHeatLoss = 0;

  // First pass to find the maximum heat loss
  for (let r = 5; r <= 40; r += 5) {
    const totalUAValue = (results.totalGlazingArea / inputs.glazingRValue) +
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / inputs.roofRValue) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / r);
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    maxWallHeatLoss = Math.max(maxWallHeatLoss, envelopeHeatLoss);
  }

  // Second pass to calculate energy saved compared to maximum
  for (let r = 5; r <= 40; r += 5) {
    const totalUAValue = (results.totalGlazingArea / inputs.glazingRValue) +
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / inputs.roofRValue) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / r);
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    const energySaved = ((maxWallHeatLoss - envelopeHeatLoss) / maxWallHeatLoss * 100);
    
    rValueAnalysisData.push({
      rValue: r,
      heatLoss: envelopeHeatLoss,
      energySaved: energySaved
    });
  }

  // Glazing U-value analysis (U 0.3 to U 0.1, increment 0.02)
  const glazingUValueAnalysisData2 = [];
  let maxGlazingHeatLoss2 = 0;

  // First pass to find the maximum heat loss
  for (let u = 0.3; u >= 0.1; u -= 0.02) {
    const totalUAValue = (results.totalGlazingArea * u) +
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / inputs.roofRValue) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / inputs.opaqueWallRValue);
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    maxGlazingHeatLoss2 = Math.max(maxGlazingHeatLoss2, envelopeHeatLoss);
  }

  // Second pass to calculate energy saved compared to maximum
  for (let u = 0.3; u >= 0.1; u -= 0.02) {
    const totalUAValue = (results.totalGlazingArea * u) +
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / inputs.roofRValue) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / inputs.opaqueWallRValue);
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    const energySaved = ((maxGlazingHeatLoss2 - envelopeHeatLoss) / maxGlazingHeatLoss2 * 100);
    
    glazingUValueAnalysisData2.push({
      uValue: parseFloat(u.toFixed(2)),
      heatLoss: envelopeHeatLoss,
      energySaved: energySaved
    });
  }

  // Roof R-value analysis (R-10 to R-80, increment 10)
  const roofRValueAnalysisData = [];
  let maxRoofHeatLoss = 0;

  // First pass to find the maximum heat loss
  for (let r = 10; r <= 80; r += 10) {
    const totalUAValue = (results.totalGlazingArea / inputs.glazingRValue) +
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / r) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / inputs.opaqueWallRValue);
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    maxRoofHeatLoss = Math.max(maxRoofHeatLoss, envelopeHeatLoss);
  }

  // Second pass to calculate energy saved compared to maximum
  for (let r = 10; r <= 80; r += 10) {
    const totalUAValue = (results.totalGlazingArea / inputs.glazingRValue) +
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / r) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / inputs.opaqueWallRValue);
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    const energySaved = ((maxRoofHeatLoss - envelopeHeatLoss) / maxRoofHeatLoss * 100);
    
    roofRValueAnalysisData.push({
      rValue: r,
      heatLoss: envelopeHeatLoss,
      energySaved: energySaved
    });
  }

  const chartConfig = {
    value: { label: "Value", color: "#000000" },
    area: { label: "Area", color: "#000000" },
    heatLoss: { label: "Heat Loss", color: "#156082" },
    energySaved: { label: "Energy Saved %", color: "#e97132" },
  };

  // Get building comparison data
  const buildingComparisonData = inputs.buildingColumns?.map((building, index) => ({
    name: building.name,
    totalEnergy: 100000 + (index * 50000), // Placeholder calculation
    heatLoss: 50000 + (index * 20000),
    heatGain: 30000 + (index * 15000),
    color: `hsl(${index * 60}, 70%, 50%)`
  })) || [];

  return (
    <div className="space-y-8">
      {/* Building Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Building Comparison Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {inputs.buildingColumns?.map((building) => (
              <Button
                key={building.name}
                variant={selectedBuildings.includes(building.name) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleBuildingSelection(building.name)}
              >
                {building.name}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowComparison(!showComparison)}
            className="mr-2"
          >
            {showComparison ? "Hide" : "Show"} Comparison View
          </Button>
        </CardContent>
      </Card>

      {/* Building Comparison Chart */}
      {showComparison && buildingComparisonData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Building Energy Comparison</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadChart('building-comparison-chart', 'building-comparison')}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV(buildingComparisonData, 'building-comparison-data')}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingComparisonData} id="building-comparison-chart">
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload[0]) {
                        return (
                          <div className="bg-white p-2 border rounded shadow">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm">Energy: {payload[0].value?.toLocaleString()} Btu/year</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="totalEnergy">
                    {buildingComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Individual Building Charts */}
      {inputs.buildingColumns?.map((building, buildingIndex) => {
        const isSelected = selectedBuildings.length === 0 || selectedBuildings.includes(building.name);
        if (!isSelected) return null;

        const buildingElementsData = building.elements?.map((element, index) => ({
          name: element.name,
          area: element.area || 0,
          category: element.category,
          value: element.rValue || element.uValue || element.fFactor || element.cFactor || 0,
          color: `hsl(${index * 45}, 60%, 50%)`
        })) || [];

        return (
          <div key={buildingIndex} className="space-y-6">
            <h3 className="text-xl font-semibold border-b pb-2">{building.name} - Detailed Analysis</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Building Elements Chart */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Building Elements - {building.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadChart(`building-elements-${buildingIndex}`, `${building.name}-elements`)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCSV(buildingElementsData, `${building.name}-elements-data`)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={buildingElementsData} id={`building-elements-${buildingIndex}`}>
                        <XAxis 
                          dataKey="name" 
                          fontSize={12} 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <ChartTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border rounded shadow">
                                  <p className="font-medium">{label}</p>
                                  <p className="text-sm">Area: {data.area} ft²</p>
                                  <p className="text-sm">Category: {data.category}</p>
                                  <p className="text-sm">Value: {data.value}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="area">
                          {buildingElementsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Element Categories Distribution */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Element Categories - {building.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadChart(`categories-${buildingIndex}`, `${building.name}-categories`)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart id={`categories-${buildingIndex}`}>
                        <Pie
                          data={buildingElementsData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="area"
                        >
                          {buildingElementsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border rounded shadow">
                                  <p className="font-medium">{data.name}</p>
                                  <p className="text-sm">Area: {data.area} ft²</p>
                                  <p className="text-sm">Category: {data.category}</p>
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
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Heat Gains and Losses Components (Btu/year)</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadChart('heat-components-chart', 'heat-components')}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(heatComponentsData, 'heat-components-data')}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatComponentsData} id="heat-components-chart">
                <XAxis 
                  dataKey="name" 
                  fontSize={12} 
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                <Bar dataKey="value">
                  {heatComponentsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.type === 'gain' ? '#666666' : '#000000'} />
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadChart('energy-comparison-chart', 'energy-comparison')}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(energyComparisonData, 'energy-comparison-data')}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadChart('glazing-chart', 'glazing-distribution')}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(glazingData, 'glazing-distribution-data')}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadChart('envelope-chart', 'envelope-components')}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(envelopeComponentsData, 'envelope-components-data')}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart id="envelope-chart">
                <Pie
                  data={envelopeComponentsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="area"
                  label={({ name, area }) => `${name}: ${area} ft²`}
                >
                  {envelopeComponentsData.map((entry, index) => (
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
                          <p className="text-sm">Area: {data.area} ft²</p>
                          <p className="text-sm">R-Value: {data.rValue} ft²·°F·h/Btu</p>
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
          <CardTitle>Opaque Wall R-Value Analysis</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadChart('wall-rvalue-chart', 'wall-rvalue-analysis')}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(rValueAnalysisData, 'wall-rvalue-analysis-data')}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Glazing U-Value Analysis</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadChart('glazing-uvalue-analysis-chart', 'glazing-uvalue-analysis')}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(glazingUValueAnalysisData, 'glazing-uvalue-analysis-data')}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={glazingUValueAnalysisData} id="glazing-uvalue-analysis-chart">
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
                  fill="#156082"
                  name="Heat Loss"
                  barSize={10}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="energySaved" 
                  stroke="#e97132" 
                  strokeWidth={2}
                  dot={{ fill: '#e97132', strokeWidth: 1, r: 2 }}
                  name="Energy Saved %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default CalculatorChartsComponent;
