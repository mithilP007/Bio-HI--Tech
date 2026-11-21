import { UserPlus, FileCheck2, CreditCard, Settings2 } from 'lucide-react'
import { legacyTests, type CatalogueTest, type TestParameter, legacyInterpretationNotes } from '@/lib/catalogue-data'

export type { CatalogueTest, TestParameter }
export { legacyInterpretationNotes }

export const patients = [
 {id:'BHT-02486',name:'Ananya Sharma',age:34,gender:'Female',phone:'+91 98765 43210',doctor:'Dr. R. Kapoor',date:'21 Nov 2026',reports:2},
 {id:'BHT-02485',name:'Rohan Desai',age:52,gender:'Male',phone:'+91 98201 74563',doctor:'Dr. Meera Shah',date:'21 Nov 2026',reports:1},
 {id:'BHT-02484',name:'Priya Nair',age:28,gender:'Female',phone:'+91 99876 12345',doctor:'Dr. A. Kulkarni',date:'20 Nov 2026',reports:3},
 {id:'BHT-02483',name:'Vikram Patel',age:46,gender:'Male',phone:'+91 97654 32109',doctor:'Dr. R. Kapoor',date:'20 Nov 2026',reports:1},
 {id:'BHT-02482',name:'Fatima Khan',age:39,gender:'Female',phone:'+91 98920 33445',doctor:'Dr. S. Iyer',date:'19 Nov 2026',reports:2},
 {id:'BHT-02481',name:'Arjun Menon',age:61,gender:'Male',phone:'+91 98190 87654',doctor:'Dr. Meera Shah',date:'19 Nov 2026',reports:4},
 {id:'BHT-02480',name:'Kavya Iyer',age:31,gender:'Female',phone:'+91 99301 56789',doctor:'Dr. A. Kulkarni',date:'18 Nov 2026',reports:1},
 {id:'BHT-02479',name:'Sameer Joshi',age:43,gender:'Male',phone:'+91 98211 45678',doctor:'Dr. S. Iyer',date:'18 Nov 2026',reports:2},
 {id:'BHT-02478',name:'Neha Rao',age:25,gender:'Female',phone:'+91 98700 11223',doctor:'Dr. R. Kapoor',date:'17 Nov 2026',reports:1},
 {id:'BHT-02477',name:'Kabir Malhotra',age:57,gender:'Male',phone:'+91 98111 22334',doctor:'Dr. Meera Shah',date:'17 Nov 2026',reports:2}
]

export const reports = [
 {
   id:'RPT-261121-032',
   patient:'Ananya Sharma',
   patientId:'BHT-02486',
   date:'21 Nov 2026',
   tests:3,
   testNames:['CBC / Hemogram','Liver Function Test (LFT)','Lipid Profile'],
   results:{
     'CBC / Hemogram:Hemoglobin':'13.4',
     'CBC / Hemogram:Total WBC Count':'7200',
     'CBC / Hemogram:RBC Count':'4.6',
     'CBC / Hemogram:PCV':'41',
     'CBC / Hemogram:MCV':'88',
     'CBC / Hemogram:MCH':'29',
     'CBC / Hemogram:MCHC':'33.1',
     'CBC / Hemogram:Platelet Count':'2.4',
     'CBC / Hemogram:Neutrophils':'62',
     'CBC / Hemogram:Lymphocytes':'30',
     'CBC / Hemogram:Eosinophils':'4',
     'CBC / Hemogram:Monocytes':'3',
     'CBC / Hemogram:Basophils':'1',
     'Liver Function Test (LFT):Total Bilirubin':'0.9',
     'Liver Function Test (LFT):Direct Bilirubin':'0.2',
     'Liver Function Test (LFT):Indirect Bilirubin':'0.7',
     'Liver Function Test (LFT):SGOT / AST':'28',
     'Liver Function Test (LFT):SGPT / ALT':'32',
     'Liver Function Test (LFT):Alkaline Phosphatase':'95',
     'Liver Function Test (LFT):Protein':'7.2',
     'Liver Function Test (LFT):Albumin':'4.4',
     'Liver Function Test (LFT):Globulin':'2.8',
     'Liver Function Test (LFT):A/G Ratio':'1.57',
     'Lipid Profile:Cholesterol':'185',
     'Lipid Profile:Triglycerides':'130',
     'Lipid Profile:HDL Cholesterol':'52',
     'Lipid Profile:LDL Cholesterol':'107',
     'Lipid Profile:VLDL':'26',
     'Lipid Profile:Chol/HDL Ratio':'3.56'
   } as Record<string,string>,
   amount:1105, // 250 + 450 + 405 (exact legacy offer prices)
   status:'Draft',
   payment:'Pending'
 },
 {
   id:'RPT-261121-031',
   patient:'Rohan Desai',
   patientId:'BHT-02485',
   date:'21 Nov 2026',
   tests:2,
   testNames:['Blood Sugar (unspecified)','HbA1c'],
   results:{
     'Blood Sugar (unspecified):Blood Sugar (unspecified)':'92',
     'HbA1c:HbA1c':'5.4'
   } as Record<string,string>,
   amount:440, // 45 + 395
   status:'Issued',
   payment:'Paid'
 },
 {
   id:'RPT-261120-030',
   patient:'Priya Nair',
   patientId:'BHT-02484',
   date:'20 Nov 2026',
   tests:4,
   testNames:['CBC / Hemogram','Liver Function Test (LFT)','Lipid Profile','Thyroid Profile (T3, T4, TSH)'],
   results:{
     'CBC / Hemogram:Hemoglobin':'12.8',
     'CBC / Hemogram:Total WBC Count':'6800',
     'CBC / Hemogram:Platelet Count':'2.1',
     'Liver Function Test (LFT):Total Bilirubin':'0.7',
     'Lipid Profile:Cholesterol':'195',
     'Thyroid Profile (T3, T4, TSH):T3':'120',
     'Thyroid Profile (T3, T4, TSH):T4':'8.5',
     'Thyroid Profile (T3, T4, TSH):TSH':'2.4'
   } as Record<string,string>,
   amount:1600, // 250 + 450 + 405 + 495
   status:'Issued',
   payment:'Paid'
 },
 {
   id:'RPT-261120-029',
   patient:'Vikram Patel',
   patientId:'BHT-02483',
   date:'20 Nov 2026',
   tests:1,
   testNames:['CBC / Hemogram'],
   results:{
     'CBC / Hemogram:Hemoglobin':'15.2',
     'CBC / Hemogram:Total WBC Count':'7900',
     'CBC / Hemogram:Platelet Count':'3.1'
   } as Record<string,string>,
   amount:250,
   status:'Issued',
   payment:'Pending'
 },
 {
   id:'RPT-261119-028',
   patient:'Fatima Khan',
   patientId:'BHT-02482',
   date:'19 Nov 2026',
   tests:2,
   testNames:['CBC / Hemogram','Lipid Profile'],
   results:{
     'CBC / Hemogram:Hemoglobin':'11.9',
     'Lipid Profile:Cholesterol':'210'
   } as Record<string,string>,
   amount:655, // 250 + 405
   status:'Draft',
   payment:'Pending'
 },
 {
   id:'RPT-261119-027',
   patient:'Arjun Menon',
   patientId:'BHT-02481',
   date:'19 Nov 2026',
   tests:3,
   testNames:['Liver Function Test (LFT)','Lipid Profile','CBC / Hemogram'],
   results:{
     'Liver Function Test (LFT):Total Bilirubin':'1.1',
     'Lipid Profile:Cholesterol':'225',
     'CBC / Hemogram:Hemoglobin':'14.1'
   } as Record<string,string>,
   amount:1105,
   status:'Issued',
   payment:'Paid'
 },
 {
   id:'RPT-261118-026',
   patient:'Kavya Iyer',
   patientId:'BHT-02480',
   date:'18 Nov 2026',
   tests:1,
   testNames:['Urine Culture'],
   results:{
     'Urine Culture:Result':'Specimen shows significant growth of Escherichia coli (> 100,000 CFU/mL). Sensitive to Nitrofurantoin, Amikacin, Meropenem. Resistant to Ampicillin, Ciprofloxacin. Clinical correlation suggested.'
   } as Record<string,string>,
   amount:550,
   status:'Issued',
   payment:'Paid'
 },
 {
   id:'RPT-261118-025',
   patient:'Sameer Joshi',
   patientId:'BHT-02479',
   date:'18 Nov 2026',
   tests:1,
   testNames:['Lipid Profile'],
   results:{
     'Lipid Profile:Cholesterol':'240',
     'Lipid Profile:Triglycerides':'190',
     'Lipid Profile:HDL Cholesterol':'38',
     'Lipid Profile:LDL Cholesterol':'164',
     'Lipid Profile:VLDL':'38',
     'Lipid Profile:Chol/HDL Ratio':'6.31'
   } as Record<string,string>,
   amount:405,
   status:'Issued',
   payment:'Paid'
 }
]

export const tests: CatalogueTest[] = legacyTests

export const activities = [
 {text:'New patient registered',detail:'Ananya Sharma · BHT-02486',time:'8 min ago',icon:UserPlus},
 {text:'Report saved as draft',detail:'RPT-261121-032 · Ananya Sharma',time:'22 min ago',icon:FileCheck2},
 {text:'Payment recorded',detail:'₹1,240 · RPT-261121-031',time:'1 hour ago',icon:CreditCard},
 {text:'Test price updated',detail:'Lipid Profile · Catalogue',time:'3 hours ago',icon:Settings2}
]

