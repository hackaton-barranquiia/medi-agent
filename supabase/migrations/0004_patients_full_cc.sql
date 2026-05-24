alter table patients
  add column if not exists cc_number text;

create unique index if not exists patients_cc_number_unique_idx
  on patients (cc_number)
  where cc_number is not null;
