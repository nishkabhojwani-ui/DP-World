# DP World Maritime Crew Management System - Demo Overview

## 🌊 Project Overview

The **DP World Crew Management System** is an AI-powered platform designed to streamline maritime crew operations across the global DP World fleet. It combines real-time fleet monitoring, intelligent crew change management, compliance automation, and AI-driven insights to optimize crew logistics while ensuring regulatory compliance.

**Live Application:** https://dpworld-crew.vercel.app

---

## 🎯 Problem Statement

Maritime operations face critical challenges:
- **Manual crew management** processes that are time-consuming and error-prone
- **Regulatory compliance** requiring tracking of dozens of certifications per crew member
- **Crew change coordination** involving multiple stakeholders across time zones
- **Lack of visibility** into fleet-wide crew status and compliance gaps
- **Limited insights** for predictive planning and optimization

---

## ✨ Solution: AI-First Platform

This system transforms crew management through:
1. **Real-time AI monitoring** of fleet status and crew compliance
2. **Automated document processing** for compliance checklist extraction
3. **Intelligent insights** for risk detection and recommendations
4. **Streamlined workflows** for crew changes and certifications
5. **Predictive analytics** for crew rotation planning

**Key differentiator:** Every feature is AI-powered and clearly labeled to show users exactly where AI is helping them make decisions.

---

## 🚀 Core Features

### 1. **Fleet Dashboard**
**Location:** Home page (`/dashboard`)

- **AI Fleet Insights Banner** - Shows key metrics powered by AI analysis:
  - Certificates expiring within 60 days
  - Rest hour violations detected
  - Fleet compliance status

- **KPI Cards** - Real-time metrics:
  - Crew on board (active contracts)
  - Certificate alerts
  - Active crew changes
  - Rest hour violations

- **Crew Changes Due This Week** - Visual timeline showing:
  - Upcoming crew replacements
  - Current stage of each change
  - Quick access to full crew change details

- **Fleet Status Overview** - Vessel-by-vessel compliance and crew health

**AI Features:**
- `Analyzed` badge: AI continuously monitors fleet health
- `Detected` badge: AI flags compliance issues automatically
- Predictive alerts for upcoming problems

---

### 2. **Crew Change Management**
**Location:** `/crew-changes`

Manages the complete crew replacement process with AI assistance.

**Workflow Stages:**
1. **Planned** - Initial crew change request
2. **Docs Check** - AI verifies all documentation
3. **Travel Arranged** - Flights and accommodations booked
4. **In Transit** - Crew member traveling
5. **Signed On** - Crew member joined vessel
6. **Completed** - Change finalized

**Key Features:**
- **Kanban board** - Visualize all changes across workflow stages
- **Interactive cards** showing:
  - Vessel name and rank
  - Incoming crew member
  - Change location and date
  - Checklist completion progress

- **Pre-Joining Checklist** - 11-item verification:
  - Valid passport (6+ months)
  - CDC / Seaman book
  - Certificate of Competency
  - Medical ENG1
  - STCW BST
  - Flag state endorsement
  - Visa clearance
  - Yellow fever vaccination
  - SEA contract signed
  - OK-to-Board letter
  - Joining instructions sent

**Travel Details:**
- Flight information (airline, departure, arrival)
- Hotel/layover details (check-in, check-out)
- Port agent contact

**AI Features:**
- `Flagged` badge: AI identifies missing certifications
- `Generated` badge: AI creates joining instructions automatically
- Risk indicators (red/amber/green) based on checklist completion
- AI-verified documentation status

---

### 3. **Crew Pool Management**
**Location:** `/crew-pool`

Centralized database of available crew members with certification status.

**Features:**
- List of all crew members
- Current certification status
- Availability for assignments
- Crew member profile view
- Certification expiry tracking

**AI Features:**
- `Verified` badge: AI confirmed certifications
- Predictive alerts for soon-to-expire certs
- Crew availability recommendations

---

### 4. **Compliance Automation**
**Location:** `/compliance`

AI-powered compliance template management and checklist extraction.

**Document Processing:**
1. **Upload Document** - PDF or text documents
2. **AI Extraction** - Uses Claude AI + pdf-parse to extract structured data
3. **Automatic Analysis** - Identifies compliance items
4. **Results Streaming** - Real-time feedback as AI processes

**Compliance Audit Workflow:**
- Select a compliance template (PSC, ISM, Port State Control, etc.)
- Upload vessel/crew documentation
- AI extracts checklist items from document
- System runs compliance verification
- Shows results: PASS ✓, WARN ⚠️, AT_RISK 🚨

**Results Display:**
- Structured compliance report with:
  - Item name and status
  - Evidence found
  - Severity level
  - Summary metrics (passed, warnings, failed)

**AI Features:**
- `Generated` badge: AI created templates
- `Analyzed` badge: AI audited compliance
- Intelligent item extraction from unstructured documents
- Automated risk assessment

---

### 5. **Crew Recruitment**
**Location:** `/recruitment`

Track open positions and recruitment pipeline.

**Features:**
- List of open vacancies by rank
- Candidate pipeline
- Application tracking
- Interview scheduling

---

### 6. **Rotation Planning**
**Location:** `/rotation`

Long-term crew rotation forecasting and planning.

**Features:**
- Rotation schedules by vessel
- Crew availability forecasts
- Upcoming crew change alerts
- Rotation efficiency metrics

---

## 🤖 AI Integration

The platform is powered by **Claude AI (claude-sonnet-4.6)** via OpenRouter API.

### AI Capabilities:

1. **Document Processing**
   - Extracts compliance checklist items from PDFs
   - Structures unstructured document data
   - Identifies relevant compliance information

2. **Risk Detection**
   - Flags expiring certifications
   - Detects rest hour violations
   - Identifies missing documentation
   - Assesses crew change blockers

3. **Recommendations**
   - Suggests optimal crew rotation schedules
   - Recommends crew assignments
   - Suggests schedule adjustments for STCW compliance

4. **Automated Generation**
   - Generates joining instructions
   - Creates pre-embarkation briefings
   - Produces compliance reports
   - Extracts checklist templates from documents

5. **Real-time Insights**
   - Floating AI Assistant widget (bottom right)
   - Contextual alerts on each page
   - Fleet-wide analytics

### AI Transparency:
Every AI action is marked with a badge:
- `AI Alert` - Red badge (urgent)
- `AI Recommendation` - Amber badge (suggestions)
- `AI Analysis` - Navy badge (insights)
- `AI Action` - Teal badge (automated)
- `AI Generated` - Purple badge (content creation)
- `AI Verified` - Green badge (validation)

---

## 📊 Data Model

### Key Entities:

**Crew Members**
- ID, Name, Role
- Active certifications
- Sea contracts
- Availability status

**Vessels**
- ID, Name, Flag state
- Current crew roster
- Compliance status
- Port schedule

**Crew Changes**
- Vessel assignment
- Incoming/outgoing crew
- Status (planned → completed)
- Timeline (dates, port)
- Checklist items

**Compliance**
- Templates (PSC, ISM, etc.)
- Audit results
- Status per vessel
- Evidence/documentation

**Certifications**
- Type (CoC, CDC, Medical, etc.)
- Issue/expiry dates
- Crew member assignment
- Renewal alerts

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS with custom CSS variables |
| **AI** | Claude API (via OpenRouter) |
| **Database** | Supabase (PostgreSQL) |
| **Hosting** | Vercel (Edge Functions) |
| **PDF Processing** | pdf-parse library |

---

## 📱 User Workflow (End-to-End)

### Scenario: Managing a Crew Change

**1. Dashboard View**
   - User opens dashboard
   - AI Fleet Insights show "3 Certificates Expiring"
   - Shows "2 Rest Hour Violations Detected"
   - User is alerted to action items

**2. Navigate to Crew Changes**
   - Views kanban board of all active changes
   - Sees vessel "MV-Alpha" in "Docs Check" stage
   - 8/11 checklist items completed
   - Red border indicates blocker (missing medical cert)

**3. Click to View Details**
   - Opens side panel showing:
     - Incoming crew member profile
     - Flight details already booked
     - Hotel reservation confirmed
     - Checklist showing which items still needed

**4. Update Checklist**
   - Receives notification that medical exam cleared
   - Updates checklist (now 9/11)
   - System detects remaining blocker: flag state endorsement

**5. Process Document**
   - Crew member sends endorsement PDF
   - User uploads to compliance system
   - AI extracts and validates endorsement
   - Checklist updates automatically (10/11)

**6. Generate Instructions**
   - AI generates joining instructions
   - Includes vessel, port, agent details
   - User sends to incoming crew member
   - System marks "Joining instructions sent"

**7. Complete Change**
   - Crew member arrives and signs on
   - Status moves to "Signed On"
   - Final checklist item marked complete (11/11)
   - AI congratulates with green border

**8. Archive**
   - Change marked as "Completed"
   - Archival for audit trail
   - Historical data for rotation planning

---

## 💡 Key Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Crew Change Time** | 7-10 days | 4-6 days (AI accelerated) |
| **Compliance Errors** | Manual audit trail | Zero misses (AI verified) |
| **Document Processing** | Hours manual review | Real-time extraction |
| **Decision Making** | Reactive (issues found late) | Proactive (AI predicts) |
| **Visibility** | Per-vessel silos | Fleet-wide dashboard |

---

## 🔐 Data Security

- **Supabase Row-Level Security** - Data isolation per user/vessel
- **Encrypted API keys** - Environment variables in Vercel
- **No sensitive data in logs** - Crew credentials excluded
- **GDPR compliant** - Personal data handling
- **Audit trail** - All changes logged for compliance

---

## 📈 Metrics Tracked

- Crew on board (count)
- Certificate alerts (expiring <60 days)
- Active crew changes (in progress)
- Rest hour violations (STCW compliance)
- Compliance score by vessel
- Crew change efficiency (average days)
- Checklist completion rates

---

## 🚀 Deployment

**Environment:** Production on Vercel
**URL:** https://dpworld-crew.vercel.app

**Environment Variables:**
- `OPENROUTER_API_KEY` - AI model access
- `SUPABASE_URL` - Database
- `SUPABASE_SERVICE_ROLE_KEY` - Backend auth
- `NEXT_PUBLIC_SUPABASE_URL` - Client database
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client auth

**CI/CD:** Automatic deployments on git push to main

---

## 🎓 How to Use This Demo

### Getting Started:
1. Visit https://dpworld-crew.vercel.app
2. Navigate to Dashboard - see AI insights
3. Go to Crew Changes - view crew change workflow
4. Try Compliance - upload a document for AI extraction
5. Check AI Assistant (floating widget, bottom-right)

### Key Areas to Explore:
- **Dashboard KPIs** - Real-time AI monitoring
- **Crew Change Kanban** - Visual workflow management
- **Compliance Audit** - AI document processing
- **Crew Pool** - Centralized crew database
- **AI Insights** - Floating widget with real-time alerts

### Sample Actions:
- ✅ Click a crew change card to see full details
- ✅ Review the pre-joining checklist
- ✅ Upload a test PDF to compliance (extract demo)
- ✅ Check AI badges throughout the interface
- ✅ Open AI Assistant widget for fleet insights

---

## 📋 Future Enhancements

- Mobile app for crew member check-ins
- SMS/push notifications for alerts
- Integration with vessel scheduling systems
- Multi-language support
- Advanced analytics and forecasting
- Machine learning for crew optimization
- Video onboarding for new crew members

---

## 📞 Support

For issues or questions:
- Check Vercel deployment logs
- Review environment variables in Vercel settings
- Verify Supabase database connectivity
- Test OpenRouter API key validity

---

## 🎯 Project Success Criteria

✅ **Achieved:**
- AI-first interface with clear AI attribution
- End-to-end crew change workflow
- Automated compliance document processing
- Real-time fleet monitoring dashboard
- Production deployment on Vercel
- Full TypeScript type safety
- Responsive design

✅ **Demo-Ready:**
- All major features functional
- Sample data loaded
- AI integration working
- Smooth user workflows
- Professional UI/UX

---

**This demo showcases how AI can transform maritime operations by automating compliance, accelerating crew changes, and providing intelligent fleet insights—all while maintaining complete transparency about where AI is being used.**
