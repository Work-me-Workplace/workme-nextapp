/**
 * Script to export all user and company data before migrating to Neon
 * 
 * Usage: npx tsx scripts/export-all-data.ts
 * 
 * This script exports:
 * - All WorkMe (user) data and all related records
 * - All Company data and all related records
 * 
 * Output: JSON files in ./exports/ directory with timestamp
 */

import { prisma } from '../lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const exportDir = path.join(process.cwd(), 'exports', `export-${timestamp}`)

// Ensure export directory exists
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true })
}

console.log(`📦 Export directory: ${exportDir}`)

// Helper to safely query with error handling
async function safeQuery<T>(name: string, queryFn: () => Promise<T>): Promise<T | null> {
  try {
    return await queryFn()
  } catch (error: any) {
    console.log(`   ⚠️  Could not export ${name}: ${error.message}`)
    return null
  }
}

async function exportAllData() {
  try {
    console.log('\n🚀 Starting data export...\n')

    // ============================================
    // EXPORT ALL WORKME (USER) DATA - Basic first
    // ============================================
    console.log('👤 Exporting WorkMe (user) data...')
    
    const allWorkMe = await prisma.workMe.findMany({
      include: {
        workProfile: true,
        workSkills: true,
        workEntries: true,
        workGoals: true,
        workMeCompany: true,
        Company: true,
        workplaces: {
          include: {
            company: true
          }
        },
        ecosystemCompanies: {
          include: {
            company: true
          }
        },
        ecosystemContacts: {
          include: {
            person: {
              include: {
                company: true
              }
            }
          }
        }
      }
    })

    console.log(`   Found ${allWorkMe.length} WorkMe records`)

    // Export WorkOps separately (might not exist)
    const workOpsData = await Promise.all(
      allWorkMe.map(async (wm) => {
        if (!wm.id) return null
        return await safeQuery(`WorkOps for ${wm.email}`, async () => {
          return await prisma.workOpsOutlook.findUnique({
            where: { workMeId: wm.id },
            include: {
              items: {
                include: {
                  dailyAssignments: true
                }
              },
              dailyAssignments: true
            }
          })
        })
      })
    )

    // Export all related records separately to avoid schema issues
    console.log('   Exporting related records...')
    
    const [commsOutputs, objectives, achievements, emailDigests, campaigns, impactEvents, trainings, events, communities, careers, employeeCauses, digitalSigns, highlights, employees, products, pressures, engageMessages, companyBenefits] = await Promise.all([
      safeQuery('CommsOutputs', () => prisma.commsOutput.findMany({ include: { achievements: true } })),
      safeQuery('Objectives', () => prisma.objective.findMany({ include: { achievements: true } })),
      safeQuery('Achievements', () => prisma.achievement.findMany()),
      safeQuery('EmailDigests', () => prisma.workForceEnduringProdEmailDigest.findMany({ include: { editions: true } })),
      safeQuery('CompanyCampaigns', () => prisma.companyCampaign.findMany()),
      safeQuery('CompanyImpactEvents', () => prisma.companyImpactEvent.findMany()),
      safeQuery('CompanyTrainings', () => prisma.companyTraining.findMany()),
      safeQuery('CompanyEvents', () => prisma.companyEvent.findMany({ include: { eventItems: true } })),
      safeQuery('CompanyCommunities', () => prisma.companyCommunity.findMany()),
      safeQuery('CompanyCareers', () => prisma.companyCareer.findMany()),
      safeQuery('CompanyEmployeeCauses', () => prisma.companyEmployeeCause.findMany()),
      safeQuery('DigitalSignProducts', () => prisma.productDigitalSign.findMany({
        include: {
          workforce: true,
          companyNews: true,
          workforceAchievement: true,
          companyEvent: true
        }
      })),
      safeQuery('EmployeeHighlights', () => prisma.companyEmployeeHighlight.findMany({
        include: {
          employees: {
            include: {
              employee: true
            }
          },
          engageMessages: true
        }
      })),
      safeQuery('CompanyEmployees', () => prisma.companyEmployee.findMany({
        include: {
          highlights: {
            include: {
              highlight: true
            }
          },
          company: true
        }
      })),
      safeQuery('CompanyProducts', () => prisma.companyProduct.findMany({
        include: {
          highlights: true,
          pressures: true,
          updates: true
        }
      })),
      safeQuery('ExternalPressures', () => prisma.externalCompanyPressure.findMany()),
      safeQuery('EngageMessages', () => prisma.engageMessage.findMany({
        include: {
          template: true,
          highlight: true
        }
      })),
      safeQuery('CompanyBenefits', () => prisma.companyBenefits.findMany())
    ])

    // Combine WorkMe data with related records
    const workMeData = {
      workMe: allWorkMe.map((wm, idx) => ({
        ...wm,
        workOpsOutlook: workOpsData[idx] || null
      })),
      relatedRecords: {
        commsOutputs: commsOutputs || [],
        objectives: objectives || [],
        achievements: achievements || [],
        emailDigests: emailDigests || [],
        campaigns: campaigns || [],
        impactEvents: impactEvents || [],
        trainings: trainings || [],
        events: events || [],
        communities: communities || [],
        careers: careers || [],
        employeeCauses: employeeCauses || [],
        digitalSigns: digitalSigns || [],
        highlights: highlights || [],
        employees: employees || [],
        products: products || [],
        pressures: pressures || [],
        engageMessages: engageMessages || [],
        companyBenefits: companyBenefits || []
      }
    }

    // Save WorkMe data
    const workMeFile = path.join(exportDir, 'workme-data.json')
    fs.writeFileSync(workMeFile, JSON.stringify(workMeData, null, 2))
    console.log(`   ✅ Saved to ${workMeFile}`)

    // ============================================
    // EXPORT ALL COMPANY DATA
    // ============================================
    console.log('\n🏢 Exporting Company data...')
    
    const allCompanies = await prisma.company.findMany({
      include: {
        members: {
          select: {
            id: true,
            email: true,
            firebaseId: true,
            createdAt: true
          }
        },
        workplaces: {
          include: {
            workMe: {
              select: {
                id: true,
                email: true,
                firebaseId: true
              }
            }
          }
        },
        employees: {
          include: {
            highlights: {
              include: {
                highlight: true
              }
            },
            createdBy: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    })

    console.log(`   Found ${allCompanies.length} Company records`)

    // Save Company data
    const companyFile = path.join(exportDir, 'company-data.json')
    fs.writeFileSync(companyFile, JSON.stringify(allCompanies, null, 2))
    console.log(`   ✅ Saved to ${companyFile}`)

    // ============================================
    // EXPORT WORKMECOMPANY DATA (if any)
    // ============================================
    console.log('\n🏭 Exporting WorkMeCompany data...')
    
    const allWorkMeCompanies = await safeQuery('WorkMeCompanies', () => 
      prisma.workMeCompany.findMany({
        include: {
          employees: {
            select: {
              id: true,
              email: true,
              firebaseId: true
            }
          }
        }
      })
    )

    if (allWorkMeCompanies && allWorkMeCompanies.length > 0) {
      console.log(`   Found ${allWorkMeCompanies.length} WorkMeCompany records`)
      const workMeCompanyFile = path.join(exportDir, 'workme-company-data.json')
      fs.writeFileSync(workMeCompanyFile, JSON.stringify(allWorkMeCompanies, null, 2))
      console.log(`   ✅ Saved to ${workMeCompanyFile}`)
    } else {
      console.log(`   No WorkMeCompany records found`)
    }

    // ============================================
    // EXPORT SUMMARY
    // ============================================
    const summary = {
      exportDate: new Date().toISOString(),
      exportDirectory: exportDir,
      counts: {
        workMe: allWorkMe.length,
        companies: allCompanies.length,
        workMeCompanies: allWorkMeCompanies?.length || 0,
        workProfiles: allWorkMe.filter(w => w.workProfile).length,
        workSkills: allWorkMe.filter(w => w.workSkills).length,
        workEntries: allWorkMe.reduce((sum, w) => sum + w.workEntries.length, 0),
        workGoals: allWorkMe.reduce((sum, w) => sum + w.workGoals.length, 0),
        workplaces: allWorkMe.reduce((sum, w) => sum + w.workplaces.length, 0),
        companyEmployees: allCompanies.reduce((sum, c) => sum + c.employees.length, 0),
        achievements: achievements?.length || 0,
        commsOutputs: commsOutputs?.length || 0,
        objectives: objectives?.length || 0,
        companyCampaigns: campaigns?.length || 0,
        companyImpactEvents: impactEvents?.length || 0,
        companyTrainings: trainings?.length || 0,
        companyEvents: events?.length || 0,
        companyCommunities: communities?.length || 0,
        companyCareers: careers?.length || 0,
        companyBenefits: companyBenefits?.length || 0,
        companyEmployeeCauses: employeeCauses?.length || 0,
        companyProducts: products?.length || 0,
        externalPressures: pressures?.length || 0,
        engageMessages: engageMessages?.length || 0,
      }
    }

    const summaryFile = path.join(exportDir, 'export-summary.json')
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))
    console.log(`\n   ✅ Summary saved to ${summaryFile}`)

    // Print summary to console
    console.log('\n📊 Export Summary:')
    console.log(JSON.stringify(summary.counts, null, 2))

    console.log(`\n✅ Export complete! All data saved to: ${exportDir}`)
    console.log(`\n📁 Files created:`)
    console.log(`   - workme-data.json (${allWorkMe.length} users)`)
    console.log(`   - company-data.json (${allCompanies.length} companies)`)
    if (allWorkMeCompanies && allWorkMeCompanies.length > 0) {
      console.log(`   - workme-company-data.json (${allWorkMeCompanies.length} workme companies)`)
    }
    console.log(`   - export-summary.json`)

  } catch (error: any) {
    console.error('❌ Error exporting data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

exportAllData()
  .then(() => {
    console.log('\n✅ Export process completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Export process failed:', error)
    process.exit(1)
  })
