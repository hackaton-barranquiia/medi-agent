-- 3 demo patients. Update phone_e164 with real numbers (team + jury) before the demo.
insert into patients (id, full_name, phone_e164, last_4_cc, birth_date) values
  ('11111111-1111-1111-1111-111111111111', 'Luz Marina Patiño', '+573001112233', '4729', '1952-04-12'),
  ('22222222-2222-2222-2222-222222222222', 'José Antonio Restrepo', '+573004445566', '8814', '1948-09-23'),
  ('33333333-3333-3333-3333-333333333333', 'Carmen Rosa Bedoya', '+573007778899', '3105', '1955-11-30');

-- Medications
insert into medications (id, name, presentation, stock_qty, expires_at, reorder_eta_days) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Losartán 50mg', 'Caja x 30 tabletas', 40, '2026-06-15', 5),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Metformina 850mg', 'Caja x 60 tabletas', 8, '2026-05-25', 3),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Atorvastatina 20mg', 'Caja x 30 tabletas', 0, '2026-08-01', 4),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Enalapril 10mg', 'Caja x 30 tabletas', 22, '2026-05-26', 5);

-- Prescription for Luz Marina — partial stock case (Atorvastatina out of stock)
insert into prescriptions (id, patient_id, status) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'ready');

insert into prescription_items (prescription_id, medication_id, qty) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', 1);

-- Prescription for José — full stock
insert into prescriptions (id, patient_id, status) values
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'ready');

insert into prescription_items (prescription_id, medication_id, qty) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 1),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000004', 1);

-- Prescription for Carmen — expiring soon
insert into prescriptions (id, patient_id, status) values
  ('bbbbbbbb-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'expiring_soon');

insert into prescription_items (prescription_id, medication_id, qty) values
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 2);
