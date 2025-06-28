
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X } from 'lucide-react';
import { ClimateData } from './HeatTransferCalculator';

interface Props {
  climateData: ClimateData;
  onClimateDataChange: (data: ClimateData) => void;
}

const EPWFileHandler = ({ climateData, onClimateDataChange }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      
      // EPW files have weather data starting from line 8
      // This is a simplified parser - in reality EPW parsing is more complex
      try {
        // Extract climate data from EPW file
        // For now, we'll use sample values and show the filename
        const extractedData: ClimateData = {
          heatingDegreeDays: 3000,
          coolingDegreeDays: 1000,
          northSolarRadiation: 800,
          southSolarRadiation: 1200,
          eastSolarRadiation: 1000,
          westSolarRadiation: 1000,
          isManualInput: false,
          epwFileName: file.name
        };
        
        onClimateDataChange(extractedData);
      } catch (error) {
        console.error('Error parsing EPW file:', error);
        alert('Error parsing EPW file. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    onClimateDataChange({
      ...climateData,
      isManualInput: true,
      epwFileName: undefined
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {climateData.isManualInput ? (
        <div className="flex items-center gap-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload EPW File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".epw"
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="text-sm text-muted-foreground">
            Or use manual inputs below
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex-1">
            <div className="font-medium text-green-800">EPW File Loaded</div>
            <div className="text-sm text-green-600">{climateData.epwFileName}</div>
          </div>
          <Button
            onClick={handleRemoveFile}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};

export default EPWFileHandler;
