-- Add optional employeeId foreign keys to MyTeam models
-- This links personal workplace intelligence to company truth (CompanyEmployee)
-- The FKs are optional to allow for external people, former employees, or fuzzy relationships

-- MyTeamDirectorProfile
ALTER TABLE "MyTeamDirectorProfile" 
ADD COLUMN "employeeId" TEXT;

ALTER TABLE "MyTeamDirectorProfile"
ADD CONSTRAINT "MyTeamDirectorProfile_employeeId_fkey" 
FOREIGN KEY ("employeeId") REFERENCES "CompanyEmployee"("id") ON DELETE SET NULL;

CREATE INDEX "MyTeamDirectorProfile_employeeId_idx" ON "MyTeamDirectorProfile"("employeeId");

-- MyTeamDeputyProfile
ALTER TABLE "MyTeamDeputyProfile" 
ADD COLUMN "employeeId" TEXT;

ALTER TABLE "MyTeamDeputyProfile"
ADD CONSTRAINT "MyTeamDeputyProfile_employeeId_fkey" 
FOREIGN KEY ("employeeId") REFERENCES "CompanyEmployee"("id") ON DELETE SET NULL;

CREATE INDEX "MyTeamDeputyProfile_employeeId_idx" ON "MyTeamDeputyProfile"("employeeId");

-- MyTeamPeerProfile
ALTER TABLE "MyTeamPeerProfile" 
ADD COLUMN "employeeId" TEXT;

ALTER TABLE "MyTeamPeerProfile"
ADD CONSTRAINT "MyTeamPeerProfile_employeeId_fkey" 
FOREIGN KEY ("employeeId") REFERENCES "CompanyEmployee"("id") ON DELETE SET NULL;

CREATE INDEX "MyTeamPeerProfile_employeeId_idx" ON "MyTeamPeerProfile"("employeeId");

-- MyTeamSubordinateProfile
ALTER TABLE "MyTeamSubordinateProfile" 
ADD COLUMN "employeeId" TEXT;

ALTER TABLE "MyTeamSubordinateProfile"
ADD CONSTRAINT "MyTeamSubordinateProfile_employeeId_fkey" 
FOREIGN KEY ("employeeId") REFERENCES "CompanyEmployee"("id") ON DELETE SET NULL;

CREATE INDEX "MyTeamSubordinateProfile_employeeId_idx" ON "MyTeamSubordinateProfile"("employeeId");
