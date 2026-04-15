export interface TableConfig {
  tableName: string;
  jsonColumns?: string[];
}

export const DATA_FILE_TABLES: Record<string, TableConfig> = {
  "crew_members.xlsx": { tableName: "crew_members", jsonColumns: ["emergency_contact", "bank_details"] },
  "certifications.xlsx": { tableName: "certifications", jsonColumns: ["ai_extracted_data"] },
  "sea_contracts.xlsx": { tableName: "sea_contracts" },
  "rest_hours_log.xlsx": { tableName: "rest_hours_log" },
  "crew_changes.xlsx": { tableName: "crew_changes", jsonColumns: ["flight_details", "hotel_details"] },
  "vessels.xlsx": { tableName: "vessels", jsonColumns: ["required_manning"] },
  "candidates.xlsx": { tableName: "candidates", jsonColumns: ["ai_parsed_data"] },
  "pre_joining_checklists.xlsx": { tableName: "pre_joining_checklists" },
  "recruitment_requisitions.xlsx": { tableName: "recruitment_requisitions", jsonColumns: ["required_cert_types"] },
};

export function getTableConfig(filename: string) {
  return DATA_FILE_TABLES[filename];
}
