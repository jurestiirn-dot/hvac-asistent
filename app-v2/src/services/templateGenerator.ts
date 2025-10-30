// Template generator for GMP documents (SOP, protocols, forms)
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx'
import { jsPDF } from 'jspdf'

export type TemplateType = 'sop' | 'protocol' | 'form' | 'checklist' | 'report'
export type ExportFormat = 'docx' | 'pdf'

export interface TemplateConfig {
  title: string
  type: TemplateType
  category: string
  sections: string[]
  // Optional explicit section content overrides (per section name)
  content?: Record<string, string>
}

// SOP Templates
const SOP_TEMPLATES: Record<string, TemplateConfig> = {
  cleaning: {
    title: 'SOP - Cleaning and Disinfection of Aseptic Areas',
    type: 'sop',
    category: 'Cleaning',
    sections: [
      'Purpose',
      'Scope',
      'Responsibility',
      'Definitions',
      'Procedure',
      'Disinfectant Rotation Schedule',
      'Frequency',
      'Documentation',
      'References',
      'Revision History'
    ]
  },
  gowning: {
    title: 'SOP - Gowning Procedure for Grade A/B Areas',
    type: 'sop',
    category: 'Personnel',
    sections: [
      'Purpose',
      'Scope',
      'Responsibility',
      'Personal Hygiene Requirements',
      'Gowning Procedure - Step by Step',
      'De-gowning Procedure',
      'Garment Specifications',
      'Training Requirements',
      'Documentation',
      'References',
      'Annexes'
    ]
  },
  environmental_monitoring: {
    title: 'SOP - Environmental Monitoring Program',
    type: 'sop',
    category: 'Monitoring',
    sections: [
      'Purpose',
      'Scope',
      'Responsibility',
      'Monitoring Parameters',
      'Sampling Locations',
      'Sampling Frequency',
      'Alert and Action Limits',
      'Procedure',
      'Out-of-Specification Investigation',
      'Documentation',
      'References'
    ]
  },
  material_handling: {
    title: 'SOP - Material Transfer to Aseptic Areas',
    type: 'sop',
    category: 'Operations',
    sections: [
      'Purpose',
      'Scope',
      'Responsibility',
      'Material Transfer Procedure',
      'Sterilization Requirements',
      'Documentation',
      'References'
    ],
    content: {
      'Purpose': 'This SOP establishes procedures for the safe transfer of materials into Grade A/B aseptic processing areas to prevent contamination and maintain environmental classification.\n\nCompliance with:\n- EU GMP Annex 1 (Section 4.27-4.31)\n- WHO Technical Report Series 961\n- ISO 14644-1',
      'Scope': 'Applies to all materials (raw materials, components, equipment) transferred into Grade A/B classified areas for aseptic processing.\n\nExclusions: Personnel gowning (see SOP-GOWN-001)',
      'Responsibility': '**Production Operators:** Execute material transfer procedures\n**QA Personnel:** Monitor compliance and approve deviations\n**Maintenance:** Ensure transfer equipment functionality\n**Microbiology:** Monitor environmental impact',
      'Material Transfer Procedure': '### 1. Pre-Transfer Preparation\n- Verify material identity and batch number\n- Inspect packaging for damage\n- Stage materials in appropriate gowning/transfer room\n\n### 2. Surface Disinfection\n- Spray all external surfaces with 70% IPA or approved disinfectant\n- Allow 30-second contact time\n- Wipe with sterile lint-free wipes\n- Repeat disinfection for critical surfaces\n\n### 3. Pass-Through Transfer\n- Open outer door of pass-through\n- Place disinfected materials inside\n- Close and lock outer door\n- UV cycle: 15 minutes (if applicable)\n- Personnel in aseptic area open inner door\n- Transfer materials using aseptic technique\n\n### 4. Verification\n- Visual inspection for damage\n- Verify material identity inside cleanroom\n- Document transfer in batch record',
      'Sterilization Requirements': '**Terminally Sterilized Items:**\n- Autoclave: 121°C, 15 min or 134°C, 3 min\n- Document cycle parameters\n- Biological indicator verification\n\n**Non-Sterilizable Items:**\n- Double-bag in sterile pouches\n- Surface sterilization with sporicidal agent\n- VHP (Vaporized Hydrogen Peroxide) treatment if available',
      'Documentation': 'Required records:\n- Material Transfer Log (Form MTL-001)\n- Sterilization cycle records\n- Environmental monitoring during transfer\n- Deviation reports for any incidents\n\n**Retention:** 3 years beyond product expiry\n**Location:** Production records archive',
      'References': '1. EU GMP Annex 1 - Manufacture of Sterile Medicinal Products\n2. ISO 14644-1 - Classification of air cleanliness\n3. SOP-CLEAN-001 - Cleaning and Disinfection\n4. SOP-GOWN-001 - Gowning Procedures'
    }
  },
  change_control: {
    title: 'SOP - Change Control Procedure',
    type: 'sop',
    category: 'Quality System',
    sections: [
      'Purpose',
      'Scope',
      'Responsibility',
      'Change Classification',
      'Change Control Process',
      'Documentation',
      'References'
    ],
    content: {
      'Purpose': 'This SOP establishes a systematic approach to evaluate, approve, implement, and document changes to GMP systems, equipment, processes, and documentation.\n\nEnsures:\n- Product quality is maintained\n- Regulatory compliance\n- Risk-based decision making\n- Complete traceability',
      'Scope': 'Applies to all changes affecting:\n- Manufacturing processes\n- Equipment and utilities\n- Quality systems\n- Facilities and cleanrooms\n- Computer systems\n- SOPs and specifications\n\nExclusions: Editorial corrections to documents (see Doc Control SOP)',
      'Responsibility': '**Change Initiator:** Proposes change and completes Change Request Form\n**Department Head:** Reviews and prioritizes\n**Change Control Committee:** Evaluates impact and approves/rejects\n**QA:** Final approval and closure verification\n**Implementation Owner:** Executes approved changes',
      'Change Classification': '**Critical (High Risk):**\n- Impacts product quality, safety, or efficacy\n- Affects sterility assurance\n- Regulatory notification required\n- Examples: Process parameter changes, new equipment\n\n**Major (Medium Risk):**\n- Could impact product or compliance\n- Validation/qualification may be required\n- Examples: SOP revisions, facility modifications\n\n**Minor (Low Risk):**\n- No direct impact on product\n- Administrative or editorial\n- Examples: Room number changes, contact updates',
      'Change Control Process': '### 1. Initiation (Day 0)\n- Complete Change Request Form (CCR-001)\n- Describe current state and proposed change\n- Provide justification and timeline\n\n### 2. Risk Assessment (Day 1-3)\n- Assess impact on product quality (ICH Q9)\n- Identify affected systems/processes\n- Determine validation requirements\n- Classify change level\n\n### 3. Review & Approval (Day 4-10)\n- Technical review by Subject Matter Experts\n- Change Control Committee meeting\n- QA review for regulatory impact\n- Approval signatures collected\n\n### 4. Implementation (Variable)\n- Execute implementation plan\n- Complete validation/qualification if required\n- Update documentation\n- Train affected personnel\n\n### 5. Effectiveness Check (30-90 days)\n- Verify change achieved objective\n- Review product quality data\n- Environmental monitoring trends\n- Document effectiveness\n\n### 6. Closure\n- QA final review\n- Archive all records\n- Update change log',
      'Documentation': 'Required forms and records:\n- Change Request Form (CCR-001)\n- Risk Assessment (RA-002)\n- Implementation Plan\n- Training records\n- Validation/qualification reports\n- Effectiveness check results\n- Change Control Log\n\n**Retention:** Life of product + 1 year (minimum 10 years)\n**Location:** QA Change Control Archive',
      'References': '1. ICH Q9 - Quality Risk Management\n2. ICH Q10 - Pharmaceutical Quality System\n3. EU GMP Chapter 1 - Quality Management\n4. FDA Guidance for Industry: Quality Systems Approach to CGMP Regulations'
    }
  }
}

// Protocol Templates
const PROTOCOL_TEMPLATES: Record<string, TemplateConfig> = {
  media_fill: {
    title: 'Protocol - Media Fill Process Simulation',
    type: 'protocol',
    category: 'Validation',
    sections: [
      'Protocol Approval',
      'Objective',
      'Scope',
      'Responsibilities',
      'Test Description',
      'Acceptance Criteria',
      'Equipment and Materials',
      'Personnel Qualification',
      'Procedure',
      'Deviations',
      'Results and Evaluation',
      'Conclusion',
      'Annexes'
    ]
  },
  hvac_qualification: {
    title: 'Protocol - HVAC System Qualification (IQ/OQ/PQ)',
    type: 'protocol',
    category: 'Qualification',
    sections: [
      'Protocol Approval',
      'Objective',
      'Scope',
      'System Description',
      'Acceptance Criteria',
      'IQ - Installation Qualification',
      'OQ - Operational Qualification',
      'PQ - Performance Qualification',
      'Test Procedures',
      'Results Documentation',
      'Deviation Management',
      'Conclusion',
      'Annexes'
    ]
  },
  cleaning_validation: {
    title: 'Protocol - Cleaning Validation',
    type: 'protocol',
    category: 'Validation',
    sections: [
      'Protocol Approval',
      'Objective',
      'Scope',
      'Equipment/Areas Covered',
      'Cleaning Procedure Reference',
      'Worst Case Justification',
      'Acceptance Criteria',
      'Sampling Plan',
      'Analytical Methods',
      'Test Execution',
      'Results and Evaluation',
      'Conclusion',
      'Annexes'
    ]
  },
  aseptic_process_validation: {
    title: 'Protocol - Aseptic Process Validation (APV)',
    type: 'protocol',
    category: 'Validation',
    sections: [
      'Protocol Approval',
      'Objective',
      'Scope',
      'Acceptance Criteria',
      'Test Procedure',
      'Results',
      'Conclusion'
    ],
    content: {
      'Protocol Approval': 'Protocol No: APV-2025-001\nEffective Date: ' + new Date().toLocaleDateString('sl-SI') + '\n\nThis protocol requires approval before execution.',
      'Objective': 'To demonstrate that the aseptic filling process consistently produces sterile product under worst-case conditions.\n\nValidation approach:\n- Three consecutive successful media fill runs\n- Minimum 5,000 units per run (or batch size if smaller)\n- Simulate worst-case production conditions\n- Zero contamination target (0/0 model)',
      'Scope': 'Covers aseptic filling operations for:\n- Product: Injectable Solution 10mL\n- Fill volume: 8-10mL\n- Line speed: 60-120 units/min\n- Format: Vials (Type I glass, 10mL)\n- Grade A filling under Grade B background\n- Includes interventions and worst-case scenarios',
      'Acceptance Criteria': '**Primary Criterion:**\n- Zero contaminated units in all three runs (0/0 acceptance per EU Annex 1)\n- Contamination rate <0.1% with 95% confidence\n\n**Secondary Criteria:**\n- Environmental monitoring within action limits\n- No Grade A excursions during filling\n- Personnel gowning qualification passed\n- All planned interventions executed successfully\n\n**Failure Criteria:**\n- Any contaminated unit in any run\n- Grade A alert limit exceeded during filling\n- Unplanned interventions not properly documented',
      'Test Procedure': '### Run Configuration\n**Number of runs:** 3\n**Units per run:** 5,000\n**Media:** Tryptic Soy Broth (TSB)\n**Incubation:** 14 days at 20-25°C (7 days) then 30-35°C (7 days)\n\n### Pre-Media Fill Requirements\n- Equipment cleaning and sanitization\n- Environmental monitoring pass for 7 days\n- Gowning qualification of all operators\n- Media sterility and growth promotion passed\n\n### Worst-Case Conditions (Each Run)\n1. **Line clearance intervention** (5 min hold)\n2. **Vial jam clearance** (manual intervention)\n3. **Stopper bowl replenishment** (during filling)\n4. **Maximum line speed** (120 units/min)\n5. **Maximum shift duration** (8 hours)\n6. **Maximum personnel** (4 operators in Grade A)\n\n### Execution\n- Pre-operational environmental monitoring\n- Setup filling line with sterile media\n- Perform interventions at predetermined intervals\n- Continuous viable/non-viable monitoring\n- Visual inspection of fill integrity\n- Incubation and inspection schedule',
      'Results': '**Run 1:** [Date]\n- Units filled: _____\n- Contaminated units: _____\n- Environmental excursions: _____\n- Interventions completed: _____\n\n**Run 2:** [Date]\n- Units filled: _____\n- Contaminated units: _____\n- Environmental excursions: _____\n- Interventions completed: _____\n\n**Run 3:** [Date]\n- Units filled: _____\n- Contaminated units: _____\n- Environmental excursions: _____\n- Interventions completed: _____\n\n**Overall:**\n- Total units: _____\n- Total contaminated: _____\n- Contamination rate: _____\n- Acceptance: PASS / FAIL',
      'Conclusion': '[To be completed after all runs]\n\nThe aseptic process validation demonstrates that the filling process consistently produces sterile product under worst-case conditions.\n\nRecommendations:\n- Routine media fills: [frequency]\n- Revalidation triggers: [conditions]\n- Next scheduled revalidation: [date]'
    }
  },
  filter_integrity_testing: {
    title: 'Protocol - Sterilizing Filter Integrity Testing',
    type: 'protocol',
    category: 'Qualification',
    sections: [
      'Protocol Approval',
      'Objective',
      'Scope',
      'Test Methods',
      'Acceptance Criteria',
      'Procedure',
      'Results',
      'Conclusion'
    ],
    content: {
      'Objective': 'To qualify the integrity testing procedure for sterilizing-grade filters (0.2µm) used in aseptic manufacturing.\n\nDemonstrate:\n- Pre-use integrity test sensitivity\n- Post-use integrity test reliability\n- Correlation with bacterial retention',
      'Scope': 'Applies to all 0.2µm sterilizing filters:\n- Product: Polyethersulfone (PES) membrane\n- Size: 10-inch cartridge\n- Manufacturer: [Supplier Name]\n- Application: Final filtration of sterile solutions',
      'Test Methods': '**1. Bubble Point Test**\n- Principle: Measure pressure to displace liquid from largest pore\n- Advantage: Absolute measurement\n- Use: Pre-use and post-use\n\n**2. Diffusion/Forward Flow Test**\n- Principle: Measure gas diffusion through wetted membrane\n- Advantage: Non-destructive, sensitive\n- Use: Post-use integrity verification\n\n**3. Pressure Hold Test**\n- Principle: Measure pressure decay over time\n- Use: Large filters, post-use verification',
      'Acceptance Criteria': '**Bubble Point (at 80% specification):**\n- Minimum: 3.4 bar (50 psi) for 0.2µm PES\n- Filter passes if BP ≥ 3.4 bar\n\n**Forward Flow:**\n- Maximum: 15 mL/min at 2.07 bar for 10-inch filter\n- Filter passes if FF ≤ 15 mL/min\n\n**Pressure Hold:**\n- Maximum decay: 5 psi in 10 minutes\n- Filter passes if decay ≤ 5 psi',
      'Procedure': '### Pre-Use Integrity Test\n1. Install filter in housing\n2. Wet filter with WFI (per manufacturer IFU)\n3. Apply test pressure gradually\n4. Perform bubble point test\n5. Record results\n6. Accept/reject filter\n\n### Post-Use Integrity Test\n1. Complete production/filtration\n2. DO NOT dry filter\n3. Perform forward flow or pressure hold test\n4. Record results\n5. Compare to pre-use baseline\n6. Investigate any failures\n\n### Bacterial Challenge (Validation)\n- Challenge with Brevundimonas diminuta (≥10^7 CFU/cm²)\n- Demonstrate complete retention\n- Correlate with integrity test results',
      'Results': '**Pre-Use Tests (n=10 filters):**\n\n| Filter ID | Bubble Point (bar) | Forward Flow (mL/min) | Pass/Fail |\n|-----------|-------------------|----------------------|----------|\n| F001 | _____ | _____ | _____ |\n| F002 | _____ | _____ | _____ |\n\n**Post-Use Tests (n=10 filters):**\n\n| Filter ID | Forward Flow (mL/min) | Pressure Decay (psi) | Pass/Fail |\n|-----------|----------------------|---------------------|----------|\n| F001 | _____ | _____ | _____ |\n\n**Bacterial Challenge:**\n- Challenge organism: B. diminuta ATCC 19146\n- Challenge level: _____ CFU/cm²\n- Filtrate CFU: _____ (target: 0)\n- Retention: _____ log',
      'Conclusion': 'The integrity testing methods are qualified and suitable for routine use.\n\nIntegrity tests correlate with bacterial retention and reliably detect compromised filters.\n\nRecommendations:\n- Implement pre-use and post-use integrity testing per SOP\n- Investigate any filter failures immediately\n- Requalify annually or per filter change'
    }
  }
}

// Form Templates
const FORM_TEMPLATES: Record<string, TemplateConfig> = {
  deviation: {
    title: 'Form - Deviation Report',
    type: 'form',
    category: 'Quality',
    sections: [
      'Deviation Number',
      'Date/Time Detected',
      'Detected By',
      'Area/Process Affected',
      'Description',
      'Immediate Action Taken',
      'Investigation',
      'Root Cause Analysis',
      'CAPA',
      'Verification',
      'Closure'
    ]
  },
  batch_record: {
    title: 'Form - Batch Manufacturing Record',
    type: 'form',
    category: 'Production',
    sections: [
      'Batch Number',
      'Product Name/Code',
      'Manufacturing Date',
      'Equipment Used',
      'Personnel',
      'Raw Materials',
      'In-Process Controls',
      'Environmental Monitoring',
      'Yield Calculation',
      'QA Review',
      'Approval'
    ]
  },
  investigation_report: {
    title: 'Form - OOS/OOT Investigation Report',
    type: 'form',
    category: 'Quality',
    sections: [
      'Investigation Details',
      'Event Description',
      'Immediate Actions',
      'Investigation Phase I',
      'Investigation Phase II',
      'Root Cause',
      'CAPA',
      'Conclusion'
    ],
    content: {
      'Investigation Details': '**Investigation No:** INV-_______\n**Date Initiated:** ___/___/____\n**Initiated By:** _______________\n**Type:** ☐ OOS (Out-of-Specification)  ☐ OOT (Out-of-Trend)\n**Product/Batch:** _______________\n**Test/Parameter:** _______________\n**Expected Result:** _______________\n**Actual Result:** _______________\n**Deviation:** _____%',
      'Event Description': 'Provide detailed description of the OOS/OOT event:\n\n**Test Method:** _______________\n**Analyst:** _______________\n**Date of Analysis:** _______________\n**Sample ID:** _______________\n**Instrument Used:** _______________\n**Specification Limit:** _______________\n**Observed Value:** _______________\n\n**Impact Assessment:**\n☐ High - Product release affected, patient safety concern\n☐ Medium - Batch disposition unclear, further investigation needed\n☐ Low - Isolated incident, no product impact',
      'Immediate Actions': 'Actions taken immediately upon discovery:\n\n☐ Sample retained for retesting\n☐ Batch placed on hold\n☐ Production notified\n☐ QA management notified\n☐ Additional sampling performed\n☐ Equipment quarantined\n\n**Immediate Corrective Action:**\n_________________________________\n\n**By:** _______________  **Date:** ___/___/____',
      'Investigation Phase I': '**Objective:** Rule out laboratory error\n\n**Laboratory Investigation:**\n☐ Sample preparation reviewed - Compliant: ☐ Yes ☐ No\n☐ Test procedure followed - Compliant: ☐ Yes ☐ No\n☐ Instrument calibration verified - Compliant: ☐ Yes ☐ No\n☐ Reagents/standards checked - Compliant: ☐ Yes ☐ No\n☐ Analyst training verified - Compliant: ☐ Yes ☐ No\n☐ Calculations reviewed - Correct: ☐ Yes ☐ No\n☐ Raw data reviewed - Acceptable: ☐ Yes ☐ No\n\n**Retest Results (if applicable):**\n- Retest 1: _____\n- Retest 2: _____\n- Average: _____\n\n**Phase I Conclusion:**\n☐ Laboratory error confirmed - Investigation closed\n☐ No laboratory error found - Proceed to Phase II',
      'Investigation Phase II': '**Objective:** Identify root cause in manufacturing/production\n\n**Manufacturing Investigation:**\n\n1. **Raw Materials Review:**\n   - All materials within specification: ☐ Yes ☐ No\n   - Storage conditions appropriate: ☐ Yes ☐ No\n   - Expiry dates verified: ☐ Yes ☐ No\n\n2. **Process Review:**\n   - Process parameters within range: ☐ Yes ☐ No\n   - Equipment functioning properly: ☐ Yes ☐ No\n   - Environmental conditions acceptable: ☐ Yes ☐ No\n   - Personnel qualified and trained: ☐ Yes ☐ No\n\n3. **Batch Documentation Review:**\n   - Batch record complete and accurate: ☐ Yes ☐ No\n   - Deviations during manufacture: ☐ Yes ☐ No\n   - Previous batches review: Trend identified: ☐ Yes ☐ No\n\n**Additional Testing:**\n- Other parameters tested: _____\n- Results: _____',
      'Root Cause': '**Root Cause Analysis Method Used:**\n☐ 5 Whys\n☐ Fishbone Diagram\n☐ Fault Tree Analysis\n\n**Root Cause Statement:**\n_________________________________\n_________________________________\n\n**Supporting Evidence:**\n_________________________________\n\n**Assignable Cause:**\n☐ Yes - Root cause identified\n☐ No - Root cause not definitively identified (document rationale)',
      'CAPA': '**Corrective Action (eliminate root cause):**\n\nAction: _________________________________\nResponsible: _______________\nTarget Date: ___/___/____\nStatus: ☐ Open ☐ Completed\n\n**Preventive Action (prevent recurrence):**\n\nAction: _________________________________\nResponsible: _______________\nTarget Date: ___/___/____\nStatus: ☐ Open ☐ Completed\n\n**Effectiveness Check:**\nMethod: _________________________________\nScheduled Date: ___/___/____\nResult: ☐ Effective ☐ Not Effective',
      'Conclusion': '**Investigation Outcome:**\n☐ Assignable cause identified - Laboratory error\n☐ Assignable cause identified - Manufacturing deviation\n☐ No assignable cause found - Material variability within control\n\n**Batch Disposition:**\n☐ Released\n☐ Rejected\n☐ Reworked\n☐ Pending additional testing\n\n**Regulatory Reporting Required:**\n☐ Yes - Type: _____\n☐ No\n\n**Signatures:**\nInvestigator: _______________  Date: ___/___/____\nQA Review: _______________  Date: ___/___/____\nQA Approval: _______________  Date: ___/___/____'
    }
  },
  training_record: {
    title: 'Form - GMP Training Record',
    type: 'form',
    category: 'Training',
    sections: [
      'Employee Information',
      'Training Details',
      'Assessment',
      'Qualification',
      'Approval'
    ],
    content: {
      'Employee Information': '**Employee Name:** _______________\n**Employee ID:** _______________\n**Department:** _______________\n**Job Title:** _______________\n**Hire Date:** ___/___/____\n**Supervisor:** _______________',
      'Training Details': '**Training Title:** _______________\n**Training Type:**\n☐ Initial Training\n☐ Refresher Training\n☐ Change Control Related\n☐ Requalification\n\n**Training Date:** ___/___/____\n**Duration:** _____ hours\n**Trainer:** _______________\n**Trainer Qualification:** _______________\n\n**Training Method:**\n☐ Classroom/Presentation\n☐ On-the-Job Training (OJT)\n☐ Self-Study with Assessment\n☐ Practical Demonstration\n\n**Topics Covered:**\n☐ GMP Fundamentals\n☐ Gowning Procedures\n☐ Aseptic Technique\n☐ Cleaning & Disinfection\n☐ Environmental Monitoring\n☐ Documentation Practices\n☐ Equipment Operation\n☐ Deviation Reporting\n☐ Other: _______________',
      'Assessment': '**Written Test:**\n- Questions: _____ / _____\n- Score: _____% (Passing: ≥80%)\n- Result: ☐ Pass ☐ Fail\n\n**Practical Assessment:**\n- Task: _______________\n- Performance: ☐ Satisfactory ☐ Unsatisfactory\n- Observations: _______________\n\n**Overall Assessment:**\n☐ Competent - Qualified to perform task independently\n☐ Needs Improvement - Additional training required\n☐ Failed - Retraining necessary',
      'Qualification': '**Qualified Activities/SOPs:**\n\n| SOP Number | SOP Title | Qualified Date | Next Review |\n|------------|-----------|----------------|------------|\n| _________ | _________ | ___/___/____ | ___/___/____ |\n| _________ | _________ | ___/___/____ | ___/___/____ |\n\n**Restrictions/Limitations:**\n_______________\n\n**Requalification Required:**\n☐ Annually\n☐ Every 2 years\n☐ Upon procedurechange\n☐ Other: _______________',
      'Approval': '**Trainee Acknowledgment:**\nI confirm that I have completed the training and understand the procedures.\n\nSignature: _______________  Date: ___/___/____\n\n**Trainer Certification:**\nI confirm that the trainee has successfully completed training and demonstrated competency.\n\nSignature: _______________  Date: ___/___/____\n\n**Supervisor Approval:**\nThe trainee is qualified to perform the listed activities.\n\nSignature: _______________  Date: ___/___/____\n\n**QA Approval:**\nTraining documentation reviewed and approved.\n\nSignature: _______________  Date: ___/___/____'
    }
  },
  environmental_monitoring_record: {
    title: 'Form - Environmental Monitoring Record',
    type: 'form',
    category: 'Monitoring',
    sections: [
      'Header Information',
      'Viable Monitoring',
      'Non-Viable Monitoring',
      'Results Summary',
      'Review'
    ],
    content: {
      'Header Information': '**Date:** ___/___/____\n**Shift:** ☐ Day ☐ Night\n**Room/Area:** _______________\n**Classification:** ☐ Grade A ☐ Grade B ☐ Grade C ☐ Grade D\n**Activity:** ☐ At-Rest ☐ In-Operation\n**Batch/Campaign:** _______________\n**Monitored By:** _______________',
      'Viable Monitoring': '**Active Air Sampling:**\n\n| Location | Sample Vol (L) | Start Time | CFU Count | Alert Limit | Action Limit | Pass/Fail |\n|----------|----------------|------------|-----------|-------------|--------------|----------|\n| Grade A-1 | 1000 | ______ | _____ | <1 | <1 | ☐ P ☐ F |\n| Grade A-2 | 1000 | ______ | _____ | <1 | <1 | ☐ P ☐ F |\n| Grade B-1 | 1000 | ______ | _____ | 5 | 10 | ☐ P ☐ F |\n| Grade B-2 | 1000 | ______ | _____ | 5 | 10 | ☐ P ☐ F |\n\n**Settle Plates (4-hour exposure):**\n\n| Location | Exposure Time | CFU Count | Alert Limit | Action Limit | Pass/Fail |\n|----------|---------------|-----------|-------------|--------------|----------|\n| Grade A-1 | 4 hrs | _____ | <1 | <1 | ☐ P ☐ F |\n| Grade A-2 | 4 hrs | _____ | <1 | <1 | ☐ P ☐ F |\n| Grade B-1 | 4 hrs | _____ | 5 | 10 | ☐ P ☐ F |\n\n**Surface Monitoring (Contact Plates):**\n\n| Location/Surface | CFU Count | Alert Limit | Action Limit | Pass/Fail |\n|------------------|-----------|-------------|--------------|----------|\n| Filling needles | _____ | <1 | <1 | ☐ P ☐ F |\n| Stopper bowl | _____ | <1 | <1 | ☐ P ☐ F |\n| Work surface | _____ | <1 | <1 | ☐ P ☐ F |\n\n**Personnel Monitoring (Glove Prints):**\n\n| Operator ID | Sample Time | CFU Count | Alert Limit | Action Limit | Pass/Fail |\n|-------------|-------------|-----------|-------------|--------------|----------|\n| _________ | ______ | _____ | <1 | <1 | ☐ P ☐ F |\n| _________ | ______ | _____ | <1 | <1 | ☐ P ☐ F |',
      'Non-Viable Monitoring': '**Particle Counts:**\n\n| Location | Time | ≥0.5µm | ≥5.0µm | Grade Limit 0.5µm | Grade Limit 5.0µm | Pass/Fail |\n|----------|------|--------|--------|-------------------|------------------|----------|\n| Grade A-1 | __:__ | _____ | _____ | 3,520 | 20 | ☐ P ☐ F |\n| Grade A-2 | __:__ | _____ | _____ | 3,520 | 20 | ☐ P ☐ F |\n| Grade B | __:__ | _____ | _____ | 3,520 | 29 | ☐ P ☐ F |\n| Grade B | __:__ | _____ | _____ | 3,520 | 29 | ☐ P ☐ F |\n\n**Temperature & Humidity:**\n\n| Time | Temperature (°C) | Spec | Humidity (%RH) | Spec | Pass/Fail |\n|------|-----------------|------|----------------|------|----------|\n| __:__ | _____ | 18-25 | _____ | 30-60 | ☐ P ☐ F |\n| __:__ | _____ | 18-25 | _____ | 30-60 | ☐ P ☐ F |\n\n**Differential Pressure:**\n\n| Area | Target (Pa) | Actual (Pa) | Pass/Fail |\n|------|-------------|-------------|----------|\n| Grade A → B | ≥10 | _____ | ☐ P ☐ F |\n| Grade B → C | ≥10 | _____ | ☐ P ☐ F |',
      'Results Summary': '**Overall Result:**\n☐ All parameters within limits\n☐ Alert limit exceeded - Investigation required\n☐ Action limit exceeded - Immediate action required\n\n**Excursions:**\nNumber of excursions: _____\n\nDetails:\n_______________________________________________\n\n**Corrective Actions Taken:**\n_______________________________________________',
      'Review': '**Performed By:**\nSignature: _______________  Date: ___/___/____\n\n**Reviewed By (Supervisor):**\nSignature: _______________  Date: ___/___/____\n\n**QA Review:**\n☐ Acceptable - No action required\n☐ Investigation initiated (INV-_______)\n\nSignature: _______________  Date: ___/___/____'
    }
  }
}

// Checklist Templates
const CHECKLIST_TEMPLATES: Record<string, TemplateConfig> = {
  audit: {
    title: 'Checklist - GMP Audit for Aseptic Manufacturing',
    type: 'checklist',
    category: 'Audit',
    sections: [
      'Facility Design and Layout',
      'HVAC Systems',
      'Personnel Training',
      'Cleaning and Disinfection',
      'Environmental Monitoring',
      'Media Fills',
      'Equipment Qualification',
      'Process Validation',
      'Documentation',
      'CAPA System',
      'Change Control'
    ]
  },
  release: {
    title: 'Checklist - Batch Release',
    type: 'checklist',
    category: 'Quality',
    sections: [
      'Documentation Complete',
      'In-Process Results Reviewed',
      'Environmental Monitoring Reviewed',
      'Deviations Resolved',
      'CAPA Reviewed',
      'Specifications Met',
      'Stability Samples Taken',
      'Certificate of Analysis',
      'QP Review',
      'Final Approval'
    ]
  },
  cleanroom_daily: {
    title: 'Checklist - Daily Cleanroom Operations',
    type: 'checklist',
    category: 'Operations',
    sections: [
      'Pre-Operational Checks',
      'Environmental Conditions',
      'Equipment Status',
      'Documentation',
      'Sign-Off'
    ],
    content: {
      'Pre-Operational Checks': '**Date:** ___/___/____\n**Shift:** ☐ Day ☐ Night\n**Room:** _______________\n**Grade:** ☐ A ☐ B ☐ C ☐ D\n\n☐ Room visually clean and free of debris\n☐ No unauthorized materials present\n☐ Cleaning performed and documented\n☐ Disinfectant rotation verified\n☐ Pass-through chambers cleaned\n☐ Waste containers emptied\n☐ Gowning area organized and stocked\n☐ Air locks functioning properly\n☐ Door interlocks operational\n☐ Emergency procedures posted and visible',
      'Environmental Conditions': '☐ Temperature within specification (18-25°C): _____ °C\n☐ Humidity within specification (30-60% RH): _____ %\n☐ Differential pressure maintained (≥10 Pa): _____ Pa\n☐ Air changes per hour verified: _____ ACH\n☐ HEPA filter integrity alarm functional\n☐ Particle counter operational\n☐ Environmental monitoring schedule posted\n☐ Previous day EM results reviewed\n☐ No alert/action limit excursions\n☐ Airflow pattern visualization performed (smoke study)',
      'Equipment Status': '☐ Filling line clean and ready\n☐ Sterilization equipment operational\n☐ Autoclave daily verification complete\n☐ Balance calibration current\n☐ Incubators at proper temperature\n☐ Water system TOC/conductivity acceptable\n☐ Compressed gases pressure verified\n☐ Emergency eyewash/shower functional\n☐ Fire extinguishers inspected (monthly)\n☐ First aid kit stocked',
      'Documentation': '☐ Batch records available for today production\n☐ Material releases verified\n☐ Equipment logbooks up-to-date\n☐ Deviation log reviewed\n☐ Change control affecting area reviewed\n☐ Training records current for all operators\n☐ Previous shift communication reviewed\n☐ Planned interventions documented\n☐ Batch-specific risk assessments available',
      'Sign-Off': '**Issues Identified:**\n_______________________________________________\n\n**Corrective Actions Taken:**\n_______________________________________________\n\n**Room Status:**\n☐ Ready for production\n☐ Conditional release (specify): _______________\n☐ Not ready - Do not use\n\n**Performed By:**\nName: _______________\nSignature: _______________\nDate/Time: ___/___/____ __:__\n\n**Supervisor Approval:**\nName: _______________\nSignature: _______________\nDate/Time: ___/___/____ __:__'
    }
  },
  equipment_qualification: {
    title: 'Checklist - Equipment Qualification Review',
    type: 'checklist',
    category: 'Qualification',
    sections: [
      'Equipment Information',
      'DQ - Design Qualification',
      'IQ - Installation Qualification',
      'OQ - Operational Qualification',
      'PQ - Performance Qualification',
      'Final Review'
    ],
    content: {
      'Equipment Information': '**Equipment Name:** _______________\n**Equipment ID:** _______________\n**Manufacturer:** _______________\n**Model:** _______________\n**Serial Number:** _______________\n**Location:** _______________\n**Criticality:** ☐ Critical ☐ Major ☐ Minor\n**GMP Impact:** ☐ Direct ☐ Indirect ☐ None',
      'DQ - Design Qualification': '☐ User Requirements Specification (URS) completed\n☐ Functional Specification (FS) reviewed\n☐ Design Specification (DS) approved\n☐ Design meets GMP requirements\n☐ Design meets user needs\n☐ Vendor assessment completed\n☐ Risk assessment performed\n☐ Change control for design changes\n☐ Design review meeting minutes\n☐ QA approval of design\n\n**DQ Report:** ☐ Approved  ☐ Pending  ☐ N/A\n**Report No:** _______________',
      'IQ - Installation Qualification': '☐ IQ Protocol approved before execution\n☐ Equipment received and inspected\n☐ Packing list verified\n☐ Damage assessment completed\n☐ Installation per manufacturer IFU\n☐ Utilities verified (electrical, water, gas, etc.)\n☐ Environmental conditions suitable\n☐ Safety features verified\n☐ Instrument calibration performed\n☐ Preventive maintenance schedule established\n☐ Operator manuals available\n☐ Spare parts list provided\n☐ As-built drawings available\n☐ Installation deviation documented\n☐ IQ test results meet acceptance criteria\n\n**IQ Report:** ☐ Approved  ☐ Pending\n**Report No:** _______________',
      'OQ - Operational Qualification': '☐ OQ Protocol approved before execution\n☐ Operating ranges tested\n☐ Alarm and safety features tested\n☐ Control system functionality verified\n☐ Worst-case conditions tested\n☐ Reproducibility demonstrated\n☐ Equipment operates per specification\n☐ SOPs drafted and available\n☐ Operator training completed\n☐ Change parts/components tested\n☐ Software validation (if applicable)\n☐ Data integrity controls verified\n☐ OQ test results meet acceptance criteria\n☐ Deviations resolved\n\n**OQ Report:** ☐ Approved  ☐ Pending\n**Report No:** _______________',
      'PQ - Performance Qualification': '☐ PQ Protocol approved before execution\n☐ Equipment used under actual production conditions\n☐ Process parameters at operational limits tested\n☐ Product quality verified\n☐ Consecutive successful runs completed (typically 3)\n☐ Statistical analysis performed\n☐ Process capability demonstrated\n☐ Batch records reviewed\n☐ Environmental monitoring during PQ acceptable\n☐ No adverse impact on adjacent areas\n☐ PQ test results meet acceptance criteria\n☐ Equipment suitable for intended use\n\n**PQ Report:** ☐ Approved  ☐ Pending\n**Report No:** _______________',
      'Final Review': '**Overall Qualification Status:**\n☐ Fully Qualified - Equipment released for GMP use\n☐ Conditionally Qualified - Restrictions apply: _______________\n☐ Not Qualified - Do not use for GMP\n\n**Requalification Requirements:**\n☐ Periodic (Annual/Biennial)\n☐ After major maintenance\n☐ After relocation\n☐ After software update\n☐ Change control driven\n\n**Next Requalification Due:** ___/___/____\n\n**Summary of Qualification:**\n_______________________________________________\n\n**QA Review:**\nName: _______________\nSignature: _______________\nDate: ___/___/____\n\n**QA Approval:**\nName: _______________\nSignature: _______________\nDate: ___/___/____'
    }
  },
  supplier_audit: {
    title: 'Checklist - Supplier Audit (GMP)',
    type: 'checklist',
    category: 'Audit',
    sections: [
      'Supplier Information',
      'Quality Management System',
      'Manufacturing Facilities',
      'Process Controls',
      'Testing and Release',
      'Audit Conclusion'
    ],
    content: {
      'Supplier Information': '**Audit Date:** ___/___/____\n**Supplier Name:** _______________\n**Site Address:** _______________\n**Materials Supplied:** _______________\n**Audit Type:** ☐ Initial ☐ Re-audit ☐ For-Cause\n**Audit Team:** _______________\n**Previous Audit Date:** ___/___/____',
      'Quality Management System': '☐ Quality Manual available and current\n☐ GMP/ISO certification valid (specify): _______________\n☐ Organizational chart and responsibilities defined\n☐ Document control system in place\n☐ Change control procedure implemented\n☐ Deviation management system functional\n☐ CAPA system effective\n☐ Internal audit program active\n☐ Management review conducted regularly\n☐ Quality agreements in place\n☐ Supplier qualification program\n☐ Risk management approach documented\n\n**QMS Rating:** ☐ Acceptable ☐ Minor findings ☐ Major findings\n**Comments:** _______________',
      'Manufacturing Facilities': '☐ Facility layout appropriate for operations\n☐ Cleanroom classification verified (if applicable)\n☐ Environmental monitoring program in place\n☐ HVAC systems qualified and maintained\n☐ Water systems qualified (WFI/Purified Water)\n☐ Pest control program active\n☐ Waste disposal procedures adequate\n☐ Material flow prevents cross-contamination\n☐ Personnel flow controlled\n☐ Cleaning procedures validated\n☐ Equipment properly identified and maintained\n☐ Calibration program current\n☐ Preventive maintenance schedules followed\n\n**Facilities Rating:** ☐ Acceptable ☐ Minor findings ☐ Major findings\n**Comments:** _______________',
      'Process Controls': '☐ Manufacturing procedures (SOPs/BMRs) available\n☐ Process parameters defined and monitored\n☐ In-process controls established\n☐ Critical process parameters identified\n☐ Process validation completed\n☐ Batch record review process in place\n☐ Material traceability ensured\n☐ Rework/reprocessing procedures defined\n☐ Hold and quarantine areas designated\n☐ Sampling procedures appropriate\n☐ Personnel training documented\n☐ Aseptic processing validated (if applicable)\n☐ Sterility assurance level appropriate\n\n**Process Controls Rating:** ☐ Acceptable ☐ Minor findings ☐ Major findings\n**Comments:** _______________',
      'Testing and Release': '☐ QC laboratory adequate for testing\n☐ Test methods validated\n☐ Reference standards qualified\n☐ Stability program in place\n☐ Microbiological testing capability verified\n☐ Out-of-specification procedure defined\n☐ Certificate of Analysis format acceptable\n☐ Batch release procedure documented\n☐ Retain sample program established\n☐ Specifications agreed and documented\n☐ Subcontractor testing controlled (if applicable)\n☐ Complaint handling procedure in place\n☐ Product recall procedure tested\n\n**Testing/Release Rating:** ☐ Acceptable ☐ Minor findings ☐ Major findings\n**Comments:** _______________',
      'Audit Conclusion': '**Overall Audit Result:**\n☐ Approved - No restrictions\n☐ Approved - With observations (specify): _______________\n☐ Conditionally Approved - Pending CAPA closure\n☐ Not Approved - Do not use\n\n**Critical Findings:** _____\n**Major Findings:** _____\n**Minor Findings:** _____\n**Observations:** _____\n\n**CAPA Required:**\n☐ Yes - Response due: ___/___/____\n☐ No\n\n**Next Audit Date:** ___/___/____\n\n**Auditor Signatures:**\nLead Auditor: _______________  Date: ___/___/____\nTeam Member: _______________  Date: ___/___/____\n\n**QA Approval:**\nName: _______________\nSignature: _______________\nDate: ___/___/____'
    }
  }
}

// Generate section-specific content
function generateSectionContent(section: string, type: TemplateType): string {
  const templates: Record<string, string> = {
    'Purpose': `This ${type} establishes the requirements and procedures for [describe purpose].\n\nThe purpose is to ensure compliance with:\n- EU GMP Annex 1\n- [Other applicable regulations]\n- Internal quality standards`,
    
    'Scope': `This ${type} applies to:\n- [List areas, processes, or personnel]\n- [Specify limitations or exclusions]`,
    
    'Responsibility': `**Quality Assurance:** [Responsibilities]\n**Production:** [Responsibilities]\n**Quality Control:** [Responsibilities]\n**Maintenance:** [Responsibilities]`,
    
    'Definitions': `**Term 1:** Definition\n**Term 2:** Definition\n[Add relevant GMP-specific terminology]`,
    
    'Procedure': `### Step-by-step Procedure:\n\n1. [First step with details]\n2. [Second step with details]\n3. [Continue...]\n\n**Critical Steps:**\n- [Highlight critical control points]\n- [Note any special requirements]`,
    
    'Documentation': `The following records must be maintained:\n- [Record type 1]\n- [Record type 2]\n\n**Retention:** [Specify retention period per regulations]\n**Location:** [Specify where records are stored]`,
    
    'References': `1. EU GMP Annex 1 - Manufacture of Sterile Medicinal Products\n2. [Internal SOPs]\n3. [Relevant ISO standards]\n4. [Equipment manuals]`,
    
    'Acceptance Criteria': `| Parameter | Specification | Method |\n|-----------|---------------|--------|\n| [Param 1] | [Limit] | [Test method] |\n| [Param 2] | [Limit] | [Test method] |`,
    
    'Alert and Action Limits': `| Area/Parameter | Alert Limit | Action Limit |\n|----------------|-------------|-------------|\n| Grade A | [Value] | [Value] |\n| Grade B | [Value] | [Value] |\n| Grade C | [Value] | [Value] |`,
    
    'Revision History': `| Version | Date | Description of Changes | Author |\n|---------|------|------------------------|--------|\n| 1.0 | ${new Date().toLocaleDateString('sl-SI')} | Initial version | [Name] |`
  }
  
  return templates[section] || `[Complete this section with relevant information for: ${section}]`
}

// Get all available templates
export function getAllTemplates(): Record<string, TemplateConfig> {
  return {
    ...SOP_TEMPLATES,
    ...PROTOCOL_TEMPLATES,
    ...FORM_TEMPLATES,
    ...CHECKLIST_TEMPLATES
  }
}

// Get templates by type
export function getTemplatesByType(type: TemplateType): Record<string, TemplateConfig> {
  const all = getAllTemplates()
  return Object.fromEntries(
    Object.entries(all).filter(([_, config]) => config.type === type)
  )
}

// Export template as downloadable file
export async function exportTemplate(templateKey: string, customData: any, format: ExportFormat = 'docx'): Promise<void> {
  const templates = getAllTemplates()
  const config = templates[templateKey]
  
  if (!config) {
    throw new Error(`Template ${templateKey} not found`)
  }

  if (format === 'docx') {
    await exportAsDocx(config, customData)
  } else {
    await exportAsPdf(config, customData)
  }
}

// Export as DOCX
async function exportAsDocx(config: TemplateConfig, customData: any): Promise<void> {
  const sections: Paragraph[] = []
  
  // Title page
  sections.push(
    new Paragraph({
      text: config.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  )
  
  // Metadata
  sections.push(
    new Paragraph({
      text: 'Document Information',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    })
  )
  
  const metadataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Company:', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(customData?.company || '[Company Name]')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Site:', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(customData?.site || '[Site Location]')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Document Type:', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(config.type.toUpperCase())] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Category:', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(config.category)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Effective Date:', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(customData?.effectiveDate || new Date().toLocaleDateString('sl-SI'))] })
        ]
      })
    ]
  })
  
  sections.push(new Paragraph({ text: '' }))
  
  // Approval signatures
  sections.push(
    new Paragraph({
      text: 'Approval Signatures',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    })
  )
  
  const approvalTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Role', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Name', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Signature', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true })] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Prepared By')] }),
          new TableCell({ children: [new Paragraph(customData?.preparedBy || '[Name]')] }),
          new TableCell({ children: [new Paragraph('_________________')] }),
          new TableCell({ children: [new Paragraph('__________')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Reviewed By')] }),
          new TableCell({ children: [new Paragraph(customData?.reviewedBy || '[Name]')] }),
          new TableCell({ children: [new Paragraph('_________________')] }),
          new TableCell({ children: [new Paragraph('__________')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Approved By')] }),
          new TableCell({ children: [new Paragraph(customData?.approvedBy || '[Name]')] }),
          new TableCell({ children: [new Paragraph('_________________')] }),
          new TableCell({ children: [new Paragraph('__________')] })
        ]
      })
    ]
  })
  
  sections.push(new Paragraph({ text: '' }))
  
  // Document sections
  config.sections.forEach(section => {
    sections.push(
      new Paragraph({
        text: section,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )
    
    // Use custom content if available, otherwise generate generic content
    const content = config.content?.[section] || generateSectionContent(section, config.type)
    const lines = content.split('\n')
    
    lines.forEach(line => {
      if (line.trim()) {
        sections.push(
          new Paragraph({
            text: line,
            spacing: { after: 100 }
          })
        )
      }
    })
  })
  
  // Document control
  sections.push(
    new Paragraph({
      text: 'Document Control',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    })
  )
  
  const docControlTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Document Number:', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(customData?.docNumber || '[AUTO-GENERATED]')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Supersedes:', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(customData?.supersedes || 'N/A')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Next Review Date:', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(customData?.nextReview || '[Date + 2 years]')] })
        ]
      })
    ]
  })
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: sections
    }]
  })
  
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${config.title.replace(/[^a-z0-9]/gi, '_')}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Export as PDF
async function exportAsPdf(config: TemplateConfig, customData: any): Promise<void> {
  const doc = new jsPDF()
  let yPos = 20
  
  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(config.title, 105, yPos, { align: 'center' })
  yPos += 15
  
  // Metadata
  doc.setFontSize(14)
  doc.text('Document Information', 20, yPos)
  yPos += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Company: ${customData?.company || '[Company Name]'}`, 20, yPos)
  yPos += 7
  doc.text(`Site: ${customData?.site || '[Site Location]'}`, 20, yPos)
  yPos += 7
  doc.text(`Document Type: ${config.type.toUpperCase()}`, 20, yPos)
  yPos += 7
  doc.text(`Category: ${config.category}`, 20, yPos)
  yPos += 7
  doc.text(`Effective Date: ${customData?.effectiveDate || new Date().toLocaleDateString('sl-SI')}`, 20, yPos)
  yPos += 15
  
  // Approval signatures
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Approval Signatures', 20, yPos)
  yPos += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Prepared By: ${customData?.preparedBy || '[Name]'} _________________ __________`, 20, yPos)
  yPos += 7
  doc.text(`Reviewed By: ${customData?.reviewedBy || '[Name]'} _________________ __________`, 20, yPos)
  yPos += 7
  doc.text(`Approved By: ${customData?.approvedBy || '[Name]'} _________________ __________`, 20, yPos)
  yPos += 15
  
  // Sections
  config.sections.forEach(section => {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(section, 20, yPos)
    yPos += 8
    
    // Use custom content if available, otherwise generate generic content
    const content = config.content?.[section] || generateSectionContent(section, config.type)
    const lines = doc.splitTextToSize(content, 170)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    lines.forEach((line: string) => {
      if (yPos > 280) {
        doc.addPage()
        yPos = 20
      }
      doc.text(line, 20, yPos)
      yPos += 5
    })
    
    yPos += 5
  })
  
  // Document control
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Document Control', 20, yPos)
  yPos += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Document Number: ${customData?.docNumber || '[AUTO-GENERATED]'}`, 20, yPos)
  yPos += 7
  doc.text(`Supersedes: ${customData?.supersedes || 'N/A'}`, 20, yPos)
  yPos += 7
  doc.text(`Next Review Date: ${customData?.nextReview || '[Date + 2 years]'}`, 20, yPos)
  
  doc.save(`${config.title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
}
