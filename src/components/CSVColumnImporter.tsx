
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Database } from 'lucide-react';

interface Props {
  columnId: string;
  onDataImported: (columnId: string, buildingData: any) => void;
}

const CSVColumnImporter = ({ columnId, onDataImported }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');

  const parseCSVData = (csvContent: string): any => {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      const data: any = {};
      
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
          }
        }
      });

      // Map CSV data to building structure
      const buildingData = {
        glazingElements: [{
          id: Date.now().toString(),
          name: 'Imported Glazing',
          northArea: data['Glazing 1_North Area (Agn)'] || 0,
          southArea: data['Glazing 1_South Area (Ags)'] || 0,
          eastArea: data['Glazing 1_East Area (Age)'] || 0,
          westArea: data['Glazing 1_West Area (Agw)'] || 0,
          perimeter: data['Glazing 1_Perimeter (Lg)'] || 0,
          uValue: data['Glazing 1_U-Value (Ug)'] || 0.3,
          shgc: data['Glazing 1_SHGC'] || 0
        }],
        buildingElements: [
          { id: '1', name: 'Soffit', area: data['Element 1_Area (A)'] || 0, rValue: data['Element 1_R-Value (R)'] || 0 },
          { id: '2', name: 'Basement Walls', area: data['Element 2_Area (A)'] || 0, rValue: data['Element 2_R-Value (R)'] || 0 },
          { id: '3', name: 'Roof', area: data['Element 3_Area (A)'] || 0, rValue: data['Element 3_R-Value (R)'] || 0 },
          { id: '4', name: 'Floor', area: data['Element 4_Area (A)'] || 0, rValue: data['Element 4_R-Value (R)'] || 0 },
          { id: '5', name: 'Opaque Walls', area: data['Element 5_Area (A)'] || 0, rValue: data['Element 5_R-Value (R)'] || 0 }
        ].filter(el => el.area > 0 || el.rValue > 0) // Only include elements with data
      };

      return buildingData;
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
        console.log('CSV data loaded for column:', columnId, parsedData);
      } else {
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFillInputs = () => {
    if (csvData) {
      onDataImported(columnId, csvData);
      alert(`CSV data imported successfully for ${columnId}!`);
      setCsvData(null);
      setFileName('');
    }
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          size="sm"
          variant="outline"
          className="flex-1 flex items-center gap-2"
        >
          <Upload className="h-3 w-3" />
          Import CSV
        </Button>
        {csvData && (
          <Button
            onClick={handleFillInputs}
            size="sm"
            className="flex items-center gap-2"
          >
            <Database className="h-3 w-3" />
            Fill
          </Button>
        )}
      </div>
      {fileName && (
        <div className="text-xs text-muted-foreground">
          Loaded: {fileName}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default CSVColumnImporter;
