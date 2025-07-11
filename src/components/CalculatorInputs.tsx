
import React from 'react';
import SpreadsheetInputs from './SpreadsheetInputs';
import { CalculatorInputs as CalculatorInputsType } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputsType;
  setInputs: React.Dispatch<React.SetStateAction<CalculatorInputsType>>;
}

const CalculatorInputsComponent = ({ inputs, setInputs }: Props) => {
  return <SpreadsheetInputs inputs={inputs} setInputs={setInputs} />;
};

export default CalculatorInputsComponent;
