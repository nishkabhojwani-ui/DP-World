create extension if not exists pgcrypto;

create table if not exists vessels (
  id uuid primary key,
  name text not null,
  imo_number text,
  flag_state text,
  vessel_type text,
  home_port text,
  gross_tonnage integer,
  required_manning jsonb,
  current_port text,
  status text,
  trading_area text
);

create table if not exists crew_members (
  id uuid primary key,
  full_name text not null,
  rank text not null,
  rank_category text,
  nationality text,
  date_of_birth date,
  seaman_book_no text,
  seaman_book_expiry date,
  passport_no text,
  passport_expiry date,
  status text,
  current_vessel_id uuid references vessels(id),
  home_airport text,
  next_available_date date,
  photo_url text,
  emergency_contact jsonb,
  bank_details jsonb
);

create table if not exists certifications (
  id uuid primary key,
  crew_id uuid references crew_members(id),
  cert_type text,
  cert_number text,
  issuing_authority text,
  issued_date date,
  expiry_date date,
  is_flag_endorsement text,
  flag_state text,
  file_url text,
  ai_verified text,
  ai_extracted_data jsonb,
  status text
);

create table if not exists sea_contracts (
  id uuid primary key,
  crew_id uuid references crew_members(id),
  vessel_id uuid references vessels(id),
  rank_on_vessel text,
  start_date date,
  end_date date,
  rotation_type text,
  joining_port text,
  sign_off_port text,
  status text,
  monthly_wage_usd numeric,
  overtime_rate_usd numeric,
  sea_contract_signed text
);

create table if not exists rest_hours_log (
  id uuid primary key,
  crew_id uuid references crew_members(id),
  vessel_id uuid references vessels(id),
  log_date date,
  scheduled_work_hours numeric,
  actual_work_hours numeric,
  rest_hours numeric,
  violation_flag text,
  violation_type text,
  force_majeure text,
  compensatory_rest_scheduled text,
  entered_by text,
  verified_by_master text
);

create table if not exists crew_changes (
  id uuid primary key,
  vessel_id uuid references vessels(id),
  rank text,
  outgoing_crew_id uuid references crew_members(id),
  incoming_crew_id uuid references crew_members(id),
  change_port text,
  planned_date date,
  actual_date date,
  status text,
  port_agent text,
  flight_details jsonb,
  hotel_details jsonb,
  joining_instructions_sent text,
  ok_to_board_issued text
);

create table if not exists pre_joining_checklists (
  id uuid primary key,
  crew_change_id uuid references crew_changes(id),
  crew_id uuid references crew_members(id),
  passport_valid text,
  cdc_valid text,
  coc_valid text,
  stcw_bst_valid text,
  medical_valid text,
  flag_endorsement_valid text,
  visa_ok text,
  yellow_fever_valid text,
  sea_signed text,
  ok_to_board text,
  checked_by text,
  checked_at date,
  notes text
);

create table if not exists recruitment_requisitions (
  id uuid primary key,
  vessel_id uuid references vessels(id),
  rank_required text,
  required_cert_types jsonb,
  joining_port text,
  joining_date date,
  rotation_type text,
  salary_band_usd_min numeric,
  salary_band_usd_max numeric,
  status text,
  priority text,
  raised_by text,
  notes text
);

create table if not exists candidates (
  id uuid primary key,
  requisition_id uuid references recruitment_requisitions(id),
  full_name text,
  rank text,
  nationality text,
  date_of_birth date,
  email text,
  phone text,
  cv_url text,
  ai_parsed_data jsonb,
  ai_match_score numeric,
  ai_match_notes text,
  pipeline_stage text,
  interview_date date,
  interview_notes text,
  offer_sent_date date,
  offer_accepted text,
  rejection_reason text,
  go_to_talent_pool text
);

create table if not exists compliance_templates (
  id uuid primary key,
  name text not null,
  source_file_name text,
  source_type text,
  created_at timestamptz not null default now(),
  items jsonb not null default '[]'::jsonb
);

create table if not exists compliance_runs (
  id uuid primary key,
  template_id uuid references compliance_templates(id),
  template_name text not null,
  crew_id uuid references crew_members(id),
  crew_name text not null,
  created_at timestamptz not null default now(),
  overall_status text not null,
  pass_count integer not null default 0,
  fail_count integer not null default 0,
  warn_count integer not null default 0,
  results jsonb not null default '[]'::jsonb
);

create index if not exists idx_certifications_crew_id on certifications(crew_id);
create index if not exists idx_contracts_crew_id on sea_contracts(crew_id);
create index if not exists idx_contracts_vessel_id on sea_contracts(vessel_id);
create index if not exists idx_rest_hours_crew_id on rest_hours_log(crew_id);
create index if not exists idx_crew_status on crew_members(status);
create index if not exists idx_crew_current_vessel on crew_members(current_vessel_id);
create index if not exists idx_changes_status on crew_changes(status);
create index if not exists idx_runs_created_at on compliance_runs(created_at desc);
create index if not exists idx_templates_created_at on compliance_templates(created_at desc);
