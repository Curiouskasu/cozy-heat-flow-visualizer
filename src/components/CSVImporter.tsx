
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculatorInputs } from './HeatTransferCalculator';

interface Props {
  onDataImported: (data: CalculatorInputs) => void;
}

const CSVImporter = ({ onDataImported }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSVData = (csvContent: string): CalculatorInputs | null => {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      const data: any = {};
      
      // Parse key-value pairs from CSV
      lines.forEach(line => {
        const [key, value] = line.split(',').map(item => item.trim().replace(/"/g, ''));
        if (key && value !== undefined) {
          // Convert numeric values
          const numValue = parseFloat(value);
          data[key] = isNaN(numValue) ? value : numValue;
        }
      });

      // Map CSV data to CalculatorInputs structure
      const calculatorInputs: CalculatorInputs = {
        climateData: {
          heatingDegreeDays: data['Heating Degree Days'] || 3000,
          coolingDegreeDays: data['Cooling Degree Days'] || 1000,
          northSolarRadiation: data['North Solar Radiation'] || 800,
          southSolarRadiation: data['South Solar Radiation'] || 1200,
          eastSolarRadiation: data['East Solar Radiation'] || 1000,
          westSolarRadiation: data['West Solar Radiation'] || 1000,
          isManualInput: true,
        },
        currentBuilding: {
          glazingElements: [{
            id: '1',
            name: 'Current Glazing',
            northArea: data['Current North Glazing Area'] || 50,
            southArea: data['Current South Glazing Area'] || 80,
            eastArea: data['Current East Glazing Area'] || 60,
            westArea: data['Current West Glazing Area'] || 60,
            perimeter: data['Current Glazing Perimeter'] || 200,
            rValue: data['Current Glazing R-Value'] || 3.0,
            shgc: data['Current Solar Heat Gain Coefficient'] || 0.4
          }],
          buildingElements: [
            { id: '1', name: 'Soffit', area: data['Current Soffit Area'] || 100, rValue: data['Current Soffit R-Value'] || 20 },
            { id: '2', name: 'Basement Walls', area: data['Current Basement Area'] || 150, rValue: data['Current Basement R-Value'] || 10 },
            { id: '3', name: 'Roof', area: data['Current Roof Area'] || 200, rValue: data['Current Roof R-Value'] || 30 },
            { id: '4', name: 'Floor', area: data['Current Floor Area'] || 180, rValue: data['Current Floor R-Value'] || 15 },
            { id: '5', name: 'Opaque Walls', area: data['Current Opaque Wall Area'] || 300, rValue: data['Current Opaque Wall R-Value'] || 12 }
          ]
        },
        proposedBuilding: {
          glazingElements: [{
            id: '1',
            name: 'Proposed Glazing',
            northArea: data['Proposed North Glazing Area'] || 50,
            southArea: data['Proposed South Glazing Area'] || 80,
            eastArea: data['Proposed East Glazing Area'] || 60,
            westArea: data['Proposed West Glazing Area'] || 60,
            perimeter: data['Proposed Glazing Perimeter'] || 200,
            rValue: data['Proposed Glazing R-Value'] || 5.0,
            shgc: data['Proposed Solar Heat Gain Coefficient'] || 0.3
          }],
          buildingElements: [
            { id: '1', name: 'Soffit', area: data['Proposed Soffit Area'] || 100, rValue: data['Proposed Soffit R-Value'] || 30 },
            { id: '2', name: 'Basement Walls', area: data['Proposed Basement Area'] || 150, rValue: data['Proposed Basement R-Value'] || 15 },
            { id: '3', name: 'Roof', area: data['Proposed Roof Area'] || 200, rValue: data['Proposed Roof R-Value'] || 40 },
            { id: '4', name: 'Floor', area: data['Proposed Floor Area'] || 180, rValue: data['Proposed Floor R-Value'] || 20 },
            { id: '5', name: 'Opaque Walls', area: data['Proposed Opaque Wall Area'] || 300, rValue: data['Proposed Opaque Wall R-Value'] || 20 }
          ]
        },
        // Legacy fields for backward compatibility
        heatingDegreeDays: data['Heating Degree Days'] || 3000,
        coolingDegreeDays: data['Cooling Degree Days'] || 1000,
        currentEnergyLoad: data['Current Building Energy'] || 50000000,
        northGlazingArea: data['Current North Glazing Area'] || 50,
        southGlazingArea: data['Current South Glazing Area'] || 80,
        eastGlazingArea: data['Current East Glazing Area'] || 60,
        westGlazingArea: data['Current West Glazing Area'] || 60,
        northSolarRadiation: data['North Solar Radiation'] || 800,
        southSolarRadiation: data['South Solar Radiation'] || 1200,
        eastSolarRadiation: data['East Solar Radiation'] || 1000,
        westSolarRadiation: data['West Solar Radiation'] || 1000,
        glazingPerimeter: data['Current Glazing Perimeter'] || 200,
        glazingRValue: data['Current Glazing R-Value'] || 3.0,
        solarHeatGainCoeff: data['Current Solar Heat Gain Coefficient'] || 0.4,
        soffitArea: data['Current Soffit Area'] || 100,
        soffitRValue: data['Current Soffit R-Value'] || 20,
        basementArea: data['Current Basement Area'] || 150,
        basementRValue: data['Current Basement R-Value'] || 10,
        roofArea: data['Current Roof Area'] || 200,
        roofRValue: data['Current Roof R-Value'] || 30,
        floorArea: data['Current Floor Area'] || 180,
        floorRValue: data['Current Floor R-Value'] || 15,
        opaqueWallArea: data['Current Opaque Wall Area'] || 300,
        opaqueWallRValue: data['Current Opaque Wall R-Value'] || 12,
      };

      return calculatorInputs;
    } catch (error) {
      console.error('Error parsing CSV:', error);
      return null;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsedData = parseCSVData(content);
      
      if (parsedData) {
        onDataImported(parsedData);
        alert('CSV data imported successfully!');
      } else {
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Import CSV Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import CSV File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="text-sm text-muted-foreground">
            Import a CSV file in the same format as the exported data
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVImporter;
