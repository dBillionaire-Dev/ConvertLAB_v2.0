import type { CalculatorDefinition } from "../types"
import { num, assertPositive, round, fmt } from "../helpers"

export const beerLambertCalculator: CalculatorDefinition = {
  id: "beer-lambert-law",
  name: "Beer–Lambert Law",
  shortName: "Beer–Lambert",
  category: "spectrophotometry",
  description: "Calculates absorbance, concentration, path length, or molar absorptivity from the Beer–Lambert relationship using a selected solve direction.",
  inputs: [
    { id:"solveFor", label:"Solve for", kind:"select", options:[
      {value:"absorbance",label:"Absorbance"},{value:"concentration",label:"Concentration"},{value:"pathLength",label:"Path length"},{value:"epsilon",label:"Molar absorptivity"}
    ]},
    { id:"absorbance",label:"Absorbance",kind:"number",min:0,step:0.001,optional:true },
    { id:"epsilon",label:"Molar absorptivity",kind:"number",unit:"L·mol⁻¹·cm⁻¹",min:0.000001,step:0.1,optional:true },
    { id:"pathLength",label:"Path length",kind:"number",unit:"cm",min:0.0001,step:0.01,optional:true },
    { id:"concentration",label:"Concentration",kind:"number",unit:"mol/L",min:0.0000001,step:0.000001,optional:true },
  ],
  calculate:(inputs)=>{
    const solve=String(inputs.solveFor)
    const A=Number(inputs.absorbance), e=Number(inputs.epsilon), l=Number(inputs.pathLength), c=Number(inputs.concentration)
    if(solve==="absorbance"){
      assertPositive(e,"Molar absorptivity");assertPositive(l,"Path length");assertPositive(c,"Concentration");const v=round(e*l*c,4);return {value:v,display:`Absorbance: ${v}`,calculationSteps:[`${e} × ${l} × ${c} = ${v}`]}
    }
    if(solve==="concentration"){
      if(!Number.isFinite(A)||A<0)throw new Error("Absorbance must be non-negative.");assertPositive(e,"Molar absorptivity");assertPositive(l,"Path length");const v=round(A/(e*l),8);return {value:v,unit:"mol/L",display:fmt(v,8,"mol/L"),calculationSteps:[`${A} ÷ (${e} × ${l}) = ${v} mol/L`]}
    }
    if(solve==="pathLength"){
      if(!Number.isFinite(A)||A<0)throw new Error("Absorbance must be non-negative.");assertPositive(e,"Molar absorptivity");assertPositive(c,"Concentration");const v=round(A/(e*c),5);return {value:v,unit:"cm",display:fmt(v,5,"cm"),calculationSteps:[`${A} ÷ (${e} × ${c}) = ${v} cm`]}
    }
    if(solve==="epsilon"){
      if(!Number.isFinite(A)||A<0)throw new Error("Absorbance must be non-negative.");assertPositive(l,"Path length");assertPositive(c,"Concentration");const v=round(A/(l*c),3);return {value:v,unit:"L·mol⁻¹·cm⁻¹",display:fmt(v,3,"L·mol⁻¹·cm⁻¹"),calculationSteps:[`${A} ÷ (${l} × ${c}) = ${v} L·mol⁻¹·cm⁻¹`]}
    }
    throw new Error("Select a valid quantity to solve for.")
  },
  formula:"A = εlc",
  notes:["Use absorbance measured within the validated linear range of the method. Blank correction, wavelength, matrix effects and instrument validation remain laboratory-method requirements."]
}
