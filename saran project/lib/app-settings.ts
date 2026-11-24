export const labProfile = {
  laboratoryName: 'BIO HI TECH',
  address: '#3/120, Tirupur Road, Peumanallur - 641 666. Tirupur District',
  phone: '0421 2351981',
  whatsapp: '80987 90981 \\ 99525 88981',
  email: 'biohitech2018@gmail.com',
  registrationNumber: '',
  ownerName: 'Dr. Arun Kumar',
  ownerDesignation: 'Chief Pathologist & Lab Director',
}

export interface SignatureConfig {
  id: string
  name: string
  designation: string
  imagePath: string
  authorizationStatus: 'Pending Owner Approval' | 'Authorized' | 'Disabled'
  enabledOnReport: boolean
  isCryptographic: false // Explicitly note: facsimile image, NOT a cryptographic digital signature
}

export const defaultSignatures: {
  technologist: SignatureConfig
  director: SignatureConfig
} = {
  technologist: {
    id: 'sig-a',
    name: 'Mr. J. SRIDHAR. M.Sc, [MLT], DMLT, DXRT, DHI',
    designation: 'Lab Technologist',
    imagePath: '/branding/signature-a-original.png',
    authorizationStatus: 'Pending Owner Approval',
    enabledOnReport: true,
    isCryptographic: false,
  },
  director: {
    id: 'sig-b',
    name: 'Dr. Arun Mehta',
    designation: 'Pathologist / Laboratory Director',
    imagePath: '/branding/signature-b-original.png',
    authorizationStatus: 'Pending Owner Approval',
    enabledOnReport: true,
    isCryptographic: false,
  },
}

export const appPreferences: Record<string, string | boolean> = {
  reportFormat: 'A4 portrait',
  reportFooter: 'Thank you for choosing BIO HI TECH',
  currency: 'INR',
  defaultDiscount: '0',
  dateFormat: 'DD MMM YYYY',
  timezone: 'Asia/Kolkata',
  notifications: true,
  brandColor: '#0F9D8C',
  logoPreview: '',
  letterheadPreview: '',
  signaturePreview: '',
  technologistSignatureEnabled: true,
  technologistSignatureStatus: 'Pending Owner Approval',
  technologistName: 'Mr. J. SRIDHAR. M.Sc, [MLT], DMLT, DXRT, DHI',
  technologistDesignation: 'Lab Technologist',
  directorSignatureEnabled: true,
  directorSignatureStatus: 'Pending Owner Approval',
  directorName: 'Dr. Arun Mehta',
  directorDesignation: 'Pathologist / Laboratory Director',
}
