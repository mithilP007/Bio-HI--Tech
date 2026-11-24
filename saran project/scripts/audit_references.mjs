import fs from 'fs';
import path from 'path';

const html = fs.readFileSync('/home/mithil/Downloads/BIO-HI-TECH-LIMS/legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'utf8');

const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>', scriptStart);
const script = html.slice(scriptStart + 8, scriptEnd);

// Extract D
const dMatch = script.match(/const D=(\[[\s\S]*?\]),\s*LAB=/);
const D = eval(dMatch[1]);

// Extract S
const sMatch = script.match(/const S=\{\};`([^`]+)`\.split\(';'\)/);
const S_raw = sMatch[1];
const S = {};
S_raw.split(';').forEach(entry => {
  const [k, v] = entry.split('=');
  if (k && v) S[k.trim()] = v.trim();
});

// Extract panels
const cbcMatch = script.match(/const CBC=(\[[\s\S]*?\]),KID=(\[[\s\S]*?\]),ELE=(\[[\s\S]*?\]),TH=(\[[\s\S]*?\]),LIP=(\[[\s\S]*?\]);/);
const CBC = eval(cbcMatch[1]);
const KID = eval(cbcMatch[2]);
const ELE = eval(cbcMatch[3]);
const TH = eval(cbcMatch[4]);
const LIP = eval(cbcMatch[5]);

const rgMatch = script.match(/const RG=\{([\s\S]*?)\};/);
// evaluate RG in context
const RG = eval(`({ ${rgMatch[1]} })`);

console.log('Total tests in D:', D.length);
console.log('Total keys in S:', Object.keys(S).length);
console.log('Total panels in RG:', Object.keys(RG).length);

function pars(name) {
  const ns = RG[name] || (S[name] ? [name] : ['Result']);
  return ns.map(n => {
    const v = S[n] || 't';
    if (v === 't' || v === 'q') return { n, t: v };
    const a = v.split('|');
    return {
      n,
      t: 'n',
      u: a[0],
      lo: +a[1],
      hi: +a[2],
      flo: a[3] ? +a[3] : null,
      fhi: a[4] ? +a[4] : null,
      raw: v
    };
  });
}

// Audit all 120 tests and their parameters
let totalParameterInstances = 0;
let numericInstances = 0;
let qualitativeInstances = 0;
let textInstances = 0;
let sexSpecificInstances = 0;
const paramMap = new Map();

D.forEach(([testName, price, offer], testIdx) => {
  const params = pars(testName);
  params.forEach(p => {
    totalParameterInstances++;
    if (p.t === 'n') {
      numericInstances++;
      if (p.flo != null && p.fhi != null) sexSpecificInstances++;
    } else if (p.t === 'q') {
      qualitativeInstances++;
    } else {
      textInstances++;
    }

    if (!paramMap.has(p.n)) {
      paramMap.set(p.n, { count: 0, tests: [], spec: p });
    }
    const entry = paramMap.get(p.n);
    entry.count++;
    entry.tests.push(testName);
  });
});

console.log('Total Parameter Instances:', totalParameterInstances);
console.log('Numeric Parameter Instances:', numericInstances, `(${sexSpecificInstances} sex-specific)`);
console.log('Qualitative Parameter Instances:', qualitativeInstances);
console.log('Text Parameter Instances:', textInstances);
console.log('Unique Parameters Count:', paramMap.size);

// Print sex-specific parameters
console.log('\n--- SEX-SPECIFIC PARAMETERS ---');
for (const [pName, data] of paramMap.entries()) {
  if (data.spec.t === 'n' && data.spec.flo != null) {
    console.log(`- ${pName} (${data.spec.u}): Male [${data.spec.lo} - ${data.spec.hi}], Female [${data.spec.flo} - ${data.spec.fhi}] | Used in: ${data.tests.join(', ')}`);
  }
}

// Check qualitative parameters
console.log('\n--- QUALITATIVE PARAMETERS ---');
for (const [pName, data] of paramMap.entries()) {
  if (data.spec.t === 'q') {
    console.log(`- ${pName} (Expected: Negative) | Used in: ${data.tests.join(', ')}`);
  }
}

// Check text parameters
console.log('\n--- TEXT / CULTURE / DESCRIPTIVE PARAMETERS ---');
for (const [pName, data] of paramMap.entries()) {
  if (data.spec.t === 't') {
    console.log(`- ${pName} | Used in: ${data.tests.join(', ')}`);
  }
}
