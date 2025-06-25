
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalculatorInputs } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputs;
  setInputs: React.Dispatch<React.SetStateAction<CalculatorInputs>>;
}

const CalculatorInputsComponent = ({ inputs, setInputs }: Props) => {
  const updateInput = (field: keyof CalculatorInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const InputField = ({ 
    label, 
    field, 
    unit = "",
    step = "0.1" 
  }: { 
    label: string; 
    field: keyof CalculatorInputs; 
    unit?: string;
    step?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label} {unit && `(${unit})`}</Label>
      <Input
        id={field}
        type="number"
        step={step}
        value={inputs[field]}
        onChange={(e) => updateInput(field, parseFloat(e.target.value) || 0)}
        className="w-full"
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Climate Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField label="Heating Degree Days" field="heatingDegreeDays" unit="°F-days" step="1" />
          <InputField label="Cooling Degree Days" field="coolingDegreeDays" unit="°F-days" step="1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Glazing Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField label="North Glazing Area" field="northGlazingArea" unit="ft²" />
          <InputField label="South Glazing Area" field="southGlazingArea" unit="ft²" />
          <InputField label="East Glazing Area" field="eastGlazingArea" unit="ft²" />
          <InputField label="West Glazing Area" field="westGlazingArea" unit="ft²" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solar Radiation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField label="North Solar Radiation" field="northSolarRadiation" unit="Btu/ft²" />
          <InputField label="South Solar Radiation" field="southSolarRadiation" unit="Btu/ft²" />
          <InputField label="East Solar Radiation" field="eastSolarRadiation" unit="Btu/ft²" />
          <InputField label="West Solar Radiation" field="westSolarRadiation" unit="Btu/ft²" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Glazing Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField label="Glazing Perimeter" field="glazingPerimeter" unit="ft" />
          <InputField label="Glazing R-Value" field="glazingRValue" unit="ft²·°F·h/Btu" />
          <InputField label="Solar Heat Gain Coefficient" field="solarHeatGainCoeff" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Building Envelope - Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField label="Soffit Area" field="soffitArea" unit="ft²" />
          <InputField label="Basement Walls Area" field="basementArea" unit="ft²" />
          <InputField label="Roof Area" field="roofArea" unit="ft²" />
          <InputField label="Floor Area" field="floorArea" unit="ft²" />
          <InputField label="Opaque Walls Area" field="opaqueWallArea" unit="ft²" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Building Envelope - R-Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField label="Soffit R-Value" field="soffitRValue" unit="ft²·°F·h/Btu" />
          <InputField label="Basement R-Value" field="basementRValue" unit="ft²·°F·h/Btu" />
          <InputField label="Roof R-Value" field="roofRValue" unit="ft²·°F·h/Btu" />
          <InputField label="Floor R-Value" field="floorRValue" unit="ft²·°F·h/Btu" />
          <InputField label="Opaque Wall R-Value" field="opaqueWallRValue" unit="ft²·°F·h/Btu" />
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorInputsComponent;
