import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculatorInputs } from './HeatTransferCalculator';

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
      const buildingData: any = {};
      
      // Parse CSV data into key-value pairs
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const category = parts[0].replace(/"/g, '').trim();
          const parameter = parts[1].replace(/"/g, '').trim();
          const value = parts[2].replace(/"/g, '').trim();
          
          if (parameter && value !== '') {
            const key = `${category}_${parameter}`;
            const numValue = parseFloat(value);
            data[key] = isNaN(numValue) ? value : numValue;
            
            // Track building categories for dynamic building creation
            if (category.includes('Building') && !category.includes('Climate') && !category.includes('Airflow')) {
              if (!buildingData[category]) {
                buildingData[category] = {};
              }
              buildingData[category][parameter] = isNaN(numValue) ? value : numValue;
            }
          }
        }
      });

      console.log('Parsed CSV data:', data);
      console.log('Building data:', buildingData);

      // Create dynamic building columns from CSV data
      const buildingColumns = Object.keys(buildingData).map((buildingName, index) => {
        const building = buildingData[buildingName];
        
        // Create glazing elements
        const glazingElements = [];
        let glazingIndex = 1;
        while (building[`Glazing ${glazingIndex}_North Area (Agn)`] !== undefined) {
          glazingElements.push({
            id: `glazing-${index}-${glazingIndex}`,
            name: `Glazing ${glazingIndex}`,
            northArea: building[`Glazing ${glazingIndex}_North Area (Agn)`] || 0,
            southArea: building[`Glazing ${glazingIndex}_South Area (Ags)`] || 0,
            eastArea: building[`Glazing ${glazingIndex}_East Area (Age)`] || 0,
            westArea: building[`Glazing ${glazingIndex}_West Area (Agw)`] || 0,
            perimeter: building[`Glazing ${glazingIndex}_Perimeter (Lg)`] || 0,
            uValue: building[`Glazing ${glazingIndex}_U-Value (Ug)`] || 0.3,
            shgc: building[`Glazing ${glazingIndex}_SHGC`] || 0
          });
          glazingIndex++;
        }

        // Create building elements
        const buildingElements = [];
        let elementIndex = 1;
        while (building[`Element ${elementIndex}_Area (A)`] !== undefined) {
          buildingElements.push({
            id: `element-${index}-${elementIndex}`,
            name: building[`Element ${elementIndex}_Name`] || `Element ${elementIndex}`,
            area: building[`Element ${elementIndex}_Area (A)`] || 0,
            rValue: building[`Element ${elementIndex}_R-Value (R)`] || 0
          });
          elementIndex++;
        }

        return {
          id: `building-${index}`,
          name: buildingName.replace(' Building', '').replace('Building ', ''),
          building: {
            glazingElements,
            buildingElements
          }
        };
      });

      // Map CSV data to CalculatorInputs structure
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
        // Legacy fields for backward compatibility - use first building if available
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
        northGlazingArea: buildingColumns[0]?.building?.glazingElements[0]?.northArea || 0,
        southGlazingArea: buildingColumns[0]?.building?.glazingElements[0]?.southArea || 0,
        eastGlazingArea: buildingColumns[0]?.building?.glazingElements[0]?.eastArea || 0,
        westGlazingArea: buildingColumns[0]?.building?.glazingElements[0]?.westArea || 0,
        northSolarRadiation: data['Climate Data_North Solar Radiation (Edn)'] || 0,
        southSolarRadiation: data['Climate Data_South Solar Radiation (Eds)'] || 0,
        eastSolarRadiation: data['Climate Data_East Solar Radiation (Ede)'] || 0,
        westSolarRadiation: data['Climate Data_West Solar Radiation (Edw)'] || 0,
        glazingPerimeter: buildingColumns[0]?.building?.glazingElements[0]?.perimeter || 0,
        glazingRValue: buildingColumns[0]?.building?.glazingElements[0]?.uValue ? 1 / buildingColumns[0].building.glazingElements[0].uValue : 3.0,
        solarHeatGainCoeff: buildingColumns[0]?.building?.glazingElements[0]?.shgc || 0,
        soffitArea: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('soffit'))?.area || 0,
        soffitRValue: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('soffit'))?.rValue || 0,
        basementArea: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('basement'))?.area || 0,
        basementRValue: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('basement'))?.rValue || 0,
        roofArea: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('roof'))?.area || 0,
        roofRValue: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('roof'))?.rValue || 0,
        floorArea: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('floor'))?.area || 0,
        floorRValue: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('floor'))?.rValue || 0,
        opaqueWallArea: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('wall'))?.area || 0,
        opaqueWallRValue: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('wall'))?.rValue || 0,
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
      alert('CSV data imported successfully! All building data has been populated.');
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
                Fill All Inputs
              </Button>
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            Import a CSV file to populate all fields including building comparisons
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVImporter;
