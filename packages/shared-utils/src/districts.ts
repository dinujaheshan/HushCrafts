export const SRI_LANKAN_DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Kilinochchi',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Moneragala',
  'Ratnapura',
  'Kegalle'
] as const;

export type SriLankanDistrict = typeof SRI_LANKAN_DISTRICTS[number];

/**
 * Get shipping fee in LKR based on Sri Lankan district
 */
export function getShippingFee(district: string): number {
  const normalizedDistrict = district.trim().toLowerCase();
  
  if (normalizedDistrict === 'colombo' || normalizedDistrict === 'gampaha') {
    return 350; // Inner Metro
  }
  
  // Verify it is a valid district
  const isValid = SRI_LANKAN_DISTRICTS.some(
    d => d.toLowerCase() === normalizedDistrict
  );
  
  if (!isValid) {
    throw new Error(`Invalid Sri Lankan district: ${district}`);
  }
  
  return 500; // Outstation / Remote
}
