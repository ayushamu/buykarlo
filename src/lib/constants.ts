export interface Campus {
  name: string
  active: boolean
  short: string
  city: string
}

export const CAMPUSES: Campus[] = [
  { name: "Aligarh Muslim University (AMU)", active: true, short: "AMU", city: "Aligarh" },
  { name: "Delhi University (DU)", active: true, short: "DU", city: "Delhi" },
  { name: "Jamia Millia Islamia (JMI)", active: true, short: "JMI", city: "Delhi" },
  { name: "Jawaharlal Nehru University (JNU)", active: true, short: "JNU", city: "Delhi" },
  { name: "Banaras Hindu University (BHU)", active: true, short: "BHU", city: "Varanasi" },
  { name: "University of Hyderabad (UoH)", active: true, short: "UoH", city: "Hyderabad" },
  { name: "BITS Pilani", active: true, short: "BITS", city: "Pilani" },
  { name: "IIT Delhi (IITD)", active: true, short: "IITD", city: "Delhi" },
  { name: "IIT Bombay (IITB)", active: true, short: "IITB", city: "Mumbai" },
  { name: "Allahabad University (UoA)", active: false, short: "UoA", city: "Prayagraj" },
  { name: "Pondicherry University", active: false, short: "Pondicherry", city: "Pondicherry" },
  { name: "Visva-Bharati University", active: false, short: "Visva-Bharati", city: "Santiniketan" },
  { name: "North-Eastern Hill University (NEHU)", active: false, short: "NEHU", city: "Shillong" },
  { name: "Babasaheb Bhimrao Ambedkar University (BBAU)", active: false, short: "BBAU", city: "Lucknow" },
  { name: "Tezpur University", active: false, short: "Tezpur", city: "Tezpur" },
  { name: "UPES Dehradun", active: false, short: "UPES", city: "Dehradun" }
]

export function getNearbyCampuses(currentCampusName: string): Campus[] {
  const current = CAMPUSES.find(c => c.name === currentCampusName)
  if (!current || !current.city) return []
  return CAMPUSES.filter(c => c.active && c.name !== currentCampusName && c.city === current.city)
}

