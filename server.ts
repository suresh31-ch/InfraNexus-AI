import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client utility
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Fallback deterministic coordination suggestion builder
function generateFallbackCoordination(conflict: any) {
  const projA = conflict.projectA || {};
  const projB = conflict.projectB || {};
  const road = conflict.roadSegment || 'Grand Southern Trunk (GST) Road';

  return {
    strategy: 'Sequence Reversal: Pipeline Prioritization & Deferred Asphalting',
    confidence: 'Civil Works Heuristic Engine (Deterministic Safe Fallback)',
    executiveSummary:
      'Reverse sequence detected. Water pipe trenching (WS-2026-114) requires deep excavation (2.4m) along GST Road. Milling & resurfacing (HW-2026-089) must be deferred until pipeline backfilling and compaction curing are verified.',
    proposedShift:
      'Defer HW-2026-089 start date from 2026-10-18 to 2026-12-15 (after WS-2026-114 concludes on 2026-12-10 with 5-day subgrade curing).',
    impactReductionMetric:
      'Eliminates 32 days of traffic bottleneck; preserves ₹420.0L of newly laid bitumen from immediate re-excavation.',
    tradeOffAnalysis:
      'Pushes road resurfacing into early December, requiring cold-mix bitumen patching for immediate safety during the interim.',
    recommendedDates: {
      projectA: {
        id: projA.id || 'proj_gst_resurfacing',
        code: projA.projectCode || 'HW-2026-089',
        title: projA.title || 'GST Road Bitumen Resurfacing & Milling',
        suggestedStart: '2026-12-15',
        suggestedEnd: '2027-01-20',
      },
      projectB: {
        id: projB.id || 'proj_gst_water_pipe',
        code: projB.projectCode || 'WS-2026-114',
        title: projB.title || 'Potable Water Feeder Main Pipeline Replacement',
        suggestedStart: projB.plannedStartDate || '2026-10-25',
        suggestedEnd: projB.plannedEndDate || '2026-12-10',
      },
    },
    jointTrenchingFeasible: false,
    estimatedRoadDisruptionReductionDays: 32,
    capitalExpenditureProtectedLakhs: 420.0,
    trafficImpactMitigation: [
      'Maintain one bidirectional lane with active flaggers during peak transit hours.',
      'Deploy pre-fabricated trench shoring boxes to halve open-pit hazard exposure.',
      'Require cold-mix asphalt patching on temporary pipeline backfill until permanent resurfacing begins.',
    ],
    humanReviewChecklist: [
      'Obtain hydrostatic pressure test sign-off from MetroWater Executive Engineer.',
      'Verify trench soil compaction density (minimum 95% Proctor density).',
      'Issue formal inter-agency NOC endorsed by Zonal Collector.',
    ],
    publicAdvisoryNotice: `Civic Notice: Public works along ${road} have been sequenced. Water pipeline replacement will execute first (Oct-Dec), followed by complete asphalt resurfacing in mid-December to prevent duplicate road destruction.`,
  };
}

// AI Coordination suggestion endpoint
app.post('/api/ai/conflict-coordination', async (req, res) => {
  try {
    const { conflict } = req.body;

    if (!conflict || !conflict.projectA || !conflict.projectB) {
      res.status(400).json({ error: 'Missing required conflict and project payload' });
      return;
    }

    if (!ai) {
      // Deterministic fallback if API key is missing
      const fallback = generateFallbackCoordination(conflict);
      res.json({
        source: 'heuristic_fallback',
        data: fallback,
        notice: 'Gemini API key not configured. Generated using deterministic municipal coordination heuristics.',
      });
      return;
    }

    const prompt = `You are CivicSync AI, a municipal infrastructure coordination engineer specializing in smart city public works and urban road management.
Analyze the following scheduling conflict between two municipal projects and formulate an optimal, realistic deconfliction strategy.

CONFLICT DETAILS:
- Road Corridor / Segment: ${conflict.roadSegment || 'Urban Arterial'}
- Proximity Distance: ${conflict.distanceMeters || 0} meters apart
- Date Overlap: ${conflict.overlapDays || 0} overlapping days
- Conflict Reason: ${conflict.conflictReason || 'Spatial and temporal work zone collision'}

PROJECT A:
- Title: ${conflict.projectA.title}
- Department: ${conflict.projectA.department}
- Category: ${conflict.projectA.category}
- Contractor: ${conflict.projectA.contractor || 'Municipal Works Ltd'}
- Current Dates: ${conflict.projectA.plannedStartDate} to ${conflict.projectA.plannedEndDate}
- Status: ${conflict.projectA.status}

PROJECT B:
- Title: ${conflict.projectB.title}
- Department: ${conflict.projectB.department}
- Category: ${conflict.projectB.category}
- Contractor: ${conflict.projectB.contractor || 'Urban Infra Corp'}
- Current Dates: ${conflict.projectB.plannedStartDate} to ${conflict.projectB.plannedEndDate}
- Status: ${conflict.projectB.status}

RULES TO ENFORCE:
1. Underground utility excavation (water, drainage, gas, telecom, electrical) MUST ALWAYS occur BEFORE road resurfacing or asphalting. Resurfacing before excavation results in "cut-and-cover" road destruction.
2. If both are underground utility works, propose Joint Trenching or shared civil ducting to halve public disruption.
3. Propose realistic adjusted dates for whichever project can be shifted with minimal public backlash.
4. Keep advice factual, restrained, civic-minded, and structured.

Respond strictly in valid JSON format matching this schema:
{
  "strategy": "string (Short strategy title, e.g., 'Sequential Staging: Pipeline Prioritization')",
  "summary": "string (2-3 sentences explaining why this conflict is hazardous/costly and the rationale)",
  "scheduleRecommendation": "string (Exact schedule adjustment guidance)",
  "recommendedDates": {
    "projectA": { "id": "${conflict.projectA.id}", "title": "${conflict.projectA.title}", "suggestedStart": "YYYY-MM-DD", "suggestedEnd": "YYYY-MM-DD" },
    "projectB": { "id": "${conflict.projectB.id}", "title": "${conflict.projectB.title}", "suggestedStart": "YYYY-MM-DD", "suggestedEnd": "YYYY-MM-DD" }
  },
  "jointTrenchingFeasible": boolean,
  "estimatedRoadDisruptionReductionDays": number,
  "trafficImpactMitigation": ["bullet 1", "bullet 2", "bullet 3"],
  "humanReviewChecklist": ["action item 1", "action item 2", "action item 3"],
  "publicAdvisoryNotice": "string (Concise transparent notice for the citizen portal)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    try {
      const parsed = JSON.parse(text);
      res.json({
        source: 'gemini-3.8-flash',
        data: parsed,
      });
    } catch {
      // JSON parse fallback
      const fallback = generateFallbackCoordination(conflict);
      res.json({
        source: 'heuristic_fallback',
        data: fallback,
        notice: 'AI returned non-standard formatting; fallback applied.',
      });
    }
  } catch (err: any) {
    console.error('Gemini coordination API error:', err);
    // Graceful fallback on rate-limit or network error
    const fallback = generateFallbackCoordination(req.body.conflict || {});
    res.json({
      source: 'heuristic_fallback',
      data: fallback,
      error: err.message,
      notice: 'AI endpoint error occurred. Gracefully switched to deterministic heuristic engine.',
    });
  }
});

// AI Citizen Report Analysis / Complaint Assistant endpoint
app.post('/api/ai/analyze-report', async (req, res) => {
  try {
    const { report, rawInput, imageData } = req.body;
    const inputDescription = (report && report.description) || rawInput || '';

    if (!inputDescription && !imageData) {
      res.status(400).json({ error: 'Missing complaint description or image' });
      return;
    }

    if (!ai) {
      // Deterministic classification heuristic
      let cat: any = 'repeated_excavation';
      let dept: any = 'Highways & Road Infrastructure';
      let sev = 'high';
      const descLower = inputDescription.toLowerCase();

      if (descLower.includes('water') || descLower.includes('pipe') || descLower.includes('leak') || descLower.includes('sewage')) {
        cat = 'repeated_excavation';
        dept = 'Water Supply & Sewage Board';
        sev = 'high';
      } else if (descLower.includes('cable') || descLower.includes('wire') || descLower.includes('electric') || descLower.includes('power')) {
        cat = 'unsafe_excavation';
        dept = 'Electricity & Power Utilities';
        sev = 'critical';
      } else if (descLower.includes('drain') || descLower.includes('flood') || descLower.includes('waterlog') || descLower.includes('culvert')) {
        cat = 'drainage_issues';
        dept = 'City Municipal Corporation';
        sev = 'high';
      } else if (descLower.includes('pothole') || descLower.includes('tar') || descLower.includes('asphalt') || descLower.includes('crater')) {
        cat = 'road_damage';
        dept = 'Highways & Road Infrastructure';
        sev = 'medium';
      }

      res.json({
        source: 'heuristic_assistant',
        category: cat,
        suggestedTitle: inputDescription.slice(0, 60) || 'Infrastructure Grievance Report',
        suggestedDescription: inputDescription,
        suggestedDepartment: dept,
        severity: sev,
        severityReason: 'Heuristically classified based on keywords and municipal safety rules.',
        publicSafetyConcern: sev === 'critical' || sev === 'high' ? 'High risk to two-wheelers and pedestrians.' : 'Standard traffic impedance.',
        keywords: ['infrastructure', dept.toLowerCase().split(' ')[0], cat],
        missingDetailsSuggestion: 'Please confirm specific landmark and road lane direction (e.g. northbound vs southbound).',
      });
      return;
    }

    const contents: any[] = [];
    if (imageData && typeof imageData === 'string' && imageData.includes('base64,')) {
      const parts = imageData.split('base64,');
      const mimeType = parts[0].replace('data:', '').replace(';', '');
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: parts[1],
        },
      });
    }

    const promptText = `You are the InfraNexus AI Citizen Complaint Assistant for municipal public works.
Analyze this citizen-submitted grievance report and (if provided) photo:
Citizen Text: "${inputDescription}"

Evaluate this carefully according to civil engineering standards:
1. Category must be strictly one of: "road_damage", "unsafe_excavation", "stalled_work", "drainage_issues", "repeated_excavation".
2. Suggested responsible department must be strictly one of:
   - "Highways & Road Infrastructure" (for asphalt, road surface, curbs, road widening)
   - "Water Supply & Sewage Board" (for pipelines, manholes, drainage leaks, potable water lines)
   - "Electricity & Power Utilities" (for power cables, transformers, utility poles)
   - "Optical Fiber & Telecom" (for telecom ducts, fiber conduits)
   - "City Municipal Corporation" (for storm drains, footpaths, garbage/debris, general civic)
3. Formulate a neutral, clean, professional title and polished description.
4. Assess public safety concern realistically.

Return strictly JSON matching this format:
{
  "category": "road_damage" | "unsafe_excavation" | "stalled_work" | "drainage_issues" | "repeated_excavation",
  "suggestedTitle": "Concise factual grievance title",
  "suggestedDescription": "Structured and clear rewrite of the citizen's description with specifics",
  "suggestedDepartment": "Department name from the approved list",
  "severity": "critical" | "high" | "medium" | "low",
  "severityReason": "Clear rationale for the assigned severity",
  "publicSafetyConcern": "Specific hazard to motorists, children, or pedestrians",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "missingDetailsSuggestion": "Helpful prompt for any missing information (e.g. landmark, cross street, lane direction)"
}`;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      source: 'gemini-3.8-flash',
      ...parsed,
    });
  } catch (err: any) {
    console.error('Complaint analysis error:', err);
    res.json({
      source: 'heuristic_fallback',
      category: 'repeated_excavation',
      suggestedTitle: 'Municipal Infrastructure Issue',
      suggestedDescription: req.body?.rawInput || req.body?.report?.description || '',
      suggestedDepartment: 'Highways & Road Infrastructure',
      severity: 'medium',
      severityReason: 'Fallback triage applied due to service response.',
      publicSafetyConcern: 'Potential road hazard during night hours.',
      keywords: ['infrastructure', 'roadworks'],
      missingDetailsSuggestion: 'Please confirm nearest landmark or GPS coordinates.',
      error: err.message,
    });
  }
});

// Grounded Ask InfraNexus AI Chatbot endpoint
app.post('/api/ai/ask-infranexus', async (req, res) => {
  try {
    const { question, context, conversationHistory } = req.body;
    if (!question) {
      res.status(400).json({ error: 'Missing question' });
      return;
    }

    if (!ai) {
      // Handled via local grounded fallback
      res.json({
        text: `**InfraNexus AI Grounded Coordination Response:**\n\nQuery received: "${question}".\n\nAll decisions are grounded in the municipal database records (7 active projects, active corridor clashes on GST Road, and verified citizen reports). Configure GEMINI_API_KEY for dynamic generative synthesis.`,
        isHeuristicFallback: true,
        sources: context?.projects?.slice(0, 2).map((p: any) => ({
          type: 'project',
          id: p.id,
          code: p.code,
          title: p.title,
        })),
        suggestedFollowUps: [
          'Which road projects may conflict with water pipeline work next month?',
          'Which projects may be at risk of delay?',
          'Summarize unresolved infrastructure conflicts',
        ],
      });
      return;
    }

    const systemPrompt = `You are "Ask InfraNexus AI", the official intelligent municipal coordination assistant for public infrastructure in the Greater Chennai / Kancheepuram metropolitan region.
Product Tagline: "One Network. Zero Coordination Blind Spots."
Current System Anchor Date: 2026-10-10.

CRITICAL GROUNDING RULES:
1. You MUST answer strictly using the verified evidence provided in the JSON context.
2. DO NOT invent dates, project IDs, budgets, contractors, or road coordinates.
3. If information is not in the context, explicitly state that it is not recorded in the database.
4. When discussing delays, emphasize that assessments are heuristic calculations based on progress lag, timeline expiry, and active clashes.
5. In civil engineering sequencing: deep underground utility excavation (water, drainage, electrical) MUST ALWAYS occur BEFORE road resurfacing to prevent duplicate road destruction.
6. Provide citations with Project Codes (e.g. HW-2026-089, WS-2026-114) whenever mentioning a project.
7. Keep tone professional, transparent, civic-minded, and concise.

VERIFIED MUNICIPAL DATABASE CONTEXT:
${JSON.stringify(context, null, 2)}
`;

    const chatContents: any[] = [{ text: systemPrompt }];

    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        chatContents.push({ text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}` });
      }
    }

    chatContents.push({
      text: `User Question: "${question}"\n\nRespond with a comprehensive answer, formatted in markdown with clear headings, bullet points, and source citations. Also suggest 3 helpful follow-up questions.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents,
      config: {
        temperature: 0.2,
      },
    });

    const fullResponseText = response.text || '';

    // Extract sources mentioned in response
    const sources: Array<{ type: 'project' | 'conflict' | 'report'; id: string; code: string; title: string }> = [];
    if (context?.projects) {
      for (const p of context.projects) {
        if (fullResponseText.includes(p.code)) {
          sources.push({ type: 'project', id: p.id, code: p.code, title: p.title });
        }
      }
    }

    res.json({
      text: fullResponseText,
      sources,
      suggestedFollowUps: [
        'Which road projects may conflict with water pipeline work next month?',
        'Which projects may be at risk of delay?',
        'Summarize unresolved infrastructure conflicts',
      ],
      isHeuristicFallback: false,
    });
  } catch (err: any) {
    console.error('Ask InfraNexus AI error:', err);
    res.json({
      text: `**InfraNexus AI Assistant:**\n\nProcessed query: "${req.body?.question || ''}".\n\nBased on database records, the primary active conflict is on the **GST Road corridor** between Highways (HW-2026-089) and Water Supply (WS-2026-114). Delay risk is highest on **HW-2026-031** (Kancheepuram Heritage Corridor) due to missed milestones.`,
      isHeuristicFallback: true,
      error: err.message,
    });
  }
});

// Setup Vite dev server or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CivicSync AI server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
