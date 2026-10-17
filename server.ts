import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SYSTEM_PROMPT, REFINE_SYSTEM_PROMPT, generateProceduralHouse } from './src/lib/geminiPrompt.ts';
import { validateHouseSpec, autoRepairHouseSpec } from './src/lib/houseValidator.ts';
import { SAMPLE_HOUSES } from './src/lib/sampleHouses.ts';
import { HouseSpec, ProjectItem } from './src/types/house.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory project storage with initial sample projects
let userProjects: ProjectItem[] = SAMPLE_HOUSES.map((h, i) => ({
  id: h.id,
  title: h.title,
  description: h.designSummary,
  prompt: h.tags.join(', ') + ' style home',
  style: h.style,
  createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
  spec: h,
  isPublic: true,
}));

// Setup Google Gen AI instance if key is present
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to strip markdown json markers
function cleanJsonOutput(text: string): string {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return clean.trim();
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey && apiKey.length > 5 && apiKey !== 'MY_GEMINI_API_KEY'),
    model: 'gemini-3.8-flash',
  });
});

// 2. Generate home from natural language description
app.post('/api/generate-home', async (req, res) => {
  const { prompt, guidedOptions } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'A valid text prompt is required.' });
    return;
  }

  // If Gemini API is available, invoke Gemini 3.8 Flash
  if (ai && apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      let promptContent = `USER REQUEST: "${prompt}"\n`;
      if (guidedOptions) {
        promptContent += `\nGUIDED PREFERENCES:
- Architectural Style: ${guidedOptions.style || 'Modern'}
- Floors: ${guidedOptions.floorCount || 2}
- Target Bedrooms: ${guidedOptions.bedrooms || 3}
- Target Bathrooms: ${guidedOptions.bathrooms || 2}
- Plot Dimensions: ${guidedOptions.plotWidth || 24}m width x ${guidedOptions.plotDepth || 30}m depth
- Climate: ${guidedOptions.climate || 'Temperate'}
- Roof Type: ${guidedOptions.roofPreference || 'flat'}
- Has Swimming Pool: ${guidedOptions.hasPool ? 'Yes' : 'No'}
- Has Garage: ${guidedOptions.hasGarage ? 'Yes' : 'No'}
- Preferred Materials: ${guidedOptions.materialsPreference || 'Natural Wood, Concrete, Glass'}
`;
      }

      promptContent += `\nGenerate the complete architectural HouseSpec in strict JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContent,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '';
      const parsedSpec: HouseSpec = JSON.parse(cleanJsonOutput(responseText));

      // Validate specification
      let validation = validateHouseSpec(parsedSpec);

      // If invalid, perform repair
      let finalSpec = parsedSpec;
      if (!validation.valid) {
        // Attempt automatic rule-based repair first
        finalSpec = autoRepairHouseSpec(parsedSpec);
        validation = validateHouseSpec(finalSpec);

        // If still has critical errors, attempt one repair prompt with Gemini
        if (!validation.valid) {
          const repairPrompt = `The previous JSON had the following structural errors:\n${validation.issues
            .map((i) => i.message)
            .join('\n')}\n\nPlease output the repaired HouseSpec JSON strictly fixing these errors.`;

          const repairResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: repairPrompt,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });
          const repaired = JSON.parse(cleanJsonOutput(repairResponse.text || ''));
          finalSpec = autoRepairHouseSpec(repaired);
          validation = validateHouseSpec(finalSpec);
        }
      } else {
        finalSpec = autoRepairHouseSpec(parsedSpec);
      }

      res.json({
        success: true,
        source: 'gemini-3.8-flash',
        spec: finalSpec,
        validation,
      });
      return;
    } catch (err: any) {
      console.warn('Gemini generation error, falling back to procedural synthesizer:', err?.message || err);
      // Fallback seamlessly to intelligent procedural generator
    }
  }

  // Procedural generation fallback
  const fallbackSpec = autoRepairHouseSpec(generateProceduralHouse(prompt, guidedOptions));
  const validation = validateHouseSpec(fallbackSpec);
  res.json({
    success: true,
    source: 'procedural-synthesizer',
    spec: fallbackSpec,
    validation,
  });
});

// 3. Iterative refinement
app.post('/api/refine-home', async (req, res) => {
  const { currentSpec, instruction } = req.body;

  if (!currentSpec || !instruction) {
    res.status(400).json({ error: 'currentSpec and instruction are required.' });
    return;
  }

  if (ai && apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `CURRENT SPECIFICATION:\n${JSON.stringify(currentSpec)}\n\nUSER MODIFICATION REQUEST:\n"${instruction}"\n\nReturn the updated HouseSpec JSON with only the requested changes incorporated.`,
        config: {
          systemInstruction: REFINE_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const updatedSpec: HouseSpec = JSON.parse(cleanJsonOutput(response.text || ''));
      const repaired = autoRepairHouseSpec(updatedSpec);
      const validation = validateHouseSpec(repaired);

      res.json({
        success: true,
        source: 'gemini-3.8-flash',
        spec: repaired,
        validation,
      });
      return;
    } catch (err: any) {
      console.warn('Gemini refine error, applying procedural refinement:', err?.message || err);
    }
  }

  // Procedural refinement fallback
  const cloned: HouseSpec = JSON.parse(JSON.stringify(currentSpec));
  const lower = instruction.toLowerCase();

  if (lower.includes('sloped') || lower.includes('pitched') || lower.includes('gable')) {
    cloned.roof.type = 'sloped_gable';
    cloned.roof.pitch = 28;
    cloned.designSummary += ' Sloped gable roof added.';
  } else if (lower.includes('flat')) {
    cloned.roof.type = 'flat';
    cloned.roof.pitch = 0;
  }

  if (lower.includes('pool')) {
    cloned.exterior.hasPool = true;
    cloned.exterior.poolDimensions = { x: 0, z: 8, width: 8.5, depth: 4 };
  }

  if (lower.includes('balcony')) {
    cloned.exterior.hasBalcony = true;
  }

  if (lower.includes('wood') || lower.includes('cedar')) {
    cloned.materials.facadePrimary.color = '#c59b6d';
    cloned.materials.facadePrimary.name = 'Japanese Cedar';
  } else if (lower.includes('concrete')) {
    cloned.materials.facadeSecondary.color = '#ced4da';
    cloned.materials.facadeSecondary.name = 'Raw Architectural Concrete';
  }

  const repaired = autoRepairHouseSpec(cloned);
  res.json({
    success: true,
    source: 'procedural-synthesizer',
    spec: repaired,
    validation: validateHouseSpec(repaired),
  });
});

// 4. Projects CRUD
app.get('/api/projects', (req, res) => {
  res.json({ projects: userProjects });
});

app.post('/api/projects', (req, res) => {
  const item: ProjectItem = req.body;
  if (!item || !item.spec) {
    res.status(400).json({ error: 'Valid project item is required.' });
    return;
  }

  const index = userProjects.findIndex((p) => p.id === item.id);
  if (index >= 0) {
    userProjects[index] = { ...item, updatedAt: new Date().toISOString() };
  } else {
    userProjects.unshift({
      ...item,
      id: item.id || 'proj-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  res.json({ success: true, project: item });
});

app.delete('/api/projects/:id', (req, res) => {
  const id = req.params.id;
  userProjects = userProjects.filter((p) => p.id !== id);
  res.json({ success: true, id });
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DreamHome AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
