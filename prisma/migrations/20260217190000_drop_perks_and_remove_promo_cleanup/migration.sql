-- Drop deprecated perks columns (use eventItems only).
-- CompanyEvent.perks already dropped in 20260217000000_companyevent_perks_to_eventitems.

ALTER TABLE "ProductDigitalSignWorkforceStuff" DROP COLUMN IF EXISTS "perks";
ALTER TABLE "ProductDigitalSignCompanyEvent" DROP COLUMN IF EXISTS "perks";
