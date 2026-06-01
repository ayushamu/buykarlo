export interface Campus {
  name: string
  active: boolean
  short: string
}

export const CAMPUSES: Campus[] = [
  { name: "Aligarh Muslim University (AMU)", active: true, short: "AMU" },
  { name: "Delhi University (DU)", active: true, short: "DU" },
  { name: "Jamia Millia Islamia (JMI)", active: true, short: "JMI" },
  { name: "Jawaharlal Nehru University (JNU)", active: false, short: "JNU" },
  { name: "Banaras Hindu University (BHU)", active: false, short: "BHU" },
  { name: "University of Hyderabad (UoH)", active: false, short: "UoH" },
  { name: "Allahabad University (UoA)", active: false, short: "UoA" },
  { name: "Pondicherry University", active: false, short: "Pondicherry" },
  { name: "Visva-Bharati University", active: false, short: "Visva-Bharati" },
  { name: "North-Eastern Hill University (NEHU)", active: false, short: "NEHU" },
  { name: "Babasaheb Bhimrao Ambedkar University (BBAU)", active: false, short: "BBAU" },
  { name: "Tezpur University", active: false, short: "Tezpur" },
  { name: "UPES Dehradun", active: false, short: "UPES" },
  { name: "BITS Pilani", active: false, short: "BITS" },
  { name: "IIT Delhi (IITD)", active: false, short: "IITD" },
  { name: "IIT Bombay (IITB)", active: false, short: "IITB" }
]
