import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function getRequestBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    if (req.body) {
      resolve(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      return;
    }
    if (req.readableEnded || req.complete) {
      resolve(req.rawBody || '');
      return;
    }
    let data = '';
    let resolved = false;
    const finish = (result: string) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    req.setEncoding?.('utf8');
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.once('end', () => {
      finish(data);
    });
    req.once('error', () => {
      finish(data);
    });

    // Safety timeout to prevent any deadlock
    setTimeout(() => {
      finish(data);
    }, 800);

    if (typeof req.resume === 'function') {
      req.resume();
    }
  });
}

const parentFocusOtpStore = new Map<
  string,
  { code: string; parentPhone: string; expiresAt: number; attempts: number }
>();

function maskPhoneNumber(phone: string): string {
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return '****';
  return `${cleaned.slice(0, Math.min(4, cleaned.length - 4))}******${cleaned.slice(-4)}`;
}

function academicAiPlugin(): Plugin {
  return {
    name: 'academic-ai-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlPath = req.url ? req.url.split('?')[0].replace(/\/+$/, '') : '';
        if (urlPath === '/api/ai/analyze-and-answer' && req.method === 'POST') {
          try {
            const body = await getRequestBody(req);
            const { question, notes, assignments, questionBank } = JSON.parse(body || '{}');

            if (!question) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Question is required' }));
              return;
            }

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              res.statusCode = 503;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not set in environment' }));
              return;
            }

            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            });

            const notesSummary = (notes || []).map((n: any) => 
              `[Subject: ${n.subject} | Module: ${n.chapter} | Title: ${n.title}]
Summary: ${n.summary}
Key Topics: ${(n.keyTopics || []).join(', ')}
${(n.samplePagesContent || []).map((p: any) => `Page ${p.pageNumber}: ${p.title} - ${p.content}`).join('\n')}`
            ).join('\n\n');

            const assignmentsSummary = (assignments || []).map((a: any) =>
              `[Lab Assignment: ${a.title} | Course: ${a.courseCode} ${a.courseName} | Div: ${a.division} | Total Marks: ${a.totalMarks}]
Instructions: ${a.instructions}
Deliverables: ${(a.deliverables || []).join(', ')}`
            ).join('\n\n');

            const questionsSummary = (questionBank || []).map((q: any) =>
              `[Question Bank: ${q.subject} (${q.difficulty})]
Question: ${q.question}
Correct Answer: ${q.options?.[q.correctAnswer]}
Explanation: ${q.explanation}`
            ).join('\n\n');

            const fullAcademicContext = `
ACADEMIC KNOWLEDGE REPOSITORY CONTEXT:

=== LECTURE NOTES & CHAPTERS ===
${notesSummary}

=== COURSE LAB ASSIGNMENTS ===
${assignmentsSummary}

=== PRACTICE QUESTION BANK ===
${questionsSummary}
`;

            const systemInstruction = `You are StudySmart Academic AI — an elite engineering professor and teaching assistant.
Analyze the provided university lecture notes, lab assignments, and question bank to answer the student's question accurately.
Provide your response in 3 structured sections:
1. Direct Answer & Concept Analysis (explain theoretical mechanics, invariants, algorithm complexities, or formulas).
2. Relevant Material Match in StudySmart (cite exact chapters, lab assignments, or question bank items from the context).
3. Recommendations & Study Tip (offer concrete tips for lab benchmarks or university exam preparation).
Format using crisp markdown with headers, bullet points, and code/formulas where helpful.`;

            const response = await ai.models.generateContent({
              model: 'gemini-4-hydrogen',
              contents: `${fullAcademicContext}\n\nSTUDENT QUESTION:\n${question}`,
              config: {
                systemInstruction,
              },
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              answer: response.text,
              model: 'gemini-4-hydrogen',
              analyzedSources: {
                notesCount: (notes || []).length,
                assignmentsCount: (assignments || []).length,
                questionsCount: (questionBank || []).length,
              },
            }));
          } catch (err: any) {
            console.error('Error in Vite academic-ai-plugin middleware:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal AI Error' }));
          }
        } else if (urlPath === '/api/ai/voice-assistant' && req.method === 'POST') {
          try {
            const body = await getRequestBody(req);
            const { query, userName, userRole, language, contextData } = JSON.parse(body || '{}');

            if (!query) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Voice query is required' }));
              return;
            }

            const firstName = (userName || 'Student').split(' ')[0];
            const apiKey = process.env.GEMINI_API_KEY;
            const isHinglish = language === 'hinglish';

            const getLocalVoiceReply = () => {
              const q = query.toLowerCase();
              if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('kya haal') || q.includes('namaste')) {
                return isHinglish
                  ? `Hey ${firstName}! Jarvis online hai aur saare academic systems ready hain. Batao aaj kya help karoon?`
                  : `Hello ${firstName}! Jarvis is online and all your academic systems are operational. How can I help you today?`;
              }
              if (q.includes('quicksort') || q.includes('quick sort')) {
                return isHinglish
                  ? `QuickSort ek fast divide-and-conquer sorting algorithm hai jo pivot choose karke array ko partition karta hai. Iski average time complexity O of N log N hoti hai.`
                  : `QuickSort is an efficient divide-and-conquer sorting algorithm that selects a pivot element and partitions the array into sub-arrays, with an average time complexity of O of N log N.`;
              }
              if (q.includes('dijkstra')) {
                return isHinglish
                  ? `Dijkstra algorithm weighted graph me shortest path nikalta hai jab edge weights non-negative hon, aur priority queue ke saath O of V plus E log V time leta hai.`
                  : `Dijkstra algorithm finds the shortest path between nodes in a weighted graph with non-negative edge weights using a priority queue in O of V plus E log V time.`;
              }
              if (q.includes('deadline') || q.includes('assignment') || q.includes('lab')) {
                return isHinglish
                  ? `Division ${contextData?.division || 'A'} me aapke ${contextData?.pendingAssignmentsCount || 2} active lab assignments hain. Cryptography Lab ki deadline 24 hours me aa rahi hai.`
                  : `You have ${contextData?.pendingAssignmentsCount || 2} active lab assignments in Division ${contextData?.division || 'A'}. Cryptography Lab has an approaching deadline in 24 hours.`;
              }
              if (q.includes('gem') || q.includes('score')) {
                return isHinglish
                  ? `Abhi aapke paas ${contextData?.gems || 260} academic gems hain aur ${contextData?.streakDays || 6} din ki study streak chal rahi hai, ${firstName}.`
                  : `You currently hold ${contextData?.gems || 260} academic gems and a ${contextData?.streakDays || 6} day study streak, ${firstName}.`;
              }
              if (q.includes('rank') || q.includes('leaderboard') || q.includes('topper')) {
                return isHinglish
                  ? `Abhi Priya Patel Division B me 340 gems ke saath top kar rahi hain. Assignments submit karke aap bhi rank upar la sakte ho!`
                  : `Priya Patel currently leads Division B with 340 academic gems. Keep up your submissions to climb higher!`;
              }
              if (q.includes('attendance') || q.includes('qr') || q.includes('hazri')) {
                return isHinglish
                  ? `Aapka QR attendance system anti-proxy security ke saath active hai. Aap kabhi bhi scan ya project kar sakte ho.`
                  : `Your QR attendance system is active with anti-proxy division security. You can scan or project anytime.`;
              }
              return isHinglish
                ? `Maine aapki query "${query.slice(0, 35)}" check kar li hai, ${firstName}. Aapka saara study data up to date hai. Aur kya help karoon?`
                : `I analyzed your query about ${query.slice(0, 35)}, ${firstName}. All your coursework data and study materials are up to date. How else can I assist?`;
            };

              if (!apiKey) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  spokenText: getLocalVoiceReply(),
                  source: 'local-copilot'
                }));
                return;
              }

              try {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({
                  apiKey,
                  httpOptions: {
                    headers: {
                      'User-Agent': 'aistudio-build',
                    },
                  },
                });

                const langRule = isHinglish
                  ? '5. Reply strictly in natural WhatsApp-style Hinglish (casual everyday Hindi written in Roman/English letters mixed with English words, like "Haan Rahul, aapke 2 assignments pending hain"). Never use Devanagari Hindi script.'
                  : language === 'hi-IN'
                  ? '5. Reply in clear conversational Hindi.'
                  : language === 'mr-IN'
                  ? '5. Reply in clear conversational Marathi.'
                  : '5. Reply in clear English.';

                const systemInstruction = `You are Jarvis, the ultra-smart voice AI co-pilot built directly into the Study Phantom academic platform.
You are speaking directly with ${userName || 'the user'} (${userRole || 'student'}).
Active Context: ${JSON.stringify(contextData || {})}.
RULES:
1. Provide a direct, witty, crisp, spoken response (maximum 2 to 3 sentences, 30 to 50 words).
2. Do NOT use markdown, asterisks, bullet points, hashtags, or formatting symbols, because this text will be read aloud via browser Text-to-Speech.
3. Address the user naturally by their first name (${firstName}) when appropriate.
4. Keep the tone helpful, encouraging, and futuristic like Tony Stark's JARVIS.
${langRule}`;

                const response = await ai.models.generateContent({
                  model: 'gemini-4-hydrogen',
                  contents: query,
                  config: {
                    systemInstruction,
                  },
                });

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  spokenText: (response.text || getLocalVoiceReply()).replace(/[*#`_~]/g, '').trim(),
                  source: 'gemini-4-hydrogen'
                }));
              } catch (aiErr: any) {
                console.warn('Gemini voice fallback to local-copilot:', aiErr?.message || aiErr);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  spokenText: getLocalVoiceReply(),
                  source: 'local-copilot'
                }));
              }
            } catch (err: any) {
              console.error('Error in voice-assistant endpoint:', err);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                spokenText: `I encountered a momentary connection blip, but I am still online. How can I help you?`,
                source: 'fallback'
              }));
            }
          } else if (urlPath === '/api/focus/send-parent-otp' && req.method === 'POST') {
            try {
              const body = await getRequestBody(req);
              const { parentPhone, studentName, reason, lockedApps } = JSON.parse(body || '{}');

              if (!parentPhone || String(parentPhone).replace(/\D/g, '').length < 10) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Valid 10-digit parent mobile number is required' }));
                return;
              }

              const code = Math.floor(1000 + Math.random() * 9000).toString();
              const otpId = `otp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
              const cleanPhone = String(parentPhone).trim();
              parentFocusOtpStore.set(otpId, {
                code,
                parentPhone: cleanPhone,
                expiresAt: Date.now() + 5 * 60 * 1000,
                attempts: 0,
              });

              const smsMessage = `Study Phantom Alert: ${studentName || 'Your ward'} requested urgent unlock of Focus Lock (${(lockedApps || ['Social Apps']).join(', ')}). Reason: "${reason || 'Urgent work'}". Parent 4-digit OTP: ${code} (valid 5 min).`;

              const twSid = process.env.TWILIO_ACCOUNT_SID;
              const twToken = process.env.TWILIO_AUTH_TOKEN;
              const twFrom = process.env.TWILIO_FROM_NUMBER;

              if (twSid && twToken && twFrom) {
                try {
                  const params = new URLSearchParams({
                    To: cleanPhone,
                    From: twFrom,
                    Body: smsMessage,
                  });
                  const auth = Buffer.from(`${twSid}:${twToken}`).toString('base64');
                  const twRes = await fetch(
                    `https://api.twilio.com/2010-04-01/Accounts/${twSid}/Messages.json`,
                    {
                      method: 'POST',
                      headers: {
                        Authorization: `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                      },
                      body: params.toString(),
                    }
                  );
                  if (twRes.ok) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: true,
                      otpId,
                      maskedPhone: maskPhoneNumber(cleanPhone),
                      deliveryMode: 'twilio-sms',
                    }));
                    return;
                  }
                } catch (smsErr) {
                  console.warn('Twilio SMS failed, falling back to parent-sms-preview:', smsErr);
                }
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                otpId,
                maskedPhone: maskPhoneNumber(cleanPhone),
                deliveryMode: 'parent-sms-preview',
                previewOtp: code,
                previewSms: smsMessage,
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Failed to generate Parent OTP' }));
            }
          } else if (urlPath === '/api/focus/verify-parent-otp' && req.method === 'POST') {
            try {
              const body = await getRequestBody(req);
              const { otpId, code } = JSON.parse(body || '{}');
              const entry = parentFocusOtpStore.get(String(otpId || ''));

              if (!entry) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ verified: false, error: 'OTP expired or not found. Request a new 4-digit code.' }));
                return;
              }

              if (Date.now() > entry.expiresAt) {
                parentFocusOtpStore.delete(String(otpId));
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ verified: false, error: 'OTP expired (5 min limit). Please resend.' }));
                return;
              }

              entry.attempts += 1;
              if (entry.attempts > 5) {
                parentFocusOtpStore.delete(String(otpId));
                res.statusCode = 429;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ verified: false, error: 'Too many wrong attempts. Request a new OTP.' }));
                return;
              }

              if (String(code || '').trim() !== entry.code) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ verified: false, error: 'Invalid 4-digit Parent OTP. Please check the code sent to parent mobile.' }));
                return;
              }

              parentFocusOtpStore.delete(String(otpId));
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ verified: true }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ verified: false, error: err?.message || 'Verification failed' }));
            }
          } else {
            next();
          }
        });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), academicAiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
