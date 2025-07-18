import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Copy } from "lucide-react";
import { CalculatorInputs, GlazingElement, BuildingElement, ClimateData, BuildingColumn, BuildingElementCategory } from "./HeatTransferCalculator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EPWFileHandler from "./EPWFileHandler";
import DragDropList from "./DragDropList";

interface Props {
  inputs: CalculatorInputs;
  setInputs: React.Dispatch<React.SetStateAction<CalculatorInputs>>;
}

const InputField = ({ 
  label, 
  field, 
  unit = "",
  step = "0.1",
  value,
  onChange,
  disabled = false
}: { 
  label: string; 
  field: string; 
  unit?: string;
  step?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) => (
  <div className="space-y-2">
    <Label htmlFor={field} className="font-light">{label} {unit && `(${unit})`}</Label>
    <Input
      id={field}
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full font-light"
      disabled={disabled}
    />
  </div>
);

const SpreadsheetInputs = ({ inputs, setInputs }: Props) => {
  const updateClimateData = useCallback((climateData: ClimateData) => {
    setInputs(prev => ({ 
      ...prev, 
      climateData,
      // Update legacy fields for backward compatibility
      heatingDegreeDays: climateData.heatingDegreeDays,
      coolingDegreeDays: climateData.coolingDegreeDays,
      northSolarRadiation: climateData.northSolarRadiation,
      southSolarRadiation: climateData.southSolarRadiation,
      eastSolarRadiation: climateData.eastSolarRadiation,
      westSolarRadiation: climateData.westSolarRadiation,
    }));
  }, [setInputs]);

  const updateClimateField = useCallback((field: keyof ClimateData, value: number) => {
    setInputs(prev => ({
      ...prev,
      climateData: { ...prev.climateData, [field]: value },
      // Update legacy fields
      [field]: value
    }));
  }, [setInputs]);

  const updateAirflowRate = useCallback((value: number) => {
    setInputs(prev => ({
      ...prev,
      airflowRate: value
    }));
  }, [setInputs]);

  const addBuildingColumn = useCallback(() => {
    // Ensure buildingColumns is an array before accessing length
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    const newColumn: BuildingColumn = {
      id: Date.now().toString(),
      name: `Building ${buildingColumns.length + 1}`,
      building: {
        glazingElements: [
          {
            id: Date.now().toString(),
            name: "Glazing 1",
            northArea: 0,
            southArea: 0,
            eastArea: 0,
            westArea: 0,
            perimeter: 0,
            uValue: 0.3,
            shgc: 0
          }
        ],
        buildingElements: [
          {
            id: (Date.now() + 1).toString(),
            name: "Element 1",
            category: "Above Grade Element" as BuildingElementCategory,
            area: 0,
            rValue: 10
          }
        ]
      }
    };

    setInputs(prev => ({
      ...prev,
      buildingColumns: [...buildingColumns, newColumn]
    }));
  }, [inputs.buildingColumns, setInputs]);

  const duplicateBuildingColumn = useCallback((sourceColumnId: string) => {
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    const sourceColumn = buildingColumns.find(col => col.id === sourceColumnId);
    if (!sourceColumn) return;

    const newColumn: BuildingColumn = {
      id: Date.now().toString(),
      name: `${sourceColumn.name} Copy`,
      building: {
        glazingElements: Array.isArray(sourceColumn.building.glazingElements) 
          ? sourceColumn.building.glazingElements.map(glazing => ({
              ...glazing,
              id: (Date.now() + Math.random()).toString(),
              name: glazing.name
            }))
          : [],
        buildingElements: Array.isArray(sourceColumn.building.buildingElements)
          ? sourceColumn.building.buildingElements.map(element => ({
              ...element,
              id: (Date.now() + Math.random()).toString(),
              name: element.name
            }))
          : []
      }
    };

    setInputs(prev => ({
      ...prev,
      buildingColumns: [...buildingColumns, newColumn]
    }));
  }, [inputs.buildingColumns, setInputs]);

  const removeBuildingColumn = useCallback((columnId: string) => {
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    setInputs(prev => ({
      ...prev,
      buildingColumns: buildingColumns.filter(col => col.id !== columnId)
    }));
  }, [inputs.buildingColumns, setInputs]);

  const updateColumnName = useCallback((columnId: string, name: string) => {
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    setInputs(prev => ({
      ...prev,
      buildingColumns: buildingColumns.map(col =>
        col.id === columnId ? { ...col, name } : col
      )
    }));
  }, [inputs.buildingColumns, setInputs]);

  const updateColumnBuilding = useCallback((columnId: string, building: any) => {
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    setInputs(prev => ({
      ...prev,
      buildingColumns: buildingColumns.map(col =>
        col.id === columnId ? { ...col, building } : col
      ),
      // Update legacy fields if updating current or proposed
      ...(columnId === 'current' ? { currentBuilding: building } : {}),
      ...(columnId === 'proposed' ? { proposedBuilding: building } : {})
    }));
  }, [inputs.buildingColumns, setInputs]);

  const addGlazingElement = useCallback((columnId: string) => {
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    setInputs(prev => ({
      ...prev,
      buildingColumns: buildingColumns.map(col =>
        col.id === columnId
          ? {
              ...col,
              building: {
                ...col.building,
                glazingElements: [
                  ...(Array.isArray(col.building.glazingElements) ? col.building.glazingElements : []),
                  {
                    id: Date.now().toString(),
                    name: `Glazing ${(Array.isArray(col.building.glazingElements) ? col.building.glazingElements.length : 0) + 1}`,
                    northArea: 0,
                    southArea: 0,
                    eastArea: 0,
                    westArea: 0,
                    perimeter: 0,
                    uValue: 0.3,
                    shgc: 0
                  }
                ]
              }
            }
          : col
      )
    }));
  }, [inputs.buildingColumns, setInputs]);

  const removeGlazingElement = useCallback((columnId: string, elementId: string) => {
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    setInputs(prev => ({
      ...prev,
      buildingColumns: buildingColumns.map(col =>
        col.id === columnId
          ? {
              ...col,
              building: {
                ...col.building,
                glazingElements: Array.isArray(col.building.glazingElements) 
                  ? col.building.glazingElements.filter(el => el.id !== elementId)
                  : []
              }
            }
          : col
      )
    }));
  }, [inputs.buildingColumns, setInputs]);

  const updateGlazingElement = useCallback((columnId: string, elementId: string, field: keyof GlazingElement, value: any) => {
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    setInputs(prev => ({
      ...prev,
      buildingColumns: buildingColumns.map(col =>
        col.id === columnId
          ? {
              ...col,
              building: {
                ...col.building,
                glazingElements: Array.isArray(col.building.glazingElements)
                  ? col.building.glazingElements.map(el =>
                      el.id === elementId ? { ...el, [field]: value } : el
                    )
                  : []
              }
            }
          : col
      )
    }));
  }, [inputs.buildingColumns, setInputs]);

  const addBuildingElement = useCallback((columnId: string) => {
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    setInputs(prev => ({
      ...prev,
      buildingColumns: buildingColumns.map(col =>
        col.id === columnId
          ? {
              ...col,
              building: {
                ...col.building,
                buildingElements: [
                  ...(Array.isArray(col.building.buildingElements) ? col.building.buildingElements : []),
                  {
                    id: Date.now().toString(),
                    name: `Element ${(Array.isArray(col.building.buildingElements) ? col.building.buildingElements.length : 0) + 1}`,
                    category: "Above Grade Element" as BuildingElementCategory,
                    area: 0,
                    rValue: 10
                  }
                ]
              }
            }
          : col
      )
    }));
  }, [inputs.buildingColumns, setInputs]);

  const removeBuildingElement = useCallback((columnId: string, elementId: string) => {
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    setInputs(prev => ({
      ...prev,
      buildingColumns: buildingColumns.map(col =>
        col.id === columnId
          ? {
              ...col,
              building: {
                ...col.building,
                buildingElements: Array.isArray(col.building.buildingElements)
                  ? col.building.buildingElements.filter(el => el.id !== elementId)
                  : []
              }
            }
          : col
      )
    }));
  }, [inputs.buildingColumns, setInputs]);

  const updateBuildingElement = useCallback((columnId: string, elementId: string, field: keyof BuildingElement, value: any) => {
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    setInputs(prev => ({
      ...prev,
      buildingColumns: buildingColumns.map(col =>
        col.id === columnId
          ? {
              ...col,
              building: {
                ...col.building,
                buildingElements: Array.isArray(col.building.buildingElements)
                  ? col.building.buildingElements.map(el =>
                      el.id === elementId ? { ...el, [field]: value } : el
                    )
                  : []
              }
            }
          : col
      )
    }));
  }, [inputs.buildingColumns, setInputs]);

  const renderGlazingFields = (glazing: GlazingElement, columnId: string) => (
    <>
      <div className="grid grid-cols-2 gap-2">
        <InputField
          label="North Area"
          field={`northArea-${glazing.id}`}
          unit="ft²"
          value={glazing.northArea}
          onChange={(value) => updateGlazingElement(columnId, glazing.id, 'northArea', value)}
        />
        <InputField
          label="South Area"
          field={`southArea-${glazing.id}`}
          unit="ft²"
          value={glazing.southArea}
          onChange={(value) => updateGlazingElement(columnId, glazing.id, 'southArea', value)}
        />
        <InputField
          label="East Area"
          field={`eastArea-${glazing.id}`}
          unit="ft²"
          value={glazing.eastArea}
          onChange={(value) => updateGlazingElement(columnId, glazing.id, 'eastArea', value)}
        />
        <InputField
          label="West Area"
          field={`westArea-${glazing.id}`}
          unit="ft²"
          value={glazing.westArea}
          onChange={(value) => updateGlazingElement(columnId, glazing.id, 'westArea', value)}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <InputField
          label="Perimeter"
          field={`perimeter-${glazing.id}`}
          unit="ft"
          value={glazing.perimeter}
          onChange={(value) => updateGlazingElement(columnId, glazing.id, 'perimeter', value)}
        />
        <InputField
          label="U-Value"
          field={`uValue-${glazing.id}`}
          unit="Btu/ft²·°F·h"
          step="0.01"
          value={glazing.uValue}
          onChange={(value) => updateGlazingElement(columnId, glazing.id, 'uValue', value)}
        />
        <InputField
          label="SHGC"
          field={`shgc-${glazing.id}`}
          value={glazing.shgc}
          onChange={(value) => updateGlazingElement(columnId, glazing.id, 'shgc', value)}
        />
      </div>
    </>
  );

  const renderBuildingFields = (element: BuildingElement, columnId: string) => {
    const renderFieldsBasedOnCategory = () => {
      switch (element.category) {
        case 'Above Grade Element':
          return (
            <>
              <InputField
                label="Area"
                field={`area-${element.id}`}
                unit="ft²"
                value={element.area}
                onChange={(value) => updateBuildingElement(columnId, element.id, 'area', value)}
              />
              <InputField
                label="R-Value"
                field={`rValue-${element.id}`}
                unit="ft²·°F·h/Btu"
                value={element.rValue || 0}
                onChange={(value) => updateBuildingElement(columnId, element.id, 'rValue', value)}
              />
            </>
          );
        case 'On/Sub-grade Slab':
          return (
            <>
              <InputField
                label="F-Factor"
                field={`fFactor-${element.id}`}
                unit="Btu/h·ft·°F"
                value={element.fFactor || 0}
                onChange={(value) => updateBuildingElement(columnId, element.id, 'fFactor', value)}
              />
              <InputField
                label="Perimeter"
                field={`perimeter-${element.id}`}
                unit="ft"
                value={element.perimeter || 0}
                onChange={(value) => updateBuildingElement(columnId, element.id, 'perimeter', value)}
              />
            </>
          );
        case 'Basement Walls':
          return (
            <>
              <InputField
                label="Area"
                field={`area-${element.id}`}
                unit="ft²"
                value={element.area}
                onChange={(value) => updateBuildingElement(columnId, element.id, 'area', value)}
              />
              <InputField
                label="C-Factor"
                field={`cFactor-${element.id}`}
                unit="Btu/h·ft²·°F"
                value={element.cFactor || 0}
                onChange={(value) => updateBuildingElement(columnId, element.id, 'cFactor', value)}
              />
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`category-${element.id}`} className="font-light">Category</Label>
          <Select
            value={element.category}
            onValueChange={(value: BuildingElementCategory) => 
              updateBuildingElement(columnId, element.id, 'category', value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Above Grade Element">Above Grade Element</SelectItem>
              <SelectItem value="On/Sub-grade Slab">On/Sub-grade Slab</SelectItem>
              <SelectItem value="Basement Walls">Basement Walls</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderFieldsBasedOnCategory()}
        </div>
      </div>
    );
  };

  // Ensure buildingColumns is an array before rendering
  const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];

  return (
    <div className="space-y-6">
      {/* Climate Data & Airflow Rate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Climate Data & Airflow Rate (Shared)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label="Airflow Rate" 
              field="airflowRate" 
              unit="CFM" 
              step="0.01"
              value={inputs.airflowRate}
              onChange={updateAirflowRate}
            />
          </div>

          <EPWFileHandler 
            climateData={inputs.climateData}
            onClimateDataChange={updateClimateData}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label="Heating Degree Days (Th)" 
              field="heatingDegreeDays" 
              unit="°F-days" 
              step="1"
              value={inputs.climateData.heatingDegreeDays}
              onChange={(value) => updateClimateField('heatingDegreeDays', value)}
              disabled={!inputs.climateData.isManualInput}
            />
            <InputField 
              label="Cooling Degree Days (Tc)" 
              field="coolingDegreeDays" 
              unit="°F-days" 
              step="1"
              value={inputs.climateData.coolingDegreeDays}
              onChange={(value) => updateClimateField('coolingDegreeDays', value)}
              disabled={!inputs.climateData.isManualInput}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InputField 
              label="North Solar Radiation" 
              field="northSolarRadiation" 
              unit="Btu/ft²" 
              value={inputs.climateData.northSolarRadiation}
              onChange={(value) => updateClimateField('northSolarRadiation', value)}
              disabled={!inputs.climateData.isManualInput}
            />
            <InputField 
              label="South Solar Radiation" 
              field="southSolarRadiation" 
              unit="Btu/ft²" 
              value={inputs.climateData.southSolarRadiation}
              onChange={(value) => updateClimateField('southSolarRadiation', value)}
              disabled={!inputs.climateData.isManualInput}
            />
            <InputField 
              label="East Solar Radiation" 
              field="eastSolarRadiation" 
              unit="Btu/ft²" 
              value={inputs.climateData.eastSolarRadiation}
              onChange={(value) => updateClimateField('eastSolarRadiation', value)}
              disabled={!inputs.climateData.isManualInput}
            />
            <InputField 
              label="West Solar Radiation" 
              field="westSolarRadiation" 
              unit="Btu/ft²" 
              value={inputs.climateData.westSolarRadiation}
              onChange={(value) => updateClimateField('westSolarRadiation', value)}
              disabled={!inputs.climateData.isManualInput}
            />
          </div>
        </CardContent>
      </Card>

      {/* Buildings Spreadsheet */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-bold">Buildings Comparison</CardTitle>
          <Button
            onClick={addBuildingColumn}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Building
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {buildingColumns.map((column) => (
                <div key={column.id} className="flex-shrink-0 w-80 border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Input
                      value={column.name}
                      onChange={(e) => updateColumnName(column.id, e.target.value)}
                      className="font-bold"
                    />
                    <div className="flex gap-1 ml-2">
                      <Button
                        onClick={() => duplicateBuildingColumn(column.id)}
                        size="sm"
                        variant="ghost"
                        title="Duplicate building"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {buildingColumns.length > 1 && (
                        <Button
                          onClick={() => removeBuildingColumn(column.id)}
                          size="sm"
                          variant="ghost"
                          title="Remove building"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Glazing Elements */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold">Glazing</h4>
                      <Button
                        onClick={() => addGlazingElement(column.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {(Array.isArray(column.building.glazingElements) ? column.building.glazingElements : []).map((glazing) => (
                      <div key={glazing.id} className="border rounded p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            value={glazing.name}
                            onChange={(e) => updateGlazingElement(column.id, glazing.id, 'name', e.target.value)}
                            className="text-sm font-light"
                          />
                          {(Array.isArray(column.building.glazingElements) ? column.building.glazingElements : []).length > 1 && (
                            <Button
                              onClick={() => removeGlazingElement(column.id, glazing.id)}
                              size="sm"
                              variant="ghost"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {renderGlazingFields(glazing, column.id)}
                      </div>
                    ))}
                  </div>

                  {/* Building Elements */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold">Building Elements</h4>
                      <Button
                        onClick={() => addBuildingElement(column.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {(Array.isArray(column.building.buildingElements) ? column.building.buildingElements : []).map((element) => (
                      <div key={element.id} className="border rounded p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            value={element.name}
                            onChange={(e) => updateBuildingElement(column.id, element.id, 'name', e.target.value)}
                            className="text-sm font-light"
                          />
                          {(Array.isArray(column.building.buildingElements) ? column.building.buildingElements : []).length > 1 && (
                            <Button
                              onClick={() => removeBuildingElement(column.id, element.id)}
                              size="sm"
                              variant="ghost"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {renderBuildingFields(element, column.id)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpreadsheetInputs;
