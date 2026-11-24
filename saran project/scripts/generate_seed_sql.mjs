import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('data/legacy/test-catalogue.json', 'utf8'));

let catalogueSql = '-- 120-TEST SYSTEM CATALOGUE SEED DATA\n';
let paramsSql = '-- 124 PARAMETER SPECIFICATIONS SEED DATA\n';

for (const test of rawData) {
  const code = test.id;
  const name = test.name.replace(/'/g, "''");
  // Normalize category
  let category = 'Biochemistry';
  const dep = (test.department || '').toUpperCase();
  if (dep.includes('HAEM') || dep.includes('HEMA')) category = 'Haematology';
  else if (dep.includes('CLINICAL') || dep.includes('PATH')) category = 'Clinical Pathology';
  else if (dep.includes('MICRO')) category = 'Microbiology';
  else if (dep.includes('SERO') || dep.includes('IMMUN')) category = 'Serology / Immunology';
  else if (dep.includes('BIO')) category = 'Biochemistry';
  else category = 'Biochemistry';

  const normalPrice = Number(test.normalPrice || 0);
  const discountPrice = Number(test.discountPrice || normalPrice);
  const paramCount = test.parameters ? test.parameters.length : (test.parameterCount || 1);
  const isPanel = Boolean(test.isPanel);
  const notesJson = JSON.stringify(test.notes || []).replace(/'/g, "''");

  catalogueSql += `INSERT INTO public.test_catalogue (code, owner_id, name, category, normal_price, discount_price, parameters_count, active, is_panel, notes) `
    + `VALUES ('${code}', NULL, '${name}', '${category}', ${normalPrice}, ${discountPrice}, ${paramCount}, TRUE, ${isPanel}, '${notesJson}'::jsonb) `
    + `ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, normal_price = EXCLUDED.normal_price, discount_price = EXCLUDED.discount_price, notes = EXCLUDED.notes;\n`;

  if (test.parameters && test.parameters.length > 0) {
    let order = 0;
    for (const param of test.parameters) {
      const pName = (param.name || test.name).replace(/'/g, "''");
      const dType = ['Numeric', 'Qualitative', 'Text'].includes(param.dataType) ? param.dataType : 'Numeric';
      const unit = (param.unit || '').replace(/'/g, "''");
      const precision = Number.isInteger(param.precision) ? param.precision : 2;
      const maleLow = param.maleLow != null ? Number(param.maleLow) : 'NULL';
      const maleHigh = param.maleHigh != null ? Number(param.maleHigh) : 'NULL';
      const femaleLow = param.femaleLow != null ? Number(param.femaleLow) : 'NULL';
      const femaleHigh = param.femaleHigh != null ? Number(param.femaleHigh) : 'NULL';

      paramsSql += `INSERT INTO public.test_parameters (test_code, name, data_type, unit, precision, male_low, male_high, female_low, female_high, sort_order, is_verified) `
        + `VALUES ('${code}', '${pName}', '${dType}', '${unit}', ${precision}, ${maleLow}, ${maleHigh}, ${femaleLow}, ${femaleHigh}, ${order}, FALSE);\n`;
      order++;
    }
  }
}

console.log('Catalogue SQL generated, total tests:', rawData.length);
fs.writeFileSync('scripts/seed_catalogue_gen.sql', catalogueSql + '\n' + paramsSql);
