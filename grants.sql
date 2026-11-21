-- Bagsy: let signed-in people use the tables. The security rules in schema.sql still decide which rows each person can see.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant execute on functions to authenticated;
-- lets the every-3-days keep-alive ping read the trips table (the security rules give it zero rows)
grant select on public.trips to anon;
