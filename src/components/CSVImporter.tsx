import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculatorInputs, BuildingElementCategory } from './HeatTransferCalculator';

interface Props {
  onDataImported: (data: CalculatorInputs) => void;
}

const CSVImporter = ({ onDataImported }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<CalculatorInputs | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const parseCSVData = (csvContent: string): CalculatorInputs | null => {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      const data: any = {};
      
      // Parse CSV structure: Building names, then categories (Glazing, Element), then data
      let currentBuilding = '';
      let currentCategory = '';
      const buildings: { [key: string]: any } = {};
      
      lines.forEach(line => {
        const parts = line.split(',').map(part => part.replace(/"/g, '').trim());
        
        // Skip empty lines or lines with less than 2 parts
        if (parts.length < 2) return;
        
        const firstCol = parts[0];
        const secondCol = parts[1];
        const thirdCol = parts[2] || '';
        
        // Check if this is a building name (first column has content, second is empty or category)
        if (firstCol && (!secondCol || secondCol === 'Glazing' || secondCol === 'Element' || secondCol === 'Above Grade Element' || secondCol === 'On/Sub-grade Slab' || secondCol === 'Basement Walls')) {
          if (!secondCol) {
            // This is a building name
            currentBuilding = firstCol;
            buildings[currentBuilding] = { glazing: [], elements: [] };
            return;
          } else {
            // This is a category under the current building
            currentCategory = secondCol;
            return;
          }
        }
        
        // Check for climate data
        if (firstCol === 'Climate Data' && secondCol && thirdCol) {
          const key = `${firstCol}_${secondCol}`;
          const numValue = parseFloat(thirdCol);
          data[key] = isNaN(numValue) ? thirdCol : numValue;
          return;
        }
        
        // Parse building data
        if (currentBuilding && currentCategory && secondCol && thirdCol) {
          const key = `${currentBuilding} ${currentCategory}_${secondCol}`;
          const numValue = parseFloat(thirdCol);
          data[key] = isNaN(numValue) ? thirdCol : numValue;
        }
      });

      console.log('Parsed CSV data:', data);
      console.log('Buildings found:', Object.keys(buildings));

      // Build calculator inputs from parsed data
      const buildingColumns = Object.keys(buildings).map((buildingName, index) => {
        const glazingElements = [{
          id: Date.now().toString() + index,
          name: `${buildingName} Glazing`,
          northArea: data[`${buildingName} Glazing_North Area (Agn)`] || 0,
          southArea: data[`${buildingName} Glazing_South Area (Ags)`] || 0,
          eastArea: data[`${buildingName} Glazing_East Area (Age)`] || 0,
          westArea: data[`${buildingName} Glazing_West Area (Agw)`] || 0,
          perimeter: data[`${buildingName} Glazing_Perimeter (Lg)`] || 0,
          uValue: data[`${buildingName} Glazing_U-Value (Ug)`] || 0.3,
          shgc: data[`${buildingName} Glazing_SHGC`] || 0
        }];

        const buildingElements: any[] = [];
        
        // Parse different types of building elements based on their category
        Object.keys(data).forEach(key => {
          if (key.startsWith(`${buildingName} Above Grade Element`)) {
            const match = key.match(/_(.+)$/);
            if (match && (match[1].includes('Area') || match[1].includes('R-Value'))) {
              const elementKey = key.replace(/_(.+)$/, '');
              const existing = buildingElements.find(el => el.key === elementKey);
              if (!existing) {
                buildingElements.push({
                  id: Date.now().toString() + Math.random(),
                  name: `Above Grade Element`,
                  category: 'Above Grade Element' as BuildingElementCategory,
                  area: data[`${elementKey}_Area (A)`] || 0,
                  rValue: data[`${elementKey}_R-Value (R)`] || 0,
                  key: elementKey
                });
              }
            }
          }
          
          if (key.startsWith(`${buildingName} On/Sub-grade Slab`)) {
            const match = key.match(/_(.+)$/);
            if (match && (match[1].includes('F-Factor') || match[1].includes('Perimeter'))) {
              const elementKey = key.replace(/_(.+)$/, '');
              const existing = buildingElements.find(el => el.key === elementKey);
              if (!existing) {
                buildingElements.push({
                  id: Date.now().toString() + Math.random(),
                  name: `Slab`,
                  category: 'On/Sub-grade Slab' as BuildingElementCategory,
                  area: 0, // Not used for slabs
                  fFactor: data[`${elementKey}_F-Factor (F)`] || 0,
                  perimeter: data[`${elementKey}_Perimeter (Ls)`] || 0,
                  key: elementKey
                });
              }
            }
          }
          
          if (key.startsWith(`${buildingName} Basement Walls`)) {
            const match = key.match(/_(.+)$/);
            if (match && (match[1].includes('Area') || match[1].includes('C-Factor'))) {
              const elementKey = key.replace(/_(.+)$/, '');
              const existing = buildingElements.find(el => el.key === elementKey);
              if (!existing) {
                buildingElements.push({
                  id: Date.now().toString() + Math.random(),
                  name: `Basement Wall`,
                  category: 'Basement Walls' as BuildingElementCategory,
                  area: data[`${elementKey}_Area (A)`] || 0,
                  cFactor: data[`${elementKey}_C-Factor (C)`] || 0,
                  key: elementKey
                });
              }
            }
          }
        });

        // Remove the temporary key property
        buildingElements.forEach(el => delete el.key);

        return {
          id: buildingName.toLowerCase().replace(/\s+/g, '_'),
          name: buildingName,
          building: {
            glazingElements,
            buildingElements
          }
        };
      });

      const calculatorInputs: CalculatorInputs = {
        climateData: {
          heatingDegreeDays: data['Climate Data_Heating Degree Days (Th)'] || 0,
          coolingDegreeDays: data['Climate Data_Cooling Degree Days (Tc)'] || 0,
          northSolarRadiation: data['Climate Data_North Solar Radiation (Edn)'] || 0,
          southSolarRadiation: data['Climate Data_South Solar Radiation (Eds)'] || 0,
          eastSolarRadiation: data['Climate Data_East Solar Radiation (Ede)'] || 0,
          westSolarRadiation: data['Climate Data_West Solar Radiation (Edw)'] || 0,
          isManualInput: true,
        },
        currentEnergyLoad: 0,
        airflowRate: data['Airflow Rate'] || 0.01,
        buildingColumns,
        // Legacy fields for backward compatibility
        currentBuilding: buildingColumns[0]?.building || {
          glazingElements: [],
          buildingElements: []
        },
        proposedBuilding: buildingColumns[1]?.building || {
          glazingElements: [],
          buildingElements: []
        },
        heatingDegreeDays: data['Climate Data_Heating Degree Days (Th)'] || 0,
        coolingDegreeDays: data['Climate Data_Cooling Degree Days (Tc)'] || 0,
        northGlazingArea: buildingColumns[0]?.building.glazingElements[0]?.northArea || 0,
        southGlazingArea: buildingColumns[0]?.building.glazingElements[0]?.southArea || 0,
        eastGlazingArea: buildingColumns[0]?.building.glazingElements[0]?.eastArea || 0,
        westGlazingArea: buildingColumns[0]?.building.glazingElements[0]?.westArea || 0,
        northSolarRadiation: data['Climate Data_North Solar Radiation (Edn)'] || 0,
        southSolarRadiation: data['Climate Data_South Solar Radiation (Eds)'] || 0,
        eastSolarRadiation: data['Climate Data_East Solar Radiation (Ede)'] || 0,
        westSolarRadiation: data['Climate Data_West Solar Radiation (Edw)'] || 0,
        glazingPerimeter: buildingColumns[0]?.building.glazingElements[0]?.perimeter || 0,
        glazingRValue: buildingColumns[0]?.building.glazingElements[0]?.uValue ? 1 / buildingColumns[0].building.glazingElements[0].uValue : 3.0,
        solarHeatGainCoeff: buildingColumns[0]?.building.glazingElements[0]?.shgc || 0,
        soffitArea: 0,
        soffitRValue: 0,
        basementArea: 0,
        basementRValue: 0,
        roofArea: 0,
        roofRValue: 0,
        floorArea: 0,
        floorRValue: 0,
        opaqueWallArea: 0,
        opaqueWallRValue: 0,
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
        setCsvData(parsedData);
        setFileName(file.name);
        console.log('CSV data loaded successfully:', parsedData);
      } else {
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };

  const handleFillInputs = () => {
    if (csvData) {
      onDataImported(csvData);
      alert('CSV data imported successfully!');
      setCsvData(null);
      setFileName('');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Import CSV Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Select CSV File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          {fileName && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                File loaded: {fileName}
              </span>
              <Button
                onClick={handleFillInputs}
                className="flex items-center gap-2"
                disabled={!csvData}
              >
                <Database className="h-4 w-4" />
                Fill Inputs
              </Button>
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            Import a CSV file with building data, categories, and climate information
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVImporter;