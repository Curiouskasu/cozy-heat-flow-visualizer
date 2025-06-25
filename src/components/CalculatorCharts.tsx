
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { CalculatorInputs, CalculatorResults } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

const CalculatorChartsComponent = ({ inputs, results }: Props) => {
  const heatFlowData = [
    { name: 'Envelope Heat Loss', value: results.envelopeHeatLoss, color: '#ef4444' },
    { name: 'Envelope Heat Gain', value: results.envelopeHeatGain, color: '#f97316' },
    { name: 'Infiltration Heat Loss', value: results.infiltrationHeatLoss, color: '#3b82f6' },
    { name: 'Infiltration Heat Gain', value: results.infiltrationHeatGain, color: '#06b6d4' },
    { name: 'Solar Heat Gain', value: results.solarHeatGain, color: '#eab308' },
  ];

  const glazingData = [
    { name: 'North', area: inputs.northGlazingArea, radiation: inputs.northSolarRadiation, color: '#8b5cf6' },
    { name: 'South', area: inputs.southGlazingArea, radiation: inputs.southSolarRadiation, color: '#f59e0b' },
    { name: 'East', area: inputs.eastGlazingArea, radiation: inputs.eastSolarRadiation, color: '#10b981' },
    { name: 'West', area: inputs.westGlazingArea, radiation: inputs.westSolarRadiation, color: '#ef4444' },
  ];

  const envelopeComponentsData = [
    { name: 'Glazing', area: results.totalGlazingArea, rValue: inputs.glazingRValue },
    { name: 'Soffit', area: inputs.soffitArea, rValue: inputs.soffitRValue },
    { name: 'Basement', area: inputs.basementArea, rValue: inputs.basementRValue },
    { name: 'Roof', area: inputs.roofArea, rValue: inputs.roofRValue },
    { name: 'Floor', area: inputs.floorArea, rValue: inputs.floorRValue },
    { name: 'Opaque Walls', area: inputs.opaqueWallArea, rValue: inputs.opaqueWallRValue },
  ];

  const chartConfig = {
    value: { label: "Value", color: "hsl(var(--chart-1))" },
    area: { label: "Area", color: "hsl(var(--chart-2))" },
    radiation: { label: "Solar Radiation", color: "hsl(var(--chart-3))" },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Heat Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatFlowData}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Glazing Area Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solar Radiation by Orientation</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={glazingData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="radiation" fill="var(--color-radiation)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Building Envelope Components</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={envelopeComponentsData}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
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
