const fs = require('fs');

// Read the schema
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Remove reverse relations from WorkMe, add minimal ones for Prisma validation
schema = schema.replace(
  /  // Work Architecture Relations \(created by this WorkMe\)[\s\S]*?  // milestones  Milestone\[\]   // Commented out - not using/,
  `  // Minimal reverse relations (required by Prisma, but NOT to be queried)
  // WorkMe is pure identity - work outputs reference WorkMe via originatorId
  // These relations exist only for Prisma schema validation
  originatedCommsOutputs        CommsOutput[]        @relation("CommsOutputOriginator")
  originatedObjectives          Objective[]          @relation("ObjectiveOriginator")
  originatedAchievements        Achievement[]        @relation("AchievementOriginator")
  originatedWorkContexts        WorkContext[]       @relation("WorkContextOriginator")
  originatedWorkContextCampaigns WorkContextCampaign[] @relation("WorkContextCampaignOriginator")
  originatedWorkContextImpactEvents WorkContextImpactEvent[] @relation("WorkContextImpactEventOriginator")
  originatedWorkContextTrainings WorkContextTraining[] @relation("WorkContextTrainingOriginator")
  originatedWorkContextEvents   WorkContextEvent[]  @relation("WorkContextEventOriginator")
  originatedWorkContextCommunities WorkContextCommunity[] @relation("WorkContextCommunityOriginator")
  originatedWorkContextBenefits WorkContextBenefits[] @relation("WorkContextBenefitsOriginator")
  originatedWorkContextCareers  WorkContextCareer[]  @relation("WorkContextCareerOriginator")
  originatedWorkContextEmployeeCauses WorkContextEmployeeCause[] @relation("WorkContextEmployeeCauseOriginator")
  originatedWorkSupports        WorkSupport[]       @relation("WorkSupportOriginator")
  originatedWorkOutputs        WorkOutput[]        @relation("WorkOutputOriginator")
  originatedWorkOutputStandalones WorkOutputStandalone[] @relation("WorkOutputStandaloneOriginator")
  originatedNTKs                NTK[]               @relation("NTKOriginator")
  originatedWorkforceComms      WorkforceComms[]   @relation("WorkforceCommsOriginator")
  originatedWorkforceCommsDrafts WorkforceCommsDraft[] @relation("WorkforceCommsDraftOriginator")
  originatedWorkforceCommsEditions WorkforceCommsEdition[] @relation("WorkforceCommsEditionOriginator")
  originatedNTKEditions         NTKEdition[]        @relation("NTKEditionOriginator")

  // connections Connection[]  // Commented out - not using
  // events      Event[]       // Commented out - not using
  // milestones  Milestone[]   // Commented out - not using`
);

// 2. Make Company independent
schema = schema.replace(
  /\/\/ ============================================\n\/\/ COMPANY MODEL \(Directory - Container-Scoped\)\n\/\/ ============================================\nmodel Company \{[\s\S]*?  @@unique\(\[workMeCompanyId, name\]\) \/\/ Unique name per container\n  @@index\(\[workMeCompanyId\]\) \/\/ Index for directory lookups\n\}/,
  `// ============================================
// COMPANY MODEL (Independent Entity)
// ============================================
model Company {
  id            String        @id @default(uuid())
  name          String        @unique // Company name (unique globally)
  industry      String?
  website       String?
  city          String?
  state         String?
  description   String?
  headcount     Int?
  companyType   CompanyType?
  revenueRange  RevenueRange?
  createdAt     DateTime      @default(now())

  // Relations
  employees WorkMe[]

  // Minimal reverse relations (required by Prisma, but NOT to be queried)
  // Company is independent - work outputs reference Company via companyId
  // These relations exist only for Prisma schema validation
  commsOutputs        CommsOutput[]        @relation("CommsOutputCompany")
  objectives          Objective[]          @relation("ObjectiveCompany")
  achievements        Achievement[]        @relation("AchievementCompany")
  workContexts        WorkContext[]         @relation("WorkContextCompany")
  workContextCampaigns WorkContextCampaign[] @relation("WorkContextCampaignCompany")
  workContextImpactEvents WorkContextImpactEvent[] @relation("WorkContextImpactEventCompany")
  workContextTrainings WorkContextTraining[] @relation("WorkContextTrainingCompany")
  workContextEvents   WorkContextEvent[]   @relation("WorkContextEventCompany")
  workContextCommunities WorkContextCommunity[] @relation("WorkContextCommunityCompany")
  workContextBenefits WorkContextBenefits[] @relation("WorkContextBenefitsCompany")
  workContextCareers  WorkContextCareer[]  @relation("WorkContextCareerCompany")
  workContextEmployeeCauses WorkContextEmployeeCause[] @relation("WorkContextEmployeeCauseCompany")
  workSupports        WorkSupport[]        @relation("WorkSupportCompany")
  workOutputs        WorkOutput[]         @relation("WorkOutputCompany")
  workOutputStandalones WorkOutputStandalone[] @relation("WorkOutputStandaloneCompany")
  ntks                NTK[]                @relation("NTKCompany")
  workforceComms      WorkforceComms[]     @relation("WorkforceCommsCompany")
  workforceCommsDrafts WorkforceCommsDraft[] @relation("WorkforceCommsDraftCompany")
  workforceCommsEditions WorkforceCommsEdition[] @relation("WorkforceCommsEditionCompany")
  ntkEditions         NTKEdition[]         @relation("NTKEditionCompany")

  @@index([name])
}`
);

// 3. Remove companies relation from WorkMeCompany
schema = schema.replace(
  /  employees WorkMe\[\]\n  companies Company\[\] \/\/ Companies in this container/,
  `  employees WorkMe[]
  // NO companies relation - Company is independent`
);

// 4. Replace all createdByWorkMeId with originatorId and make optional
const models = [
  'CommsOutput', 'Objective', 'Achievement', 'WorkContext',
  'WorkContextCampaign', 'WorkContextImpactEvent', 'WorkContextTraining',
  'WorkContextEvent', 'WorkContextCommunity', 'WorkContextBenefits',
  'WorkContextCareer', 'WorkContextEmployeeCause', 'WorkSupport',
  'WorkOutput', 'WorkOutputStandalone', 'NTK', 'WorkforceComms',
  'WorkforceCommsDraft', 'WorkforceCommsEdition'
];

models.forEach(model => {
  // Replace createdByWorkMeId with originatorId
  schema = schema.replace(
    new RegExp(`(model ${model}[\\s\\S]*?)createdByWorkMeId\\s+String`, 'g'),
    `$1originatorId    String?`
  );
  
  // Replace createdBy with originator
  schema = schema.replace(
    new RegExp(`(model ${model}[\\s\\S]*?)createdBy\\s+WorkMe`, 'g'),
    `$1originator   WorkMe?`
  );
  
  // Make companyId optional
  schema = schema.replace(
    new RegExp(`(model ${model}[\\s\\S]*?)companyId\\s+String`, 'g'),
    `$1companyId    String?`
  );
  
  // Make company optional
  schema = schema.replace(
    new RegExp(`(model ${model}[\\s\\S]*?)company\\s+Company\\s+@relation`, 'g'),
    `$1company      Company? @relation`
  );
  
  // Update indexes
  schema = schema.replace(
    new RegExp(`(model ${model}[\\s\\S]*?)@@index\\(\\[createdByWorkMeId\\]\\)`, 'g'),
    `$1@@index([originatorId])`
  );
});

// 5. Add relation names to all models
const relationMap = {
  'CommsOutput': ['CommsOutputCompany', 'CommsOutputOriginator'],
  'Objective': ['ObjectiveCompany', 'ObjectiveOriginator'],
  'Achievement': ['AchievementCompany', 'AchievementOriginator'],
  'WorkContext': ['WorkContextCompany', 'WorkContextOriginator'],
  'WorkContextCampaign': ['WorkContextCampaignCompany', 'WorkContextCampaignOriginator'],
  'WorkContextImpactEvent': ['WorkContextImpactEventCompany', 'WorkContextImpactEventOriginator'],
  'WorkContextTraining': ['WorkContextTrainingCompany', 'WorkContextTrainingOriginator'],
  'WorkContextEvent': ['WorkContextEventCompany', 'WorkContextEventOriginator'],
  'WorkContextCommunity': ['WorkContextCommunityCompany', 'WorkContextCommunityOriginator'],
  'WorkContextBenefits': ['WorkContextBenefitsCompany', 'WorkContextBenefitsOriginator'],
  'WorkContextCareer': ['WorkContextCareerCompany', 'WorkContextCareerOriginator'],
  'WorkContextEmployeeCause': ['WorkContextEmployeeCauseCompany', 'WorkContextEmployeeCauseOriginator'],
  'WorkSupport': ['WorkSupportCompany', 'WorkSupportOriginator'],
  'WorkOutput': ['WorkOutputCompany', 'WorkOutputOriginator'],
  'WorkOutputStandalone': ['WorkOutputStandaloneCompany', 'WorkOutputStandaloneOriginator'],
  'NTK': ['NTKCompany', 'NTKOriginator'],
  'WorkforceComms': ['WorkforceCommsCompany', 'WorkforceCommsOriginator'],
  'WorkforceCommsDraft': ['WorkforceCommsDraftCompany', 'WorkforceCommsDraftOriginator'],
  'WorkforceCommsEdition': ['WorkforceCommsEditionCompany', 'WorkforceCommsEditionOriginator'],
};

Object.entries(relationMap).forEach(([model, [companyRel, originatorRel]]) => {
  // Add company relation name
  schema = schema.replace(
    new RegExp(`(model ${model}[\\s\\S]*?company\\s+Company\\?\\s+)@relation\\(fields:`, 'g'),
    `$1@relation("${companyRel}", fields:`
  );
  
  // Add originator relation name
  schema = schema.replace(
    new RegExp(`(model ${model}[\\s\\S]*?originator\\s+WorkMe\\?\\s+)@relation\\(fields:`, 'g'),
    `$1@relation("${originatorRel}", fields:`
  );
});

// 6. Fix NTKEdition - it already has originatorId, just need to make companyId optional and add relation name
schema = schema.replace(
  /(model NTKEdition[\s\S]*?)companyId\s+String/,
  `$1companyId     String?`
);
schema = schema.replace(
  /(model NTKEdition[\s\S]*?)company\s+Company\s+@relation\("NTKEditionCompany",/,
  `$1company       Company? @relation("NTKEditionCompany",`
);

// Write back
fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated successfully!');

