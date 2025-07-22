import React from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

const CLIMATE_MAP = {
  "Heating Degree Days (Th)": "heatingDegreeDays",
  "Cooling Degree Days (Tc)": "coolingDegreeDays",
  "North Solar Radiation (Edn)": "northSolarRadiation",
  "South Solar Radiation (Eds)": "southSolarRadiation",
  "West Solar Radiation (Edw)": "westSolarRadiation",
  "East Solar Radiation (Ede)": "eastSolarRadiation",
  "Air Flow Rate (CFM)": "airflowRate",
};

const GLAZING_MAP = {
  "Name": "name",
  "Perimeter (Lg)": "perimeter",
  "North Area (Agn)": "northArea",
  "South Area (Ags)": "southArea",
  "West Area (Agw)": "westArea",
  "East Area (Age)": "eastArea",
  "U-Value (Ug)": "uValue",
  "SHGC": "shgc",
};

const ELEMENT_MAP = {
  "Name": "name",
  "Area (A)": "area",
  "R-Value (R)": "rValue",
  "F-Factor (F)": "fFactor",
  "Perimeter (Ls)": "perimeter",
  "C-Factor (C)": "cFactor",
};

// Parses a CSV in your provided format
function parseBuildingCSV(csvText) {
  const parsed = Papa.parse(csvText, { skipEmptyLines: true }).data;
  // Remove first 2 summary/header rows
  let rows = parsed.slice(2);

  let climateData = {};
  let buildings = [];
  let section = '';
  let currentBuilding = null;
  let currentGlazing = null;
  let currentElement = null;

  for (const row of rows) {
    let [category, param, val] = row.map(x => (x || '').trim());
    // Section identification
    if (category.toLowerCase().startsWith('climate data')) {
      section = 'climate';
      continue;
    }
    if (category.match(/^Building \d+/)) {
      section = 'building';
      currentBuilding = {
        id: `${category.replace(/\s+/g,"_")}-${Math.random()}`,
        name: category,
        building: { glazingElements: [], buildingElements: [] }
      };
      buildings.push(currentBuilding);
      currentGlazing = null;
      currentElement = null;
      continue;
    }
    if (category.match(/^Building Glazing \d+/)) {
      section = 'glazing';
      currentGlazing = { id: `${category.replace(/\s+/g,"_")}-${Math.random()}` };
      currentBuilding?.building.glazingElements.push(currentGlazing);
      continue;
    }
    if (category.match(/^Building Element \d+/)) {
      section = 'element';
      currentElement = { id: `${category.replace(/\s+/g,"_")}-${Math.random()}` };
      currentBuilding?.building.buildingElements.push(currentElement);
      continue;
    }
    // Values parsing
    if (section === 'climate' && CLIMATE_MAP[param]) {
      climateData[CLIMATE_MAP[param]] = parseFloat(val) || 0;
      continue;
    }
    if (section === 'glazing' && GLAZING_MAP[param] && currentGlazing) {
      currentGlazing[GLAZING_MAP[param]] = isNaN(parseFloat(val)) ? val : parseFloat(val);
      continue;
    }
    if (section === 'element' && ELEMENT_MAP[param] && currentElement) {
      currentElement[ELEMENT_MAP[param]] = isNaN(parseFloat(val)) ? val : parseFloat(val);
      continue;
    }
  }
  // Patch legacy fields for your state shape
  return {
    climateData,
    airflowRate: climateData.airflowRate || 0,
    buildingColumns: buildings
  }
}

// Component: Place this anywhere you want users to import data
export default function CSVImport({ setInputs }) {
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const imported = parseBuildingCSV(evt.target.result);
      setInputs(prev => ({
        ...prev,
        ...imported,
        // For apps using climate fields outside .climateData:
        ...(imported.climateData ? {
          heatingDegreeDays: imported.climateData.heatingDegreeDays,
          coolingDegreeDays: imported.climateData.coolingDegreeDays,
          northSolarRadiation: imported.climateData.northSolarRadiation,
          southSolarRadiation: imported.climateData.southSolarRadiation,
          eastSolarRadiation: imported.climateData.eastSolarRadiation,
          westSolarRadiation: imported.climateData.westSolarRadiation,
          airflowRate: imported.climateData.airflowRate
        } : {}),
      }));
      alert("Building data imported!");
    };
    reader.readAsText(file);
  }

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Import Building Data (.csv)</CardTitle>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          accept=".csv"
          onChange={handleImport}
          className="mb-2"
        />
        <p className="text-xs text-muted-foreground">
          Upload a CSV using your spreadsheet template to instantly fill in all building and climate data.
        </p>
      </CardContent>
    </Card>
  )
}
