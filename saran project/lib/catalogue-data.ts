// AUTO-GENERATED FROM LEGACY APPLICATION (120 TESTS, 120 PARAMETER SPECS, 22 PANELS, 51 NOTES)
// CLINICAL GOVERNANCE NOTICE: All reference intervals and interpretation notes must remain
// labelled "Range not verified" pending formal clinical review and sign-off.

export type TestParameter = {
  name: string
  unit: string
  type: "Numeric" | "Qualitative" | "Text" | "Unconfigured"
  precision?: number
  maleLow?: number | null
  maleHigh?: number | null
  femaleLow?: number | null
  femaleHigh?: number | null
  isVerified: boolean
}

export type CatalogueTest = {
  code: string
  name: string
  category: string
  parameters: number
  price: number
  offer: number
  parameterNames: string[]
  units: string[]
  parameterDetails?: TestParameter[]
  active?: boolean
  notes?: string[]
  isPanel?: boolean
}

export const legacyInterpretationNotes = [
  {
    "index": 0,
    "text": "May reflect hormone excess, physiological cycle variation, medication effects or endocrine conditions.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 1,
    "text": "May reflect reduced hormone production or timing-related variation.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 2,
    "text": "Collection time and menstrual-cycle timing may matter; disclose medicines and pregnancy status.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 3,
    "text": "Use age-, sex-, cycle- and pregnancy-specific reference intervals.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 4,
    "text": "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 5,
    "text": "A low/negative result may be normal or may not exclude disease, depending on the assay.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 6,
    "text": "Follow the laboratory's sample, fasting and timing instructions.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 7,
    "text": "Use the exact assay's report range and clinician interpretation; this is a general educational note.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 8,
    "text": "Higher LDL/non-HDL/triglycerides may increase cardiovascular risk; interpretation depends on age and overall risk.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 9,
    "text": "Very low values need context; low HDL can be a risk marker.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 10,
    "text": "Fasting may be requested for selected situations; follow the ordering clinician/lab instructions.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 11,
    "text": "See the dedicated Lipid Profile Reference Notes sheet. Values are not a diagnosis or a personal treatment target.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 12,
    "text": "May suggest overactive thyroid or autoimmune activity depending on the test.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 13,
    "text": "May suggest underactive thyroid for hormone tests; antibody results require context.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 14,
    "text": "Usually blood sample; tell the clinician about thyroid medicines and supplements.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 15,
    "text": "Pregnancy and age affect reference intervals; antibody positivity alone is not a complete diagnosis.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 16,
    "text": "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 17,
    "text": "May reflect reduced protein production or other causes depending on the marker.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 18,
    "text": "Usually blood sample; fasting depends on panel and laboratory.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 19,
    "text": "Enzyme elevation does not by itself establish a specific liver disease.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 20,
    "text": "A positive/reactive result may indicate current or past infection depending on the assay.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 21,
    "text": "A negative result may not exclude very early infection or infection outside the test's detection window.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 22,
    "text": "Sample type and timing are test-specific; follow collection instructions.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 23,
    "text": "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 24,
    "text": "Not interpreted as high/low; reports a blood-group type.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 25,
    "text": "Blood sample; ensure correct patient identification.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 26,
    "text": "Important for transfusion and pregnancy care; crossmatching is separate.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 27,
    "text": "May indicate hyperglycaemia, diabetes or impaired glucose regulation; diagnosis requires accepted criteria and sometimes repeat testing.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 28,
    "text": "May indicate hypoglycaemia or treatment-related low glucose.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 29,
    "text": "Fasting may be required for FBS/GTT; HbA1c usually does not require fasting.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 30,
    "text": "Clinical diagnosis should follow current diabetes guidelines; HbA1c can be affected by some anaemias and haemoglobin variants.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 31,
    "text": "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 32,
    "text": "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 33,
    "text": "Blood sample; some tests require special handling; follow lab instructions.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 34,
    "text": "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 35,
    "text": "Depends on the parameter; may occur with anaemia, infection, inflammation, dehydration or marrow/platelet disorders.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 36,
    "text": "May reflect anaemia, low cell counts or other conditions depending on the parameter.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 37,
    "text": "Usually EDTA blood; follow lab instructions.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 38,
    "text": "Interpret the individual components and age-/sex-specific ranges, not one number alone.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 39,
    "text": "May reflect excess supplementation, inflammation (for ferritin) or other causes.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 40,
    "text": "May indicate deficiency or depleted stores, depending on the marker.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 41,
    "text": "Tell the clinician about supplements; fasting requirements vary.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 42,
    "text": "Ferritin can rise with inflammation; interpret with other iron studies and clinical history.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 43,
    "text": "Positive result may indicate pregnancy; rare other causes are possible.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 44,
    "text": "Negative result may occur if testing is too early.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 45,
    "text": "Follow kit/lab timing; first-morning urine may help for early testing.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 46,
    "text": "Repeat or serum testing may be advised if pregnancy is still suspected.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 47,
    "text": "May indicate infection, blood, protein, glucose or kidney/urinary tract issues.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 48,
    "text": "Often not meaningful in isolation; depends on the measured component.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 49,
    "text": "Clean-catch midstream sample may be requested; culture samples need sterile collection.",
    "label": "Legacy content pending professional review"
  },
  {
    "index": 50,
    "text": "Hydration, contamination and collection technique can affect results.",
    "label": "Legacy content pending professional review"
  }
];

export const legacyTests: CatalogueTest[] = [
  {
    "code": "LEG-001",
    "name": "AMH",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 2150,
    "offer": 1935,
    "parameterNames": [
      "AMH"
    ],
    "units": [
      "ng/mL"
    ],
    "parameterDetails": [
      {
        "name": "AMH",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 1.0,
        "maleHigh": 3.5,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect hormone excess, physiological cycle variation, medication effects or endocrine conditions.",
      "May reflect reduced hormone production or timing-related variation.",
      "Collection time and menstrual-cycle timing may matter; disclose medicines and pregnancy status.",
      "Use age-, sex-, cycle- and pregnancy-specific reference intervals."
    ]
  },
  {
    "code": "LEG-002",
    "name": "ANA",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 750,
    "offer": 675,
    "parameterNames": [
      "ANA"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "ANA",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-003",
    "name": "ANA (IFA)",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 900,
    "offer": 810,
    "parameterNames": [
      "ANA (IFA)"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "ANA (IFA)",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-004",
    "name": "ANC Profile",
    "category": "Haematology",
    "parameters": 1,
    "price": 1480,
    "offer": 1330,
    "parameterNames": [
      "Result"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Result",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-005",
    "name": "APTT",
    "category": "Haematology",
    "parameters": 1,
    "price": 380,
    "offer": 340,
    "parameterNames": [
      "APTT"
    ],
    "units": [
      "sec"
    ],
    "parameterDetails": [
      {
        "name": "APTT",
        "unit": "sec",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 25.0,
        "maleHigh": 35.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-006",
    "name": "ASO",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 300,
    "offer": 270,
    "parameterNames": [
      "ASO"
    ],
    "units": [
      "IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "ASO",
        "unit": "IU/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 200.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-007",
    "name": "Anti-CCP",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 1350,
    "offer": 1215,
    "parameterNames": [
      "Anti-CCP"
    ],
    "units": [
      "U/mL"
    ],
    "parameterDetails": [
      {
        "name": "Anti-CCP",
        "unit": "U/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 17.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-008",
    "name": "Anti-Phospholipid Antibody",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 900,
    "offer": 810,
    "parameterNames": [
      "Anti-Phospholipid Antibody"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Anti-Phospholipid Antibody",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Higher LDL/non-HDL/triglycerides may increase cardiovascular risk; interpretation depends on age and overall risk.",
      "Very low values need context; low HDL can be a risk marker.",
      "Fasting may be requested for selected situations; follow the ordering clinician/lab instructions.",
      "See the dedicated Lipid Profile Reference Notes sheet. Values are not a diagnosis or a personal treatment target."
    ]
  },
  {
    "code": "LEG-009",
    "name": "Anti-TPO",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 800,
    "offer": 720,
    "parameterNames": [
      "Anti-TPO"
    ],
    "units": [
      "IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "Anti-TPO",
        "unit": "IU/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 35.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May suggest overactive thyroid or autoimmune activity depending on the test.",
      "May suggest underactive thyroid for hormone tests; antibody results require context.",
      "Usually blood sample; tell the clinician about thyroid medicines and supplements.",
      "Pregnancy and age affect reference intervals; antibody positivity alone is not a complete diagnosis."
    ]
  },
  {
    "code": "LEG-010",
    "name": "Anti-Thyroglobulin Antibody",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 800,
    "offer": 720,
    "parameterNames": [
      "Anti-Thyroglobulin Antibody"
    ],
    "units": [
      "IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "Anti-Thyroglobulin Antibody",
        "unit": "IU/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-011",
    "name": "Anti-Thyroid Microsomal Antibody",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 1500,
    "offer": 1350,
    "parameterNames": [
      "Anti-Thyroid Microsomal Antibody"
    ],
    "units": [
      "IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "Anti-Thyroid Microsomal Antibody",
        "unit": "IU/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 35.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May suggest overactive thyroid or autoimmune activity depending on the test.",
      "May suggest underactive thyroid for hormone tests; antibody results require context.",
      "Usually blood sample; tell the clinician about thyroid medicines and supplements.",
      "Pregnancy and age affect reference intervals; antibody positivity alone is not a complete diagnosis."
    ]
  },
  {
    "code": "LEG-012",
    "name": "Bicarbonate",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 140,
    "offer": 125,
    "parameterNames": [
      "Bicarbonate"
    ],
    "units": [
      "mmol/L"
    ],
    "parameterDetails": [
      {
        "name": "Bicarbonate",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 22.0,
        "maleHigh": 29.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-013",
    "name": "Bilirubin",
    "category": "Biochemistry",
    "parameters": 2,
    "price": 100,
    "offer": 90,
    "parameterNames": [
      "Total Bilirubin",
      "Direct Bilirubin"
    ],
    "units": [
      "mg/dL",
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Total Bilirubin",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.3,
        "maleHigh": 1.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Direct Bilirubin",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.0,
        "maleHigh": 0.3,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-014",
    "name": "Bleeding / Clotting Time",
    "category": "Haematology",
    "parameters": 2,
    "price": 50,
    "offer": 45,
    "parameterNames": [
      "Bleeding Time",
      "Clotting Time"
    ],
    "units": [
      "min",
      "min"
    ],
    "parameterDetails": [
      {
        "name": "Bleeding Time",
        "unit": "min",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 2.0,
        "maleHigh": 7.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Clotting Time",
        "unit": "min",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 5.0,
        "maleHigh": 10.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-015",
    "name": "Blood Culture",
    "category": "Microbiology",
    "parameters": 1,
    "price": 400,
    "offer": 360,
    "parameterNames": [
      "Result"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Result",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-016",
    "name": "Blood Group",
    "category": "Haematology",
    "parameters": 1,
    "price": 60,
    "offer": 55,
    "parameterNames": [
      "Result"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Result",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Not interpreted as high/low; reports a blood-group type.",
      "Not interpreted as high/low; reports a blood-group type.",
      "Blood sample; ensure correct patient identification.",
      "Important for transfusion and pregnancy care; crossmatching is separate."
    ]
  },
  {
    "code": "LEG-017",
    "name": "Blood Sugar (unspecified)",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 50,
    "offer": 45,
    "parameterNames": [
      "Blood Sugar (unspecified)"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Blood Sugar (unspecified)",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 70.0,
        "maleHigh": 140.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May indicate hyperglycaemia, diabetes or impaired glucose regulation; diagnosis requires accepted criteria and sometimes repeat testing.",
      "May indicate hypoglycaemia or treatment-related low glucose.",
      "Fasting may be required for FBS/GTT; HbA1c usually does not require fasting.",
      "Clinical diagnosis should follow current diabetes guidelines; HbA1c can be affected by some anaemias and haemoglobin variants."
    ]
  },
  {
    "code": "LEG-018",
    "name": "Blood Urea Nitrogen (BUN)",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 80,
    "offer": 70,
    "parameterNames": [
      "Blood Urea Nitrogen (BUN)"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Blood Urea Nitrogen (BUN)",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 7.0,
        "maleHigh": 20.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-019",
    "name": "CA 15-3",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 750,
    "offer": 675,
    "parameterNames": [
      "CA 15-3"
    ],
    "units": [
      "U/mL"
    ],
    "parameterDetails": [
      {
        "name": "CA 15-3",
        "unit": "U/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 30.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-020",
    "name": "CA 19-9",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 750,
    "offer": 675,
    "parameterNames": [
      "CA 19-9"
    ],
    "units": [
      "U/mL"
    ],
    "parameterDetails": [
      {
        "name": "CA 19-9",
        "unit": "U/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 37.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-021",
    "name": "CA-125",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 680,
    "offer": 610,
    "parameterNames": [
      "CA-125"
    ],
    "units": [
      "U/mL"
    ],
    "parameterDetails": [
      {
        "name": "CA-125",
        "unit": "U/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 35.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-022",
    "name": "CBC / Hemogram",
    "category": "Haematology",
    "parameters": 13,
    "price": 280,
    "offer": 250,
    "parameterNames": [
      "Hemoglobin",
      "Total WBC Count",
      "RBC Count",
      "PCV",
      "MCV",
      "MCH",
      "MCHC",
      "Platelet Count",
      "Neutrophils",
      "Lymphocytes",
      "Eosinophils",
      "Monocytes",
      "Basophils"
    ],
    "units": [
      "g/dL",
      "/cumm",
      "million/cumm",
      "%",
      "fL",
      "pg",
      "g/dL",
      "lakh/cumm",
      "%",
      "%",
      "%",
      "%",
      "%"
    ],
    "parameterDetails": [
      {
        "name": "Hemoglobin",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 13.0,
        "maleHigh": 17.0,
        "femaleLow": 12.0,
        "femaleHigh": 15.0,
        "isVerified": false
      },
      {
        "name": "Total WBC Count",
        "unit": "/cumm",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 4000.0,
        "maleHigh": 11000.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "RBC Count",
        "unit": "million/cumm",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 4.5,
        "maleHigh": 5.5,
        "femaleLow": 3.8,
        "femaleHigh": 4.8,
        "isVerified": false
      },
      {
        "name": "PCV",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 40.0,
        "maleHigh": 50.0,
        "femaleLow": 36.0,
        "femaleHigh": 46.0,
        "isVerified": false
      },
      {
        "name": "MCV",
        "unit": "fL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 83.0,
        "maleHigh": 101.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "MCH",
        "unit": "pg",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 27.0,
        "maleHigh": 32.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "MCHC",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 31.5,
        "maleHigh": 34.5,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Platelet Count",
        "unit": "lakh/cumm",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 1.5,
        "maleHigh": 4.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Neutrophils",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 40.0,
        "maleHigh": 80.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Lymphocytes",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 20.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Eosinophils",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 1.0,
        "maleHigh": 6.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Monocytes",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 2.0,
        "maleHigh": 10.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Basophils",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 1.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "Depends on the parameter; may occur with anaemia, infection, inflammation, dehydration or marrow/platelet disorders.",
      "May reflect anaemia, low cell counts or other conditions depending on the parameter.",
      "Usually EDTA blood; follow lab instructions.",
      "Interpret the individual components and age-/sex-specific ranges, not one number alone."
    ]
  },
  {
    "code": "LEG-023",
    "name": "CBC with Peripheral Smear and ESR",
    "category": "Haematology",
    "parameters": 15,
    "price": 420,
    "offer": 380,
    "parameterNames": [
      "Hemoglobin",
      "Total WBC Count",
      "RBC Count",
      "PCV",
      "MCV",
      "MCH",
      "MCHC",
      "Platelet Count",
      "Neutrophils",
      "Lymphocytes",
      "Eosinophils",
      "Monocytes",
      "Basophils",
      "ESR",
      "Peripheral Smear"
    ],
    "units": [
      "g/dL",
      "/cumm",
      "million/cumm",
      "%",
      "fL",
      "pg",
      "g/dL",
      "lakh/cumm",
      "%",
      "%",
      "%",
      "%",
      "%",
      "mm/hr",
      ""
    ],
    "parameterDetails": [
      {
        "name": "Hemoglobin",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 13.0,
        "maleHigh": 17.0,
        "femaleLow": 12.0,
        "femaleHigh": 15.0,
        "isVerified": false
      },
      {
        "name": "Total WBC Count",
        "unit": "/cumm",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 4000.0,
        "maleHigh": 11000.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "RBC Count",
        "unit": "million/cumm",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 4.5,
        "maleHigh": 5.5,
        "femaleLow": 3.8,
        "femaleHigh": 4.8,
        "isVerified": false
      },
      {
        "name": "PCV",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 40.0,
        "maleHigh": 50.0,
        "femaleLow": 36.0,
        "femaleHigh": 46.0,
        "isVerified": false
      },
      {
        "name": "MCV",
        "unit": "fL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 83.0,
        "maleHigh": 101.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "MCH",
        "unit": "pg",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 27.0,
        "maleHigh": 32.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "MCHC",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 31.5,
        "maleHigh": 34.5,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Platelet Count",
        "unit": "lakh/cumm",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 1.5,
        "maleHigh": 4.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Neutrophils",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 40.0,
        "maleHigh": 80.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Lymphocytes",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 20.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Eosinophils",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 1.0,
        "maleHigh": 6.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Monocytes",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 2.0,
        "maleHigh": 10.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Basophils",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 1.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "ESR",
        "unit": "mm/hr",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 15.0,
        "femaleLow": 0.0,
        "femaleHigh": 20.0,
        "isVerified": false
      },
      {
        "name": "Peripheral Smear",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "Depends on the parameter; may occur with anaemia, infection, inflammation, dehydration or marrow/platelet disorders.",
      "May reflect anaemia, low cell counts or other conditions depending on the parameter.",
      "Usually EDTA blood; follow lab instructions.",
      "Interpret the individual components and age-/sex-specific ranges, not one number alone."
    ]
  },
  {
    "code": "LEG-024",
    "name": "CK-MB",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 580,
    "offer": 520,
    "parameterNames": [
      "CK-MB"
    ],
    "units": [
      "U/L"
    ],
    "parameterDetails": [
      {
        "name": "CK-MB",
        "unit": "U/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 25.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-025",
    "name": "CPK",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 500,
    "offer": 450,
    "parameterNames": [
      "CPK"
    ],
    "units": [
      "U/L"
    ],
    "parameterDetails": [
      {
        "name": "CPK",
        "unit": "U/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 30.0,
        "maleHigh": 200.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-026",
    "name": "CRP",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 360,
    "offer": 325,
    "parameterNames": [
      "CRP"
    ],
    "units": [
      "mg/L"
    ],
    "parameterDetails": [
      {
        "name": "CRP",
        "unit": "mg/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 6.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-027",
    "name": "CSF Analysis",
    "category": "Clinical Pathology",
    "parameters": 1,
    "price": 450,
    "offer": 405,
    "parameterNames": [
      "Result"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Result",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-028",
    "name": "Calcium",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 140,
    "offer": 125,
    "parameterNames": [
      "Calcium"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Calcium",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 8.5,
        "maleHigh": 10.5,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-029",
    "name": "Chloride",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 120,
    "offer": 110,
    "parameterNames": [
      "Chloride"
    ],
    "units": [
      "mmol/L"
    ],
    "parameterDetails": [
      {
        "name": "Chloride",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 98.0,
        "maleHigh": 107.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-030",
    "name": "Cholesterol",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 100,
    "offer": 90,
    "parameterNames": [
      "Cholesterol"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Cholesterol",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 200.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Higher LDL/non-HDL/triglycerides may increase cardiovascular risk; interpretation depends on age and overall risk.",
      "Very low values need context; low HDL can be a risk marker.",
      "Fasting may be requested for selected situations; follow the ordering clinician/lab instructions.",
      "See the dedicated Lipid Profile Reference Notes sheet. Values are not a diagnosis or a personal treatment target."
    ]
  },
  {
    "code": "LEG-031",
    "name": "Cortisol",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 660,
    "offer": 595,
    "parameterNames": [
      "Cortisol"
    ],
    "units": [
      "\u00b5g/dL"
    ],
    "parameterDetails": [
      {
        "name": "Cortisol",
        "unit": "\u00b5g/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 6.0,
        "maleHigh": 23.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect hormone excess, physiological cycle variation, medication effects or endocrine conditions.",
      "May reflect reduced hormone production or timing-related variation.",
      "Collection time and menstrual-cycle timing may matter; disclose medicines and pregnancy status.",
      "Use age-, sex-, cycle- and pregnancy-specific reference intervals."
    ]
  },
  {
    "code": "LEG-032",
    "name": "Creatinine",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 80,
    "offer": 70,
    "parameterNames": [
      "Creatinine"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Creatinine",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.7,
        "maleHigh": 1.3,
        "femaleLow": 0.6,
        "femaleHigh": 1.1,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-033",
    "name": "Cryptococcal Antigen",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 2500,
    "offer": 2250,
    "parameterNames": [
      "Cryptococcal Antigen"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Cryptococcal Antigen",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-034",
    "name": "DHEA",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 650,
    "offer": 585,
    "parameterNames": [
      "DHEA"
    ],
    "units": [
      "\u00b5g/dL"
    ],
    "parameterDetails": [
      {
        "name": "DHEA",
        "unit": "\u00b5g/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 35.0,
        "maleHigh": 430.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect hormone excess, physiological cycle variation, medication effects or endocrine conditions.",
      "May reflect reduced hormone production or timing-related variation.",
      "Collection time and menstrual-cycle timing may matter; disclose medicines and pregnancy status.",
      "Use age-, sex-, cycle- and pregnancy-specific reference intervals."
    ]
  },
  {
    "code": "LEG-035",
    "name": "Dengue IgG",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 980,
    "offer": 880,
    "parameterNames": [
      "Dengue IgG"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Dengue IgG",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-036",
    "name": "Dengue IgM",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 1000,
    "offer": 900,
    "parameterNames": [
      "Dengue IgM"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Dengue IgM",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-037",
    "name": "Dengue NS1 Antigen",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 600,
    "offer": 540,
    "parameterNames": [
      "Dengue NS1 Antigen"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Dengue NS1 Antigen",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-038",
    "name": "ESR",
    "category": "Haematology",
    "parameters": 1,
    "price": 60,
    "offer": 55,
    "parameterNames": [
      "ESR"
    ],
    "units": [
      "mm/hr"
    ],
    "parameterDetails": [
      {
        "name": "ESR",
        "unit": "mm/hr",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 15.0,
        "femaleLow": 0.0,
        "femaleHigh": 20.0,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Depends on the parameter; may occur with anaemia, infection, inflammation, dehydration or marrow/platelet disorders.",
      "May reflect anaemia, low cell counts or other conditions depending on the parameter.",
      "Usually EDTA blood; follow lab instructions.",
      "Interpret the individual components and age-/sex-specific ranges, not one number alone."
    ]
  },
  {
    "code": "LEG-039",
    "name": "Electrolytes",
    "category": "Biochemistry",
    "parameters": 3,
    "price": 600,
    "offer": 540,
    "parameterNames": [
      "Sodium",
      "Potassium",
      "Chloride"
    ],
    "units": [
      "mmol/L",
      "mmol/L",
      "mmol/L"
    ],
    "parameterDetails": [
      {
        "name": "Sodium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 135.0,
        "maleHigh": 145.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Potassium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 5.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Chloride",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 98.0,
        "maleHigh": 107.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-040",
    "name": "Electrolytes (Na/K/Cl)",
    "category": "Biochemistry",
    "parameters": 3,
    "price": 400,
    "offer": 360,
    "parameterNames": [
      "Sodium",
      "Potassium",
      "Chloride"
    ],
    "units": [
      "mmol/L",
      "mmol/L",
      "mmol/L"
    ],
    "parameterDetails": [
      {
        "name": "Sodium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 135.0,
        "maleHigh": 145.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Potassium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 5.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Chloride",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 98.0,
        "maleHigh": 107.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-041",
    "name": "Estradiol (E2)",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 500,
    "offer": 450,
    "parameterNames": [
      "Estradiol (E2)"
    ],
    "units": [
      "pg/mL"
    ],
    "parameterDetails": [
      {
        "name": "Estradiol (E2)",
        "unit": "pg/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 10.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect hormone excess, physiological cycle variation, medication effects or endocrine conditions.",
      "May reflect reduced hormone production or timing-related variation.",
      "Collection time and menstrual-cycle timing may matter; disclose medicines and pregnancy status.",
      "Use age-, sex-, cycle- and pregnancy-specific reference intervals."
    ]
  },
  {
    "code": "LEG-042",
    "name": "FSH",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 350,
    "offer": 315,
    "parameterNames": [
      "FSH"
    ],
    "units": [
      "mIU/mL"
    ],
    "parameterDetails": [
      {
        "name": "FSH",
        "unit": "mIU/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 1.5,
        "maleHigh": 12.4,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect hormone excess, physiological cycle variation, medication effects or endocrine conditions.",
      "May reflect reduced hormone production or timing-related variation.",
      "Collection time and menstrual-cycle timing may matter; disclose medicines and pregnancy status.",
      "Use age-, sex-, cycle- and pregnancy-specific reference intervals."
    ]
  },
  {
    "code": "LEG-043",
    "name": "Ferritin",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 680,
    "offer": 610,
    "parameterNames": [
      "Ferritin"
    ],
    "units": [
      "ng/mL"
    ],
    "parameterDetails": [
      {
        "name": "Ferritin",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 30.0,
        "maleHigh": 400.0,
        "femaleLow": 13.0,
        "femaleHigh": 150.0,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect excess supplementation, inflammation (for ferritin) or other causes.",
      "May indicate deficiency or depleted stores, depending on the marker.",
      "Tell the clinician about supplements; fasting requirements vary.",
      "Ferritin can rise with inflammation; interpret with other iron studies and clinical history."
    ]
  },
  {
    "code": "LEG-044",
    "name": "Fever Panel Comprehensive",
    "category": "Serology / Immunology",
    "parameters": 5,
    "price": 2000,
    "offer": 1800,
    "parameterNames": [
      "Malaria Parasite",
      "Dengue NS1 Antigen",
      "Dengue IgM",
      "S.Typhi O",
      "S.Typhi H"
    ],
    "units": [
      "",
      "",
      "",
      "",
      ""
    ],
    "parameterDetails": [
      {
        "name": "Malaria Parasite",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Dengue NS1 Antigen",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Dengue IgM",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "S.Typhi O",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "S.Typhi H",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-045",
    "name": "Folic Acid",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 800,
    "offer": 720,
    "parameterNames": [
      "Folic Acid"
    ],
    "units": [
      "ng/mL"
    ],
    "parameterDetails": [
      {
        "name": "Folic Acid",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 3.0,
        "maleHigh": 17.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect excess supplementation, inflammation (for ferritin) or other causes.",
      "May indicate deficiency or depleted stores, depending on the marker.",
      "Tell the clinician about supplements; fasting requirements vary.",
      "Ferritin can rise with inflammation; interpret with other iron studies and clinical history."
    ]
  },
  {
    "code": "LEG-046",
    "name": "Free Thyroid Panel (FT3, FT4, TSH)",
    "category": "Biochemistry",
    "parameters": 3,
    "price": 900,
    "offer": 810,
    "parameterNames": [
      "FT3",
      "FT4",
      "TSH"
    ],
    "units": [
      "pg/mL",
      "ng/dL",
      "\u00b5IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "FT3",
        "unit": "pg/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 2.0,
        "maleHigh": 4.4,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "FT4",
        "unit": "ng/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.8,
        "maleHigh": 1.8,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "TSH",
        "unit": "\u00b5IU/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.4,
        "maleHigh": 4.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May suggest overactive thyroid or autoimmune activity depending on the test.",
      "May suggest underactive thyroid for hormone tests; antibody results require context.",
      "Usually blood sample; tell the clinician about thyroid medicines and supplements.",
      "Pregnancy and age affect reference intervals; antibody positivity alone is not a complete diagnosis."
    ]
  },
  {
    "code": "LEG-047",
    "name": "G6PD",
    "category": "Haematology",
    "parameters": 1,
    "price": 600,
    "offer": 540,
    "parameterNames": [
      "G6PD"
    ],
    "units": [
      "U/g Hb"
    ],
    "parameterDetails": [
      {
        "name": "G6PD",
        "unit": "U/g Hb",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 4.6,
        "maleHigh": 13.5,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-048",
    "name": "GTT",
    "category": "Biochemistry",
    "parameters": 2,
    "price": 420,
    "offer": 380,
    "parameterNames": [
      "Fasting Glucose",
      "Glucose 2 hr (PP)"
    ],
    "units": [
      "mg/dL",
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Fasting Glucose",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 70.0,
        "maleHigh": 100.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Glucose 2 hr (PP)",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 70.0,
        "maleHigh": 140.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May indicate hyperglycaemia, diabetes or impaired glucose regulation; diagnosis requires accepted criteria and sometimes repeat testing.",
      "May indicate hypoglycaemia or treatment-related low glucose.",
      "Fasting may be required for FBS/GTT; HbA1c usually does not require fasting.",
      "Clinical diagnosis should follow current diabetes guidelines; HbA1c can be affected by some anaemias and haemoglobin variants."
    ]
  },
  {
    "code": "LEG-049",
    "name": "Gamma GT",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 500,
    "offer": 450,
    "parameterNames": [
      "Gamma GT"
    ],
    "units": [
      "U/L"
    ],
    "parameterDetails": [
      {
        "name": "Gamma GT",
        "unit": "U/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 8.0,
        "maleHigh": 61.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-050",
    "name": "Globulin",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 200,
    "offer": 180,
    "parameterNames": [
      "Globulin"
    ],
    "units": [
      "g/dL"
    ],
    "parameterDetails": [
      {
        "name": "Globulin",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 2.0,
        "maleHigh": 3.5,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-051",
    "name": "HBsAg",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 200,
    "offer": 180,
    "parameterNames": [
      "HBsAg"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "HBsAg",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-052",
    "name": "HCV Antibody",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 500,
    "offer": 450,
    "parameterNames": [
      "HCV Antibody"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "HCV Antibody",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-053",
    "name": "HDL Cholesterol",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 180,
    "offer": 160,
    "parameterNames": [
      "HDL Cholesterol"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "HDL Cholesterol",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 40.0,
        "maleHigh": 100.0,
        "femaleLow": 50.0,
        "femaleHigh": 100.0,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Higher LDL/non-HDL/triglycerides may increase cardiovascular risk; interpretation depends on age and overall risk.",
      "Very low values need context; low HDL can be a risk marker.",
      "Fasting may be requested for selected situations; follow the ordering clinician/lab instructions.",
      "See the dedicated Lipid Profile Reference Notes sheet. Values are not a diagnosis or a personal treatment target."
    ]
  },
  {
    "code": "LEG-054",
    "name": "HGH",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 550,
    "offer": 495,
    "parameterNames": [
      "HGH"
    ],
    "units": [
      "ng/mL"
    ],
    "parameterDetails": [
      {
        "name": "HGH",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 5.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-055",
    "name": "HIV",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 250,
    "offer": 225,
    "parameterNames": [
      "HIV"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "HIV",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-056",
    "name": "Hb Variant Analysis",
    "category": "Haematology",
    "parameters": 1,
    "price": 1040,
    "offer": 935,
    "parameterNames": [
      "Result"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Result",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-057",
    "name": "HbA1c",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 440,
    "offer": 395,
    "parameterNames": [
      "HbA1c"
    ],
    "units": [
      "%"
    ],
    "parameterDetails": [
      {
        "name": "HbA1c",
        "unit": "%",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 4.0,
        "maleHigh": 5.6,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May indicate hyperglycaemia, diabetes or impaired glucose regulation; diagnosis requires accepted criteria and sometimes repeat testing.",
      "May indicate hypoglycaemia or treatment-related low glucose.",
      "Fasting may be required for FBS/GTT; HbA1c usually does not require fasting.",
      "Clinical diagnosis should follow current diabetes guidelines; HbA1c can be affected by some anaemias and haemoglobin variants."
    ]
  },
  {
    "code": "LEG-058",
    "name": "Hemoglobin",
    "category": "Haematology",
    "parameters": 1,
    "price": 50,
    "offer": 45,
    "parameterNames": [
      "Hemoglobin"
    ],
    "units": [
      "g/dL"
    ],
    "parameterDetails": [
      {
        "name": "Hemoglobin",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 13.0,
        "maleHigh": 17.0,
        "femaleLow": 12.0,
        "femaleHigh": 15.0,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Depends on the parameter; may occur with anaemia, infection, inflammation, dehydration or marrow/platelet disorders.",
      "May reflect anaemia, low cell counts or other conditions depending on the parameter.",
      "Usually EDTA blood; follow lab instructions.",
      "Interpret the individual components and age-/sex-specific ranges, not one number alone."
    ]
  },
  {
    "code": "LEG-059",
    "name": "Insulin",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 620,
    "offer": 560,
    "parameterNames": [
      "Insulin"
    ],
    "units": [
      "\u00b5IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "Insulin",
        "unit": "\u00b5IU/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 2.6,
        "maleHigh": 24.9,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect hormone excess, physiological cycle variation, medication effects or endocrine conditions.",
      "May reflect reduced hormone production or timing-related variation.",
      "Collection time and menstrual-cycle timing may matter; disclose medicines and pregnancy status.",
      "Use age-, sex-, cycle- and pregnancy-specific reference intervals."
    ]
  },
  {
    "code": "LEG-060",
    "name": "Iron",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 300,
    "offer": 270,
    "parameterNames": [
      "Iron"
    ],
    "units": [
      "\u00b5g/dL"
    ],
    "parameterDetails": [
      {
        "name": "Iron",
        "unit": "\u00b5g/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 65.0,
        "maleHigh": 175.0,
        "femaleLow": 50.0,
        "femaleHigh": 170.0,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect excess supplementation, inflammation (for ferritin) or other causes.",
      "May indicate deficiency or depleted stores, depending on the marker.",
      "Tell the clinician about supplements; fasting requirements vary.",
      "Ferritin can rise with inflammation; interpret with other iron studies and clinical history."
    ]
  },
  {
    "code": "LEG-061",
    "name": "Kidney / Renal Function Profile",
    "category": "Biochemistry",
    "parameters": 6,
    "price": 660,
    "offer": 595,
    "parameterNames": [
      "Urea",
      "Creatinine",
      "Uric Acid",
      "Blood Urea Nitrogen (BUN)",
      "Sodium",
      "Potassium"
    ],
    "units": [
      "mg/dL",
      "mg/dL",
      "mg/dL",
      "mg/dL",
      "mmol/L",
      "mmol/L"
    ],
    "parameterDetails": [
      {
        "name": "Urea",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 15.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Creatinine",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.7,
        "maleHigh": 1.3,
        "femaleLow": 0.6,
        "femaleHigh": 1.1,
        "isVerified": false
      },
      {
        "name": "Uric Acid",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 7.2,
        "femaleLow": 2.6,
        "femaleHigh": 6.0,
        "isVerified": false
      },
      {
        "name": "Blood Urea Nitrogen (BUN)",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 7.0,
        "maleHigh": 20.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Sodium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 135.0,
        "maleHigh": 145.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Potassium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 5.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-062",
    "name": "Kidney Profile",
    "category": "Biochemistry",
    "parameters": 6,
    "price": 280,
    "offer": 250,
    "parameterNames": [
      "Urea",
      "Creatinine",
      "Uric Acid",
      "Blood Urea Nitrogen (BUN)",
      "Sodium",
      "Potassium"
    ],
    "units": [
      "mg/dL",
      "mg/dL",
      "mg/dL",
      "mg/dL",
      "mmol/L",
      "mmol/L"
    ],
    "parameterDetails": [
      {
        "name": "Urea",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 15.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Creatinine",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.7,
        "maleHigh": 1.3,
        "femaleLow": 0.6,
        "femaleHigh": 1.1,
        "isVerified": false
      },
      {
        "name": "Uric Acid",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 7.2,
        "femaleLow": 2.6,
        "femaleHigh": 6.0,
        "isVerified": false
      },
      {
        "name": "Blood Urea Nitrogen (BUN)",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 7.0,
        "maleHigh": 20.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Sodium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 135.0,
        "maleHigh": 145.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Potassium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 5.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-063",
    "name": "LDH",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 350,
    "offer": 315,
    "parameterNames": [
      "LDH"
    ],
    "units": [
      "U/L"
    ],
    "parameterDetails": [
      {
        "name": "LDH",
        "unit": "U/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 140.0,
        "maleHigh": 280.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-064",
    "name": "LE Cells",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 550,
    "offer": 495,
    "parameterNames": [
      "LE Cells"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "LE Cells",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-065",
    "name": "LH",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 450,
    "offer": 405,
    "parameterNames": [
      "LH"
    ],
    "units": [
      "mIU/mL"
    ],
    "parameterDetails": [
      {
        "name": "LH",
        "unit": "mIU/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 1.7,
        "maleHigh": 8.6,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect hormone excess, physiological cycle variation, medication effects or endocrine conditions.",
      "May reflect reduced hormone production or timing-related variation.",
      "Collection time and menstrual-cycle timing may matter; disclose medicines and pregnancy status.",
      "Use age-, sex-, cycle- and pregnancy-specific reference intervals."
    ]
  },
  {
    "code": "LEG-066",
    "name": "Lipid Profile",
    "category": "Biochemistry",
    "parameters": 6,
    "price": 450,
    "offer": 405,
    "parameterNames": [
      "Cholesterol",
      "Triglycerides",
      "HDL Cholesterol",
      "LDL Cholesterol",
      "VLDL",
      "Chol/HDL Ratio"
    ],
    "units": [
      "mg/dL",
      "mg/dL",
      "mg/dL",
      "mg/dL",
      "mg/dL",
      ""
    ],
    "parameterDetails": [
      {
        "name": "Cholesterol",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 200.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Triglycerides",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 150.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "HDL Cholesterol",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 40.0,
        "maleHigh": 100.0,
        "femaleLow": 50.0,
        "femaleHigh": 100.0,
        "isVerified": false
      },
      {
        "name": "LDL Cholesterol",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 100.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "VLDL",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 5.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Chol/HDL Ratio",
        "unit": "",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 5.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "Higher LDL/non-HDL/triglycerides may increase cardiovascular risk; interpretation depends on age and overall risk.",
      "Very low values need context; low HDL can be a risk marker.",
      "Fasting may be requested for selected situations; follow the ordering clinician/lab instructions.",
      "See the dedicated Lipid Profile Reference Notes sheet. Values are not a diagnosis or a personal treatment target."
    ]
  },
  {
    "code": "LEG-067",
    "name": "Lipoprotein(a)",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 800,
    "offer": 720,
    "parameterNames": [
      "Lipoprotein(a)"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Lipoprotein(a)",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 30.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-068",
    "name": "Lithium",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 550,
    "offer": 495,
    "parameterNames": [
      "Lithium"
    ],
    "units": [
      "mmol/L"
    ],
    "parameterDetails": [
      {
        "name": "Lithium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.6,
        "maleHigh": 1.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-069",
    "name": "Liver Function Test (LFT)",
    "category": "Biochemistry",
    "parameters": 10,
    "price": 500,
    "offer": 450,
    "parameterNames": [
      "Total Bilirubin",
      "Direct Bilirubin",
      "Indirect Bilirubin",
      "SGOT / AST",
      "SGPT / ALT",
      "Alkaline Phosphatase",
      "Protein",
      "Albumin",
      "Globulin",
      "A/G Ratio"
    ],
    "units": [
      "mg/dL",
      "mg/dL",
      "mg/dL",
      "U/L",
      "U/L",
      "U/L",
      "g/dL",
      "g/dL",
      "g/dL",
      ""
    ],
    "parameterDetails": [
      {
        "name": "Total Bilirubin",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.3,
        "maleHigh": 1.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Direct Bilirubin",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.0,
        "maleHigh": 0.3,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Indirect Bilirubin",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.1,
        "maleHigh": 1.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "SGOT / AST",
        "unit": "U/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 5.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "SGPT / ALT",
        "unit": "U/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 5.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Alkaline Phosphatase",
        "unit": "U/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 44.0,
        "maleHigh": 147.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Protein",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 6.0,
        "maleHigh": 8.3,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Albumin",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 5.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Globulin",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 2.0,
        "maleHigh": 3.5,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "A/G Ratio",
        "unit": "",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 1.0,
        "maleHigh": 2.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-070",
    "name": "Lupus Anticoagulant",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 1300,
    "offer": 1170,
    "parameterNames": [
      "Lupus Anticoagulant"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Lupus Anticoagulant",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-071",
    "name": "Magnesium",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 280,
    "offer": 250,
    "parameterNames": [
      "Magnesium"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Magnesium",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 1.7,
        "maleHigh": 2.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-072",
    "name": "Malaria Parasite",
    "category": "Haematology",
    "parameters": 1,
    "price": 180,
    "offer": 160,
    "parameterNames": [
      "Malaria Parasite"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Malaria Parasite",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-073",
    "name": "Microalbumin",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 250,
    "offer": 225,
    "parameterNames": [
      "Microalbumin"
    ],
    "units": [
      "mg/L"
    ],
    "parameterDetails": [
      {
        "name": "Microalbumin",
        "unit": "mg/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 30.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-074",
    "name": "Microfilaria",
    "category": "Haematology",
    "parameters": 1,
    "price": 130,
    "offer": 115,
    "parameterNames": [
      "Microfilaria"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Microfilaria",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-075",
    "name": "PCV",
    "category": "Haematology",
    "parameters": 1,
    "price": 100,
    "offer": 90,
    "parameterNames": [
      "PCV"
    ],
    "units": [
      "%"
    ],
    "parameterDetails": [
      {
        "name": "PCV",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 40.0,
        "maleHigh": 50.0,
        "femaleLow": 36.0,
        "femaleHigh": 46.0,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Depends on the parameter; may occur with anaemia, infection, inflammation, dehydration or marrow/platelet disorders.",
      "May reflect anaemia, low cell counts or other conditions depending on the parameter.",
      "Usually EDTA blood; follow lab instructions.",
      "Interpret the individual components and age-/sex-specific ranges, not one number alone."
    ]
  },
  {
    "code": "LEG-076",
    "name": "PSA",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 760,
    "offer": 685,
    "parameterNames": [
      "PSA"
    ],
    "units": [
      "ng/mL"
    ],
    "parameterDetails": [
      {
        "name": "PSA",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 4.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-077",
    "name": "PT / Prothrombin Time",
    "category": "Haematology",
    "parameters": 2,
    "price": 180,
    "offer": 160,
    "parameterNames": [
      "PT",
      "INR"
    ],
    "units": [
      "sec",
      ""
    ],
    "parameterDetails": [
      {
        "name": "PT",
        "unit": "sec",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 11.0,
        "maleHigh": 13.5,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "INR",
        "unit": "",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.8,
        "maleHigh": 1.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-078",
    "name": "Phosphorus",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 180,
    "offer": 160,
    "parameterNames": [
      "Phosphorus"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Phosphorus",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 2.5,
        "maleHigh": 4.5,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-079",
    "name": "Platelet Count",
    "category": "Haematology",
    "parameters": 1,
    "price": 100,
    "offer": 90,
    "parameterNames": [
      "Platelet Count"
    ],
    "units": [
      "lakh/cumm"
    ],
    "parameterDetails": [
      {
        "name": "Platelet Count",
        "unit": "lakh/cumm",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 1.5,
        "maleHigh": 4.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Depends on the parameter; may occur with anaemia, infection, inflammation, dehydration or marrow/platelet disorders.",
      "May reflect anaemia, low cell counts or other conditions depending on the parameter.",
      "Usually EDTA blood; follow lab instructions.",
      "Interpret the individual components and age-/sex-specific ranges, not one number alone."
    ]
  },
  {
    "code": "LEG-080",
    "name": "Potassium",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 150,
    "offer": 135,
    "parameterNames": [
      "Potassium"
    ],
    "units": [
      "mmol/L"
    ],
    "parameterDetails": [
      {
        "name": "Potassium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 5.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-081",
    "name": "Pregnancy Test",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 150,
    "offer": 135,
    "parameterNames": [
      "Pregnancy Test"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Pregnancy Test",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Positive result may indicate pregnancy; rare other causes are possible.",
      "Negative result may occur if testing is too early.",
      "Follow kit/lab timing; first-morning urine may help for early testing.",
      "Repeat or serum testing may be advised if pregnancy is still suspected."
    ]
  },
  {
    "code": "LEG-082",
    "name": "Progesterone",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 420,
    "offer": 380,
    "parameterNames": [
      "Progesterone"
    ],
    "units": [
      "ng/mL"
    ],
    "parameterDetails": [
      {
        "name": "Progesterone",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.2,
        "maleHigh": 1.4,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect hormone excess, physiological cycle variation, medication effects or endocrine conditions.",
      "May reflect reduced hormone production or timing-related variation.",
      "Collection time and menstrual-cycle timing may matter; disclose medicines and pregnancy status.",
      "Use age-, sex-, cycle- and pregnancy-specific reference intervals."
    ]
  },
  {
    "code": "LEG-083",
    "name": "Prolactin",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 450,
    "offer": 405,
    "parameterNames": [
      "Prolactin"
    ],
    "units": [
      "ng/mL"
    ],
    "parameterDetails": [
      {
        "name": "Prolactin",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 4.0,
        "maleHigh": 15.0,
        "femaleLow": 4.0,
        "femaleHigh": 23.0,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect hormone excess, physiological cycle variation, medication effects or endocrine conditions.",
      "May reflect reduced hormone production or timing-related variation.",
      "Collection time and menstrual-cycle timing may matter; disclose medicines and pregnancy status.",
      "Use age-, sex-, cycle- and pregnancy-specific reference intervals."
    ]
  },
  {
    "code": "LEG-084",
    "name": "Protein",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 150,
    "offer": 135,
    "parameterNames": [
      "Protein"
    ],
    "units": [
      "g/dL"
    ],
    "parameterDetails": [
      {
        "name": "Protein",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 6.0,
        "maleHigh": 8.3,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-085",
    "name": "Protein / Creatinine Ratio",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 160,
    "offer": 145,
    "parameterNames": [
      "Protein / Creatinine Ratio"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Protein / Creatinine Ratio",
        "unit": "",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.0,
        "maleHigh": 0.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-086",
    "name": "Renal Profile",
    "category": "Biochemistry",
    "parameters": 6,
    "price": 250,
    "offer": 225,
    "parameterNames": [
      "Urea",
      "Creatinine",
      "Uric Acid",
      "Blood Urea Nitrogen (BUN)",
      "Sodium",
      "Potassium"
    ],
    "units": [
      "mg/dL",
      "mg/dL",
      "mg/dL",
      "mg/dL",
      "mmol/L",
      "mmol/L"
    ],
    "parameterDetails": [
      {
        "name": "Urea",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 15.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Creatinine",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.7,
        "maleHigh": 1.3,
        "femaleLow": 0.6,
        "femaleHigh": 1.1,
        "isVerified": false
      },
      {
        "name": "Uric Acid",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 7.2,
        "femaleLow": 2.6,
        "femaleHigh": 6.0,
        "isVerified": false
      },
      {
        "name": "Blood Urea Nitrogen (BUN)",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 7.0,
        "maleHigh": 20.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Sodium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 135.0,
        "maleHigh": 145.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Potassium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 5.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-087",
    "name": "Reticulocyte Count",
    "category": "Haematology",
    "parameters": 1,
    "price": 100,
    "offer": 90,
    "parameterNames": [
      "Reticulocyte Count"
    ],
    "units": [
      "%"
    ],
    "parameterDetails": [
      {
        "name": "Reticulocyte Count",
        "unit": "%",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.5,
        "maleHigh": 2.5,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Depends on the parameter; may occur with anaemia, infection, inflammation, dehydration or marrow/platelet disorders.",
      "May reflect anaemia, low cell counts or other conditions depending on the parameter.",
      "Usually EDTA blood; follow lab instructions.",
      "Interpret the individual components and age-/sex-specific ranges, not one number alone."
    ]
  },
  {
    "code": "LEG-088",
    "name": "Rheumatoid Factor (RF)",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 270,
    "offer": 245,
    "parameterNames": [
      "Rheumatoid Factor (RF)"
    ],
    "units": [
      "IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "Rheumatoid Factor (RF)",
        "unit": "IU/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 14.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-089",
    "name": "Rubella",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 900,
    "offer": 810,
    "parameterNames": [
      "Rubella"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Rubella",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-090",
    "name": "SGOT / AST",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 120,
    "offer": 110,
    "parameterNames": [
      "SGOT / AST"
    ],
    "units": [
      "U/L"
    ],
    "parameterDetails": [
      {
        "name": "SGOT / AST",
        "unit": "U/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 5.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-091",
    "name": "SGPT / ALT",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 120,
    "offer": 110,
    "parameterNames": [
      "SGPT / ALT"
    ],
    "units": [
      "U/L"
    ],
    "parameterDetails": [
      {
        "name": "SGPT / ALT",
        "unit": "U/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 5.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-092",
    "name": "Semen Analysis",
    "category": "Clinical Pathology",
    "parameters": 4,
    "price": 250,
    "offer": 225,
    "parameterNames": [
      "Semen Volume",
      "Sperm Count",
      "Total Motility",
      "Normal Morphology"
    ],
    "units": [
      "mL",
      "million/mL",
      "%",
      "%"
    ],
    "parameterDetails": [
      {
        "name": "Semen Volume",
        "unit": "mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 1.5,
        "maleHigh": 5.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Sperm Count",
        "unit": "million/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 15.0,
        "maleHigh": 200.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Total Motility",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 40.0,
        "maleHigh": 100.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Normal Morphology",
        "unit": "%",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 4.0,
        "maleHigh": 100.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-093",
    "name": "Sickling Test",
    "category": "Haematology",
    "parameters": 1,
    "price": 220,
    "offer": 200,
    "parameterNames": [
      "Sickling Test"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Sickling Test",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-094",
    "name": "Sodium",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 150,
    "offer": 135,
    "parameterNames": [
      "Sodium"
    ],
    "units": [
      "mmol/L"
    ],
    "parameterDetails": [
      {
        "name": "Sodium",
        "unit": "mmol/L",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 135.0,
        "maleHigh": 145.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-095",
    "name": "Sputum Culture",
    "category": "Microbiology",
    "parameters": 1,
    "price": 800,
    "offer": 720,
    "parameterNames": [
      "Result"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Result",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-096",
    "name": "Sputum Routine",
    "category": "Clinical Pathology",
    "parameters": 1,
    "price": 100,
    "offer": 90,
    "parameterNames": [
      "Result"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Result",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-097",
    "name": "Stool Culture",
    "category": "Microbiology",
    "parameters": 1,
    "price": 550,
    "offer": 495,
    "parameterNames": [
      "Result"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Result",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-098",
    "name": "Stool Routine",
    "category": "Clinical Pathology",
    "parameters": 5,
    "price": 100,
    "offer": 90,
    "parameterNames": [
      "Colour",
      "Consistency",
      "Mucus",
      "Ova / Cyst",
      "Occult Blood"
    ],
    "units": [
      "",
      "",
      "",
      "",
      ""
    ],
    "parameterDetails": [
      {
        "name": "Colour",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Consistency",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Mucus",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Ova / Cyst",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Occult Blood",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-099",
    "name": "T3",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 300,
    "offer": 270,
    "parameterNames": [
      "T3"
    ],
    "units": [
      "ng/dL"
    ],
    "parameterDetails": [
      {
        "name": "T3",
        "unit": "ng/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 80.0,
        "maleHigh": 200.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May suggest overactive thyroid or autoimmune activity depending on the test.",
      "May suggest underactive thyroid for hormone tests; antibody results require context.",
      "Usually blood sample; tell the clinician about thyroid medicines and supplements.",
      "Pregnancy and age affect reference intervals; antibody positivity alone is not a complete diagnosis."
    ]
  },
  {
    "code": "LEG-100",
    "name": "T4",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 300,
    "offer": 270,
    "parameterNames": [
      "T4"
    ],
    "units": [
      "\u00b5g/dL"
    ],
    "parameterDetails": [
      {
        "name": "T4",
        "unit": "\u00b5g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 5.1,
        "maleHigh": 14.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May suggest overactive thyroid or autoimmune activity depending on the test.",
      "May suggest underactive thyroid for hormone tests; antibody results require context.",
      "Usually blood sample; tell the clinician about thyroid medicines and supplements.",
      "Pregnancy and age affect reference intervals; antibody positivity alone is not a complete diagnosis."
    ]
  },
  {
    "code": "LEG-101",
    "name": "TSH",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 220,
    "offer": 200,
    "parameterNames": [
      "TSH"
    ],
    "units": [
      "\u00b5IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "TSH",
        "unit": "\u00b5IU/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.4,
        "maleHigh": 4.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May suggest overactive thyroid or autoimmune activity depending on the test.",
      "May suggest underactive thyroid for hormone tests; antibody results require context.",
      "Usually blood sample; tell the clinician about thyroid medicines and supplements.",
      "Pregnancy and age affect reference intervals; antibody positivity alone is not a complete diagnosis."
    ]
  },
  {
    "code": "LEG-102",
    "name": "Thyroglobulin",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 1250,
    "offer": 1125,
    "parameterNames": [
      "Thyroglobulin"
    ],
    "units": [
      "ng/mL"
    ],
    "parameterDetails": [
      {
        "name": "Thyroglobulin",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 77.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May occur with liver-cell injury, bile-duct problems, alcohol/medicine effects or other conditions.",
      "May reflect reduced protein production or other causes depending on the marker.",
      "Usually blood sample; fasting depends on panel and laboratory.",
      "Enzyme elevation does not by itself establish a specific liver disease."
    ]
  },
  {
    "code": "LEG-103",
    "name": "Thyroid Profile (T3, T4, TSH)",
    "category": "Biochemistry",
    "parameters": 3,
    "price": 550,
    "offer": 495,
    "parameterNames": [
      "T3",
      "T4",
      "TSH"
    ],
    "units": [
      "ng/dL",
      "\u00b5g/dL",
      "\u00b5IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "T3",
        "unit": "ng/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 80.0,
        "maleHigh": 200.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "T4",
        "unit": "\u00b5g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 5.1,
        "maleHigh": 14.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "TSH",
        "unit": "\u00b5IU/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.4,
        "maleHigh": 4.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May suggest overactive thyroid or autoimmune activity depending on the test.",
      "May suggest underactive thyroid for hormone tests; antibody results require context.",
      "Usually blood sample; tell the clinician about thyroid medicines and supplements.",
      "Pregnancy and age affect reference intervals; antibody positivity alone is not a complete diagnosis."
    ]
  },
  {
    "code": "LEG-104",
    "name": "Thyroid Profile (unspecified)",
    "category": "Biochemistry",
    "parameters": 3,
    "price": 450,
    "offer": 405,
    "parameterNames": [
      "T3",
      "T4",
      "TSH"
    ],
    "units": [
      "ng/dL",
      "\u00b5g/dL",
      "\u00b5IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "T3",
        "unit": "ng/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 80.0,
        "maleHigh": 200.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "T4",
        "unit": "\u00b5g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 5.1,
        "maleHigh": 14.1,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "TSH",
        "unit": "\u00b5IU/mL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.4,
        "maleHigh": 4.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May suggest overactive thyroid or autoimmune activity depending on the test.",
      "May suggest underactive thyroid for hormone tests; antibody results require context.",
      "Usually blood sample; tell the clinician about thyroid medicines and supplements.",
      "Pregnancy and age affect reference intervals; antibody positivity alone is not a complete diagnosis."
    ]
  },
  {
    "code": "LEG-105",
    "name": "Total IgE",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 900,
    "offer": 810,
    "parameterNames": [
      "Total IgE"
    ],
    "units": [
      "IU/mL"
    ],
    "parameterDetails": [
      {
        "name": "Total IgE",
        "unit": "IU/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 0.0,
        "maleHigh": 100.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-106",
    "name": "Toxoplasma",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 700,
    "offer": 630,
    "parameterNames": [
      "Toxoplasma"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Toxoplasma",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-107",
    "name": "Troponin-I",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 1050,
    "offer": 945,
    "parameterNames": [
      "Troponin-I"
    ],
    "units": [
      "ng/mL"
    ],
    "parameterDetails": [
      {
        "name": "Troponin-I",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 2,
        "maleLow": 0.0,
        "maleHigh": 0.04,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May be associated with the condition being investigated, but false positives and non-disease causes are possible.",
      "A low/negative result may be normal or may not exclude disease, depending on the assay.",
      "Follow the laboratory's sample, fasting and timing instructions.",
      "Use the exact assay's report range and clinician interpretation; this is a general educational note."
    ]
  },
  {
    "code": "LEG-108",
    "name": "Urea",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 100,
    "offer": 90,
    "parameterNames": [
      "Urea"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Urea",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 15.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-109",
    "name": "Uric Acid",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 120,
    "offer": 110,
    "parameterNames": [
      "Uric Acid"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Uric Acid",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 7.2,
        "femaleLow": 2.6,
        "femaleHigh": 6.0,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect reduced kidney function, dehydration, medicines or electrolyte disturbance depending on the analyte.",
      "May reflect overhydration, nutritional/endocrine issues or other causes depending on the analyte.",
      "Blood sample; some tests require special handling; follow lab instructions.",
      "Creatinine depends partly on muscle mass; interpret with eGFR and clinical context where appropriate."
    ]
  },
  {
    "code": "LEG-110",
    "name": "Urine Culture",
    "category": "Microbiology",
    "parameters": 1,
    "price": 850,
    "offer": 765,
    "parameterNames": [
      "Result"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "Result",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-111",
    "name": "Urine Routine",
    "category": "Clinical Pathology",
    "parameters": 8,
    "price": 80,
    "offer": 70,
    "parameterNames": [
      "Colour",
      "Appearance",
      "Albumin",
      "Sugar",
      "pH",
      "Pus Cells",
      "RBCs",
      "Epithelial Cells"
    ],
    "units": [
      "",
      "",
      "g/dL",
      "",
      "",
      "",
      "",
      ""
    ],
    "parameterDetails": [
      {
        "name": "Colour",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Appearance",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Albumin",
        "unit": "g/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 3.5,
        "maleHigh": 5.2,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Sugar",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "pH",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Pus Cells",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "RBCs",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Epithelial Cells",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May indicate infection, blood, protein, glucose or kidney/urinary tract issues.",
      "Often not meaningful in isolation; depends on the measured component.",
      "Clean-catch midstream sample may be requested; culture samples need sterile collection.",
      "Hydration, contamination and collection technique can affect results."
    ]
  },
  {
    "code": "LEG-112",
    "name": "VDRL",
    "category": "Serology / Immunology",
    "parameters": 1,
    "price": 140,
    "offer": 125,
    "parameterNames": [
      "VDRL"
    ],
    "units": [
      ""
    ],
    "parameterDetails": [
      {
        "name": "VDRL",
        "unit": "",
        "type": "Qualitative",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  },
  {
    "code": "LEG-113",
    "name": "VLDL",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 100,
    "offer": 90,
    "parameterNames": [
      "VLDL"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "VLDL",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 5.0,
        "maleHigh": 40.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "Higher LDL/non-HDL/triglycerides may increase cardiovascular risk; interpretation depends on age and overall risk.",
      "Very low values need context; low HDL can be a risk marker.",
      "Fasting may be requested for selected situations; follow the ordering clinician/lab instructions.",
      "See the dedicated Lipid Profile Reference Notes sheet. Values are not a diagnosis or a personal treatment target."
    ]
  },
  {
    "code": "LEG-114",
    "name": "Vitamin A",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 2500,
    "offer": 2250,
    "parameterNames": [
      "Vitamin A"
    ],
    "units": [
      "\u00b5g/dL"
    ],
    "parameterDetails": [
      {
        "name": "Vitamin A",
        "unit": "\u00b5g/dL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 20.0,
        "maleHigh": 60.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect excess supplementation, inflammation (for ferritin) or other causes.",
      "May indicate deficiency or depleted stores, depending on the marker.",
      "Tell the clinician about supplements; fasting requirements vary.",
      "Ferritin can rise with inflammation; interpret with other iron studies and clinical history."
    ]
  },
  {
    "code": "LEG-115",
    "name": "Vitamin B12",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 900,
    "offer": 810,
    "parameterNames": [
      "Vitamin B12"
    ],
    "units": [
      "pg/mL"
    ],
    "parameterDetails": [
      {
        "name": "Vitamin B12",
        "unit": "pg/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 200.0,
        "maleHigh": 900.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect excess supplementation, inflammation (for ferritin) or other causes.",
      "May indicate deficiency or depleted stores, depending on the marker.",
      "Tell the clinician about supplements; fasting requirements vary.",
      "Ferritin can rise with inflammation; interpret with other iron studies and clinical history."
    ]
  },
  {
    "code": "LEG-116",
    "name": "Vitamin C",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 2500,
    "offer": 2250,
    "parameterNames": [
      "Vitamin C"
    ],
    "units": [
      "mg/dL"
    ],
    "parameterDetails": [
      {
        "name": "Vitamin C",
        "unit": "mg/dL",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 0.4,
        "maleHigh": 2.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect excess supplementation, inflammation (for ferritin) or other causes.",
      "May indicate deficiency or depleted stores, depending on the marker.",
      "Tell the clinician about supplements; fasting requirements vary.",
      "Ferritin can rise with inflammation; interpret with other iron studies and clinical history."
    ]
  },
  {
    "code": "LEG-117",
    "name": "Vitamin D (25-OH)",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 1500,
    "offer": 1350,
    "parameterNames": [
      "Vitamin D (25-OH)"
    ],
    "units": [
      "ng/mL"
    ],
    "parameterDetails": [
      {
        "name": "Vitamin D (25-OH)",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 30.0,
        "maleHigh": 100.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect excess supplementation, inflammation (for ferritin) or other causes.",
      "May indicate deficiency or depleted stores, depending on the marker.",
      "Tell the clinician about supplements; fasting requirements vary.",
      "Ferritin can rise with inflammation; interpret with other iron studies and clinical history."
    ]
  },
  {
    "code": "LEG-118",
    "name": "Vitamin D + B12 Panel",
    "category": "Biochemistry",
    "parameters": 2,
    "price": 1820,
    "offer": 1640,
    "parameterNames": [
      "Vitamin D (25-OH)",
      "Vitamin B12"
    ],
    "units": [
      "ng/mL",
      "pg/mL"
    ],
    "parameterDetails": [
      {
        "name": "Vitamin D (25-OH)",
        "unit": "ng/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 30.0,
        "maleHigh": 100.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "Vitamin B12",
        "unit": "pg/mL",
        "type": "Numeric",
        "precision": 0,
        "maleLow": 200.0,
        "maleHigh": 900.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "May reflect excess supplementation, inflammation (for ferritin) or other causes.",
      "May indicate deficiency or depleted stores, depending on the marker.",
      "Tell the clinician about supplements; fasting requirements vary.",
      "Ferritin can rise with inflammation; interpret with other iron studies and clinical history."
    ]
  },
  {
    "code": "LEG-119",
    "name": "Vitamin E",
    "category": "Biochemistry",
    "parameters": 1,
    "price": 2250,
    "offer": 2025,
    "parameterNames": [
      "Vitamin E"
    ],
    "units": [
      "mg/L"
    ],
    "parameterDetails": [
      {
        "name": "Vitamin E",
        "unit": "mg/L",
        "type": "Numeric",
        "precision": 1,
        "maleLow": 5.5,
        "maleHigh": 17.0,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": false,
    "notes": [
      "May reflect excess supplementation, inflammation (for ferritin) or other causes.",
      "May indicate deficiency or depleted stores, depending on the marker.",
      "Tell the clinician about supplements; fasting requirements vary.",
      "Ferritin can rise with inflammation; interpret with other iron studies and clinical history."
    ]
  },
  {
    "code": "LEG-120",
    "name": "Widal",
    "category": "Serology / Immunology",
    "parameters": 4,
    "price": 140,
    "offer": 125,
    "parameterNames": [
      "S.Typhi O",
      "S.Typhi H",
      "S.Paratyphi AH",
      "S.Paratyphi BH"
    ],
    "units": [
      "",
      "",
      "",
      ""
    ],
    "parameterDetails": [
      {
        "name": "S.Typhi O",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "S.Typhi H",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "S.Paratyphi AH",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      },
      {
        "name": "S.Paratyphi BH",
        "unit": "",
        "type": "Text",
        "precision": 2,
        "maleLow": null,
        "maleHigh": null,
        "femaleLow": null,
        "femaleHigh": null,
        "isVerified": false
      }
    ],
    "active": true,
    "isPanel": true,
    "notes": [
      "A positive/reactive result may indicate current or past infection depending on the assay.",
      "A negative result may not exclude very early infection or infection outside the test's detection window.",
      "Sample type and timing are test-specific; follow collection instructions.",
      "Confirmatory testing and clinical correlation may be required; screening tests are not always definitive."
    ]
  }
];
