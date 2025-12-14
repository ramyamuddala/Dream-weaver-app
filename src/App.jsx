import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  Stars, 
  Feather, 
  Eye, 
  Sparkles, 
  Palette,
  BrainCircuit, // New icon for psychology
  HeartHandshake, // New icon for encouragement
  SlidersHorizontal,
  User
} from 'lucide-react';

// --- API HANDLING ---

const analyzeDream = async (dreamInput, userContext) => {
    const prompt = `
      Act as a wise, deeply intuitive dream guide.
      Analyze this user's dream: "${dreamInput}".
      
      CONTEXT PROVIDED BY USER:
      - Dreamer Identity: ${userContext?.gender || "Not specified"}
      - Specific Details: ${userContext?.details || "None"}

      1. VISUAL TASK: Act as an expert Prompt Engineer for Stable Diffusion. 
      Create a 'visual_prompt' that describes the visual scene of the dream strictly and factually for image generation.
      - Remove narrative phrasing like "I saw". Focus on objects, lighting, colors.
      - IMPORTANT: Ensure the visual prompt reflects the user's identity and specific details provided above.
      
      2. ANALYTICAL TASK: Provide a structured, connecting response exactly like the following format.
      The goal is to explain *why* the dream happened and connect it to the user's personality and recent emotions.
      
      Structure the response into these 5 specific sections:
      1. "Dreams Often Reflect Your Current Emotional State": Connect the general theme to real emotions (e.g., nurturing, anxiety).
      2. "[Main Symbol Name] = [Short Meaning]": Explain the main object/person factually.
      3. "[Main Action/Feeling] = [Short Meaning]": Explain the main action factually.
      4. "Why this scene appeared last night": Give potential triggers (long day, stress, memory sorting).
      5. "What the dream actually indicates about you": List personality traits (empathetic, responsible, etc.).

      3. SUGGESTION TASK: Provide a "suggestion" field.
      - A beautiful, encouraging, and actionable message for the user based on this dream.

      Use "You" and "Your". Be warm and factual. Use bullet points for lists.

      Return a strictly valid JSON object (no markdown) with the following structure:
      {
        "visual_prompt": "The optimized image generation prompt.",
        "title": "A concise, poetic title",
        "emotional_tone": "The dominant emotion.",
        "suggestion": "A beautiful, encouraging message for the user.",
        "analysis_sections": [
          { "title": "✅ 1. Dreams Often Reflect Your Current Emotional State", "content": "Explanation..." },
          { "title": "✅ 2. [Symbol Name] = [Meaning]", "content": "Explanation..." },
          { "title": "✅ 3. [Action Name] = [Meaning]", "content": "Explanation..." },
          { "title": "✅ 4. Why this scene appeared last night", "content": "Explanation..." },
          { "title": "🧠 5. What the dream actually indicates about you", "content": "Explanation..." }
        ]
      }
    `;

  try {
    console.log("Step 2: Calling Secure Analysis Function...");
    const response = await fetch('/.netlify/functions/analyze-dream', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    // Clean up potential markdown formatting from Gemini before parsing
    const textResult = rawText.replace(/```json|```/g, '').trim();
    console.log("Step 3: Gemini API call successful. Received analysis.");
    return JSON.parse(textResult);
  } catch (error) {
    console.error("Text Gen Error:", error);
    throw new Error(error.message || "The mists of the subconscious are too thick right now.");
  }
};

const paintDream = async (optimizedPrompt) => {
  const finalPrompt = `
    ${optimizedPrompt}, 
    highly detailed, digital art masterpiece, 8k resolution, cinematic lighting, profound atmosphere.
  `;

  console.log("Painting with optimized prompt:", finalPrompt);

  try {
    const response = await fetch('/.netlify/functions/paint-dream', {
      method: 'POST',
      body: JSON.stringify({ prompt: finalPrompt }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Stability AI Error: ${response.status}`);
    }

    console.log("Step 5: Stability AI call successful. Received image data.");
    const image = data.artifacts[0];
    return `data:image/png;base64,${image.base64}`;
  } catch (error) {
    console.error("Image Gen Error:", error);
    // Re-throw the error to be caught by handleWeave
    throw new Error(error.message || "The dream could not be painted.");
  }
};

const fetchKeywordImages = async (dreamInput) => {
  const keywords = dreamInput
    .toLowerCase()
    .replace(/[.,]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter((value, index, self) => self.indexOf(value) === index) // Unique
    .slice(0, 5); // Get up to 5 keywords

  if (keywords.length === 0) return [];

  try {
    const response = await fetch('/.netlify/functions/get-stock-images', {
      method: 'POST',
      body: JSON.stringify({ keywords })
    });

    const data = await response.json();
    const filteredUrls = data.images || [];

    // Return URL with a style calculated to ensure even distribution
    return filteredUrls.map((url, index) => ({ 
        url, 
        style: generateRandomStyle(index, filteredUrls.length) 
    }));
  } catch (error) {
    console.error("Pexels Error:", error);
    return []; // Fail gracefully
  }
};

// --- COMPONENTS ---

// Helper to generate distributed, non-overlapping random styles
const generateRandomStyle = (index, total) => {
  // 1. Divide the circle into segments for each image
  const anglePerSegment = 360 / total;
  // 2. Calculate the base angle for this image's segment
  const baseAngle = index * anglePerSegment;
  // 3. Add a small random offset so they don't look too uniform
  // Use a smaller variance factor (especially for low counts) to prevent clumping
  const variance = total <= 3 ? 0.2 : 0.4;
  const randomOffset = (Math.random() - 0.5) * (anglePerSegment * variance);
  const rotation = baseAngle + randomOffset;

  const translateX = 100 + Math.random() * 40; // Vary distance from center
  const animationDuration = 4 + Math.random() * 4; // Duration between 4s and 8s
  const animationDelay = Math.random() * 0.5; // Staggered start
  return { rotation, translateX, animationDuration, animationDelay };
};

const StepIndicator = ({ currentStep, steps }) => (
  <div className="flex justify-center items-center gap-4 mb-8">
    {steps.map((step, index) => {
      const isActive = index === currentStep;
      const isCompleted = index < currentStep;
      
      return (
        <div key={index} className="flex items-center gap-2">
           <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border border-white/10
              ${isActive ? 'bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-110' : 
                isCompleted ? 'bg-indigo-500/20 text-indigo-300' : 
                'bg-transparent text-slate-600'}`}
          >
            {step.icon}
          </div>
          {index < steps.length - 1 && (
            <div className={`h-px w-4 md:w-8 transition-colors duration-500 ${isCompleted ? 'bg-indigo-500/50' : 'bg-slate-800'}`}></div>
          )}
        </div>
      );
    })}
  </div>
);

const DreamCard = ({ title, icon: Icon, children, className = "" }) => (
  <div className={`bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-500 shadow-xl ${className}`}>
    <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-300">
        <Icon size={18} />
      </div>
      <h3 className="text-lg font-serif italic text-purple-100 tracking-wide">{title}</h3>
    </div>
    <div className="text-slate-300 font-light leading-relaxed">
      {children}
    </div>
  </div>
);

const AnimatedDreamEye = ({ className }) => (
  <svg
    className={`${className} animate-dream-blink`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Main eye shape */}
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    {/* Pupil that moves */}
    <circle cx="12" cy="12" r="3" className="dream-eye-pupil" fill="currentColor" />
    {/* Eyelid that animates */}
    <path
      className="dream-eye-lid"
      d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
      style={{
        stroke: 'none',
        fill: 'var(--background-color, #050609)'
      }}
    />
  </svg>
);

const App = () => {
  const [dream, setDream] = useState("");
  const [userContext, setUserContext] = useState({ gender: '', details: '' });
  const [status, setStatus] = useState("idle"); 
  const [data, setData] = useState(null);
  // NEW: Separate state for loading messages
  const [loadingMessage, setLoadingMessage] = useState("Consulting the Oracle...");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [resultView, setResultView] = useState('visual'); // 'visual' or 'analysis'
  const [keywordImages, setKeywordImages] = useState([]);

  const steps = [
    { label: "Sleep", icon: <Moon size={14} /> },
    { label: "Interpret", icon: <Eye size={14} /> },
    { label: "Visualize", icon: <Palette size={14} /> },
    { label: "Awaken", icon: <Sparkles size={14} /> },
  ];

  const getStepIndex = () => {
    switch(status) {
      case 'idle': return 0;
      case 'refining': return 0;
      case 'gathering': return 1; // NEW status
      case 'analyzing': return 1;
      case 'painting': return 2;
      case 'complete': return 3;
      default: return 0;
    }
  };

  const handleWeave = async () => {
    if (!dream.trim()) return;
    
    setError(null);
    setData(null);
    setGeneratedImage(null);
    setKeywordImages([]);

    console.log("Step 1: Starting the dream weaving process...");
    try {
      // Step 1: Gather keyword images first to show them
      setStatus("gathering");
      setLoadingMessage("Gathering dream fragments...");
      const keywordImageData = await fetchKeywordImages(dream);
      setKeywordImages(keywordImageData);
      
      // Step 2: Analyze the dream text
      setStatus("analyzing");
      setLoadingMessage("Consulting the Oracle...");
      const analysisData = await analyzeDream(dream, userContext);
      setData(analysisData);
      
      // Step 3: Paint the dream image
      setStatus("painting");
      setLoadingMessage("Manifesting the Vision...");
      console.log("Step 4: Calling Stability AI to paint the dream...");
      const imageUrl = await paintDream(analysisData.visual_prompt);
      setGeneratedImage(imageUrl);
      
      setResultView('visual'); // Default to showing the visual first
      setStatus("complete");
      console.log("Step 6: Dream weaving complete!"); // This is now correct
    } catch (err) {
      console.error("--- ERROR during dream weaving process ---");
      console.error(err.message);
      console.error("-----------------------------------------");
      setError(err.message || "The dream slipped away... Please try again.");
      setStatus("idle");
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      // Suggest a filename for the download
      link.download = `dreamscape-weaver-${data?.title?.replace(/\s+/g, '-').toLowerCase() || 'image'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- RENDER FUNCTIONS ---

  const renderInput = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-1000">
      <div className="mb-4 relative">
        <div className="absolute -inset-4 bg-gradient-to-t from-purple-600 to-indigo-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
        <AnimatedDreamEye className="w-20 h-20 text-purple-200 relative z-10" style={{ '--background-color': '#050609' }}/>
      </div>
      
      <h1 className="text-4xl md:text-7xl font-serif text-gradient-purple mb-6 tracking-tight">
        Dreamscape Weaver
      </h1>
      
      <p className="text-lg text-purple-200/60 max-w-xl mb-12 font-light">
        Whisper your midnight wanderings to the machine. We will unravel the symbolism and paint the subconscious.
      </p>

      <div className="w-full max-w-2xl relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <textarea
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          placeholder="Last night, I was walking through a forest of mirrors..."
          className="relative w-full bg-[#0F111A] border border-white/10 text-purple-100 rounded-2xl p-4 md:p-6 pr-32 h-40 focus:outline-none focus:border-purple-500/50 resize-none shadow-2xl text-lg font-light placeholder:text-slate-600 transition-all z-10"
        />
        <button
          onClick={() => setStatus('refining')}
          disabled={!dream.trim()}
          className="absolute bottom-4 right-4 z-20 bg-purple-600/20 hover:bg-purple-600 hover:text-white border border-purple-500/30 text-purple-300 px-6 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 backdrop-blur-md"
        >
          Decode <Stars size={16} />
        </button>
      </div>
    </div>
  );

  const renderRefinement = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500">
      <div className="mb-6 p-4 bg-purple-500/10 rounded-full text-purple-300">
        <SlidersHorizontal size={32} />
      </div>
      
      <h2 className="text-3xl md:text-5xl font-serif text-gradient-purple mb-6">
        Refine the Vision
      </h2>
      
      <p className="text-lg text-purple-200/60 max-w-xl mb-8 font-light">
        Help the weaver see what you see. Add details about yourself and the dream's subjects.
      </p>

      <div className="w-full max-w-xl space-y-6 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-xl">
        
        {/* Gender/Identity Selection */}
        <div className="text-left space-y-3">
          <label className="text-purple-200 text-sm font-medium ml-1 flex items-center gap-2"><User size={14}/> I am...</label>
          <div className="grid grid-cols-3 gap-3">
            {['Male', 'Female', 'Non-binary'].map((g) => (
              <button
                key={g}
                onClick={() => setUserContext(prev => ({ ...prev, gender: g }))}
                className={`py-2 px-4 rounded-xl border transition-all duration-300 text-sm ${
                  userContext.gender === g 
                    ? 'bg-purple-600 text-white border-purple-500' 
                    : 'bg-slate-800/50 text-slate-400 border-white/5 hover:border-purple-500/30'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Details */}
        <div className="text-left space-y-3">
          <label className="text-purple-200 text-sm font-medium ml-1">Specific Details (Optional)</label>
          <textarea
            value={userContext.details}
            onChange={(e) => setUserContext(prev => ({ ...prev, details: e.target.value }))}
            placeholder="e.g., My best friend has red hair, the road was made of gold..."
            className="w-full bg-[#0F111A] border border-white/10 text-purple-100 rounded-xl p-4 focus:outline-none focus:border-purple-500/50 resize-none h-32 text-sm font-light placeholder:text-slate-600"
          />
        </div>

        <div className="flex gap-4 pt-4">
           <button
            onClick={() => setStatus('idle')}
            className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all"
          >
            Back
          </button>
          <button
            onClick={handleWeave}
            className="flex-[2] bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-medium shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
          >
            Weave Dream <Stars size={16} />
          </button>
        </div>

      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative w-64 h-64 mb-12 flex items-center justify-center text-purple-300">
        {/* Keyword Image Animations - UPDATED */}
        {keywordImages.map(({ url, style }, index) => (
          <div
            key={index}
            className="absolute top-0 left-0 w-full h-full"
            style={{
              transform: `rotate(${style.rotation}deg) translateX(${style.translateX}px)`
            }}
          >
            <div className="w-24 h-24" style={{ transform: `rotate(-${style.rotation}deg)` }}>
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover rounded-lg shadow-2xl shadow-purple-900/50"
                style={{
                  animation: `float-image ${style.animationDuration}s ease-in-out ${style.animationDelay}s infinite`,
                }}
              />
            </div>
          </div>
        ))}
        {/* Intricate SVG Animation */}
        <svg viewBox="0 0 200 200" className="absolute w-full h-full opacity-40 animate-in fade-in duration-1000">
          {/* Outer Ring with text */}
          <path id="circlePath" fill="none" stroke="none" d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" />
          <text>
            <textPath href="#circlePath" className="fill-purple-500/40 text-[8px] tracking-[0.2em] uppercase">
              Weaving the threads of consciousness • Weaving the threads of consciousness •
            </textPath>
          </text>
          {/* Rotating gradient rings */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="url(#grad1)" strokeWidth="0.5" className="animate-[spin_20s_linear_infinite_reverse]" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="url(#grad2)" strokeWidth="0.5" className="animate-[spin_15s_linear_infinite]" />
          <defs>
            <linearGradient id="grad1"><stop offset="0%" stopColor="rgba(168, 85, 247, 0)" /><stop offset="100%" stopColor="rgba(168, 85, 247, 0.5)" /></linearGradient>
            <linearGradient id="grad2"><stop offset="0%" stopColor="rgba(99, 102, 241, 0)" /><stop offset="100%" stopColor="rgba(99, 102, 241, 0.5)" /></linearGradient>
          </defs>
        </svg>
        <div className="animate-cosmic-pulse">
          {['gathering', 'analyzing'].includes(status) && <Eye size={48} strokeWidth={1} />}
          {status === 'painting' && <Palette size={48} strokeWidth={1} />}
        </div>
      </div>
      <h2 className="text-3xl font-serif text-purple-200 mb-3 tracking-wide animate-in fade-in duration-500">
        {loadingMessage}
      </h2>
    </div>
  );

  const renderResult = () => (
    <div className="w-full max-w-6xl mx-auto px-4 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-block p-2 px-4 rounded-full bg-purple-900/30 border border-purple-500/20 text-purple-300 text-xs tracking-[0.2em] uppercase mb-4">
          Dream Analysis
        </div>
        <h1 className="text-3xl md:text-6xl font-serif text-white mb-4">{data.title}</h1>
        <p className="text-purple-200/60 text-lg max-w-2xl mx-auto italic font-light">Emotional Tone: {data.emotional_tone}</p>
      </div>
      
      {/* View Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-900/40 border border-white/10 rounded-full p-1 flex gap-1 backdrop-blur-sm">
          <button 
            onClick={() => setResultView('visual')}
            className={`px-4 py-2 text-sm rounded-full transition-all flex items-center gap-2 ${resultView === 'visual' ? 'bg-purple-600/30 text-purple-200' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Palette size={16} />
            Visual
          </button>
          <button 
            onClick={() => setResultView('analysis')}
            className={`px-4 py-2 text-sm rounded-full transition-all flex items-center gap-2 ${resultView === 'analysis' ? 'bg-purple-600/30 text-purple-200' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <BrainCircuit size={16} />
            Analysis
          </button>
        </div>
      </div>

      {/* Conditional Content */}
      {resultView === 'visual' && renderResultVisual()}
      {resultView === 'analysis' && renderResultAnalysis()}

      <button 
        onClick={() => { setStatus('idle'); setDream(''); setUserContext({ gender: '', details: '' }); }}
        className="w-full max-w-md mx-auto mt-12 py-4 rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 group"
      >
        <Sparkles size={16} className="group-hover:rotate-12 transition-transform"/> 
        Interpret Another Dream
      </button>
    </div>
  );

  const renderResultVisual = () => (
    <div className="animate-in fade-in duration-500">
      <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] border border-white/10 group max-w-3xl mx-auto">
          {generatedImage ? (
          <img 
            src={generatedImage} 
            alt="Dream Visual" 
            className="w-full h-auto object-cover aspect-[1/1] transition-transform duration-[2s] group-hover:scale-105"
          />
        ) : (
          <div className="w-full aspect-[1/1] bg-slate-900 flex flex-col items-center justify-center text-slate-600 p-8">
            <Palette size={48} className="opacity-20"/>
            <p className="mt-4 text-sm text-slate-500 px-10 text-center">
              (Image generation requires a valid Stability AI key in your .env file)
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent opacity-60 flex items-end justify-center pb-6">
          {generatedImage && (
            <button
              onClick={handleDownload}
              className="bg-purple-600/30 hover:bg-purple-600 border border-purple-500/30 text-purple-200 px-6 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 backdrop-blur-md z-20"
            >
              Download Image
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderResultAnalysis = () => (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {data.analysis_sections.map((section, idx) => (
        <div key={idx} className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 md:p-6 hover:border-purple-500/30 transition-all duration-500 shadow-xl">
          <h3 className="text-lg md:text-xl font-serif text-purple-200 mb-4 font-semibold border-b border-white/5 pb-3">
            {section.title}
          </h3>
          <div className="text-slate-300 font-light leading-relaxed whitespace-pre-wrap">
            {section.content}
          </div>
        </div>
      ))}

      {/* Suggestion Card */}
      {data.suggestion && (
        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-16 bg-purple-500/10 blur-3xl rounded-full -mr-8 -mt-8"></div>
           <div className="flex items-center gap-3 mb-3 text-purple-300 relative z-10">
              <HeartHandshake size={24} />
              <h3 className="font-serif italic text-xl">A Message for You</h3>
           </div>
           <p className="text-purple-100/90 font-light italic leading-relaxed relative z-10 text-lg">
             "{data.suggestion}"
           </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050609] text-slate-200 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* Deep Space Background */}
      {status === 'idle' && (
        <video
          autoPlay
          loop
          muted
          className="fixed inset-0 w-full h-full object-cover z-0 opacity-30"
          src="/dream.mp4"
        />
      )}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-900/10 rounded-full blur-[150px] animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-950/20 rounded-full blur-[150px]"></div>
        <div className="absolute top-[40%] left-[30%] w-[20%] h-[20%] bg-pink-900/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10">
        {/* Minimal Nav */}
        <nav className="p-6 flex items-center justify-center relative">
          {status !== 'idle' && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
               <StepIndicator currentStep={getStepIndex()} steps={steps} />
            </div>
          )}
        </nav>

        {/* Content */}
        <main className="py-8">
          {error && (
            <div className="max-w-xl mx-auto mb-8 bg-red-900/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-center font-light backdrop-blur-md">
              {error}
            </div>
          )}

          {status === 'idle' && renderInput()}
          {status === 'refining' && renderRefinement()}
          {['analyzing', 'painting'].includes(status) && renderLoading()}
          {status === 'complete' && data && renderResult()}
        </main>
      </div>
    </div>
  );
};

export default App;


// import React, { useState, useEffect } from 'react';
// import { 
//   Moon, 
//   Stars, 
//   Feather, 
//   Eye, 
//   Sparkles, 
//   Palette,
//   BrainCircuit, // New icon for psychology
//   HeartHandshake // New icon for encouragement
// } from 'lucide-react';

// // --- API HANDLING ---

// const analyzeDream = async (dreamInput) => {
//   const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

//     const prompt = `
//       Act as a wise, deeply intuitive dream guide.
//       Analyze this user's dream: "${dreamInput}".
      
//       1. VISUAL TASK: Act as an expert Prompt Engineer for Stable Diffusion. 
//       Create a 'visual_prompt' that describes the visual scene of the dream strictly and factually for image generation.
//       - Remove narrative phrasing like "I saw". Focus on objects, lighting, colors.
      
//       2. ANALYTICAL TASK: Provide a structured, connecting response exactly like the following format.
//       The goal is to explain *why* the dream happened and connect it to the user's personality and recent emotions.
      
//       Structure the response into these 5 specific sections:
//       1. "Dreams Often Reflect Your Current Emotional State": Connect the general theme to real emotions (e.g., nurturing, anxiety).
//       2. "[Main Symbol Name] = [Short Meaning]": Explain the main object/person factually.
//       3. "[Main Action/Feeling] = [Short Meaning]": Explain the main action factually.
//       4. "Why this scene appeared last night": Give potential triggers (long day, stress, memory sorting).
//       5. "What the dream actually indicates about you": List personality traits (empathetic, responsible, etc.).

//       3. SUGGESTION TASK: Provide a "suggestion" field.
//       - A beautiful, encouraging, and actionable message for the user based on this dream.

//       Use "You" and "Your". Be warm and factual. Use bullet points for lists.

//       Return a strictly valid JSON object (no markdown) with the following structure:
//       {
//         "visual_prompt": "The optimized image generation prompt.",
//         "title": "A concise, poetic title",
//         "emotional_tone": "The dominant emotion.",
//         "suggestion": "A beautiful, encouraging message for the user.",
//         "analysis_sections": [
//           { "title": "✅ 1. Dreams Often Reflect Your Current Emotional State", "content": "Explanation..." },
//           { "title": "✅ 2. [Symbol Name] = [Meaning]", "content": "Explanation..." },
//           { "title": "✅ 3. [Action Name] = [Meaning]", "content": "Explanation..." },
//           { "title": "✅ 4. Why this scene appeared last night", "content": "Explanation..." },
//           { "title": "🧠 5. What the dream actually indicates about you", "content": "Explanation..." }
//         ]
//       }
//     `;

//   try {
//     console.log("Step 2: Calling Gemini API with model gemini-2.5-pro-latest...");
//     const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
//         headers: { 'Content-Type': 'application/json' },
//         method: 'POST', // FIX: Added the required POST method
//         body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }],
//         generationConfig: {
//           responseMimeType: "application/json" 
//         }
//       })
//     });

//     if (!response.ok) {
//        const errorText = await response.text();
//        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
//     }

//     const data = await response.json();
//     const textResult = data.candidates[0].content.parts[0].text;
//     console.log("Step 3: Gemini API call successful. Received analysis.");
//     return JSON.parse(textResult);
//   } catch (error) {
//     console.error("Text Gen Error:", error);
//     throw new Error(error.message || "The mists of the subconscious are too thick right now.");
//   }
// };

// const paintDream = async (optimizedPrompt) => {
//   const apiKey = import.meta.env.VITE_STABILITY_API_KEY; 
  
//   const engineId = 'stable-diffusion-xl-1024-v1-0';
//   const apiHost = 'https://api.stability.ai';
//   const endpoint = `${apiHost}/v1/generation/${engineId}/text-to-image`;

//   // We use the optimizedPrompt from Gemini directly.
//   const finalPrompt = `
//     ${optimizedPrompt}, 
//     highly detailed, digital art masterpiece, 8k resolution, cinematic lighting, profound atmosphere.
//   `;

//   console.log("Painting with optimized prompt:", finalPrompt);

//   if (!apiKey || apiKey === "") {
//     console.error("Stability AI Key is missing from .env file.");
//     console.warn("Stability API Key missing. Returning placeholder.");
//     return null; // Triggers UI placeholder
//   }

//   try {
//     const response = await fetch(endpoint, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//         'Authorization': `Bearer ${apiKey}`,
//       },
//       body: JSON.stringify({
//         text_prompts: [{ text: finalPrompt }],
//         cfg_scale: 7,
//         height: 1024,
//         width: 1024,
//         steps: 30,
//         samples: 1,
//       }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       // Stability AI often puts the error message in a "message" or "name" field.
//       throw new Error(data.message || data.name || `Stability AI Error: ${response.status}`);
//     }

//     console.log("Step 5: Stability AI call successful. Received image data.");
//     const image = data.artifacts[0];
//     return `data:image/png;base64,${image.base64}`;
//   } catch (error) {
//     console.error("Image Gen Error:", error);
//     // Re-throw the error to be caught by handleWeave
//     throw new Error(error.message || "The dream could not be painted.");
//   }
// };

// const fetchKeywordImages = async (dreamInput) => {
//   const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
//   if (!apiKey) {
//     console.warn("Pexels API Key is missing. Skipping keyword images.");
//     return [];
//   }

//   const keywords = dreamInput
//     .toLowerCase()
//     .replace(/[.,]/g, '')
//     .split(/\s+/)
//     .filter(word => word.length > 3)
//     .filter((value, index, self) => self.indexOf(value) === index) // Unique
//     .slice(0, 5); // Get up to 5 keywords

//   if (keywords.length === 0) return [];

//   try {
//     const imagePromises = keywords.map(keyword =>
//       fetch(`https://api.pexels.com/v1/search?query=${keyword}&per_page=1`, {
//         headers: { 'Authorization': apiKey }
//       }).then(res => res.json())
//     );

//     const results = await Promise.all(imagePromises);
//     const filteredUrls = results.map(result => result?.photos[0]?.src?.medium).filter(Boolean);

//     // Return URL with a style calculated to ensure even distribution
//     return filteredUrls.map((url, index) => ({ 
//         url, 
//         style: generateRandomStyle(index, filteredUrls.length) 
//     }));
//   } catch (error) {
//     console.error("Pexels Error:", error);
//     return []; // Fail gracefully
//   }
// };

// // --- COMPONENTS ---

// // Helper to generate distributed, non-overlapping random styles
// const generateRandomStyle = (index, total) => {
//   // 1. Divide the circle into segments for each image
//   const anglePerSegment = 360 / total;
//   // 2. Calculate the base angle for this image's segment
//   const baseAngle = index * anglePerSegment;
//   // 3. Add a small random offset so they don't look too uniform
//   const randomOffset = (Math.random() - 0.5) * (anglePerSegment * 0.7);
//   const rotation = baseAngle + randomOffset;

//   const translateX = 100 + Math.random() * 40; // Vary distance from center
//   const animationDuration = 4 + Math.random() * 4; // Duration between 4s and 8s
//   const animationDelay = Math.random() * 0.5; // Staggered start
//   return { rotation, translateX, animationDuration, animationDelay };
// };

// const StepIndicator = ({ currentStep, steps }) => (
//   <div className="flex justify-center items-center gap-4 mb-8">
//     {steps.map((step, index) => {
//       const isActive = index === currentStep;
//       const isCompleted = index < currentStep;
      
//       return (
//         <div key={index} className="flex items-center gap-2">
//            <div 
//             className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border border-white/10
//               ${isActive ? 'bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-110' : 
//                 isCompleted ? 'bg-indigo-500/20 text-indigo-300' : 
//                 'bg-transparent text-slate-600'}`}
//           >
//             {step.icon}
//           </div>
//           {index < steps.length - 1 && (
//             <div className={`h-px w-4 md:w-8 transition-colors duration-500 ${isCompleted ? 'bg-indigo-500/50' : 'bg-slate-800'}`}></div>
//           )}
//         </div>
//       );
//     })}
//   </div>
// );

// const DreamCard = ({ title, icon: Icon, children, className = "" }) => (
//   <div className={`bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-500 shadow-xl ${className}`}>
//     <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
//       <div className="p-2 bg-purple-500/10 rounded-lg text-purple-300">
//         <Icon size={18} />
//       </div>
//       <h3 className="text-lg font-serif italic text-purple-100 tracking-wide">{title}</h3>
//     </div>
//     <div className="text-slate-300 font-light leading-relaxed">
//       {children}
//     </div>
//   </div>
// );

// const AnimatedDreamEye = ({ className }) => (
//   <svg
//     className={`${className} animate-dream-blink`}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="1"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     {/* Main eye shape */}
//     <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
//     {/* Pupil that moves */}
//     <circle cx="12" cy="12" r="3" className="dream-eye-pupil" fill="currentColor" />
//     {/* Eyelid that animates */}
//     <path
//       className="dream-eye-lid"
//       d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
//       style={{
//         stroke: 'none',
//         fill: 'var(--background-color, #050609)'
//       }}
//     />
//   </svg>
// );

// const App = () => {
//   const [dream, setDream] = useState("");
//   const [status, setStatus] = useState("idle"); 
//   const [data, setData] = useState(null);
//   // NEW: Separate state for loading messages
//   const [loadingMessage, setLoadingMessage] = useState("Consulting the Oracle...");
//   const [generatedImage, setGeneratedImage] = useState(null);
//   const [error, setError] = useState(null);
//   const [resultView, setResultView] = useState('visual'); // 'visual' or 'analysis'
//   const [keywordImages, setKeywordImages] = useState([]);

//   const steps = [
//     { label: "Sleep", icon: <Moon size={14} /> },
//     { label: "Interpret", icon: <Eye size={14} /> },
//     { label: "Visualize", icon: <Palette size={14} /> },
//     { label: "Awaken", icon: <Sparkles size={14} /> },
//   ];

//   const getStepIndex = () => {
//     switch(status) {
//       case 'idle': return 0;
//       case 'gathering': return 1; // NEW status
//       case 'analyzing': return 1;
//       case 'painting': return 2;
//       case 'complete': return 3;
//       default: return 0;
//     }
//   };

//   const handleWeave = async () => {
//     if (!dream.trim()) return;
    
//     setError(null);
//     setData(null);
//     setGeneratedImage(null);
//     setKeywordImages([]);

//     console.log("Step 1: Starting the dream weaving process...");
//     try {
//       // Step 1: Gather keyword images first to show them
//       setStatus("gathering");
//       setLoadingMessage("Gathering dream fragments...");
//       const keywordImageData = await fetchKeywordImages(dream);
//       setKeywordImages(keywordImageData);
      
//       // Step 2: Analyze the dream text
//       setStatus("analyzing");
//       setLoadingMessage("Consulting the Oracle...");
//       const analysisData = await analyzeDream(dream);
//       setData(analysisData);
      
//       // Step 3: Paint the dream image
//       setStatus("painting");
//       setLoadingMessage("Manifesting the Vision...");
//       console.log("Step 4: Calling Stability AI to paint the dream...");
//       const imageUrl = await paintDream(analysisData.visual_prompt);
//       setGeneratedImage(imageUrl);
      
//       setResultView('visual'); // Default to showing the visual first
//       setStatus("complete");
//       console.log("Step 6: Dream weaving complete!"); // This is now correct
//     } catch (err) {
//       console.error("--- ERROR during dream weaving process ---");
//       console.error(err.message);
//       console.error("-----------------------------------------");
//       setError(err.message || "The dream slipped away... Please try again.");
//       setStatus("idle");
//     }
//   };

//   const handleDownload = () => {
//     if (generatedImage) {
//       const link = document.createElement('a');
//       link.href = generatedImage;
//       // Suggest a filename for the download
//       link.download = `dreamscape-weaver-${data?.title?.replace(/\s+/g, '-').toLowerCase() || 'image'}.png`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     }
//   };

//   // --- RENDER FUNCTIONS ---

//   const renderInput = () => (
//     <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-1000">
//       <div className="mb-4 relative">
//         <div className="absolute -inset-4 bg-gradient-to-t from-purple-600 to-indigo-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
//         <AnimatedDreamEye className="w-20 h-20 text-purple-200 relative z-10" style={{ '--background-color': '#050609' }}/>
//       </div>
      
//       <h1 className="text-4xl md:text-7xl font-serif text-gradient-purple mb-6 tracking-tight">
//         Dreamscape Weaver
//       </h1>
      
//       <p className="text-lg text-purple-200/60 max-w-xl mb-12 font-light">
//         Whisper your midnight wanderings to the machine. We will unravel the symbolism and paint the subconscious.
//       </p>

//       <div className="w-full max-w-2xl relative group">
//         <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
//         <textarea
//           value={dream}
//           onChange={(e) => setDream(e.target.value)}
//           placeholder="Last night, I was walking through a forest of mirrors..."
//           className="relative w-full bg-[#0F111A] border border-white/10 text-purple-100 rounded-2xl p-4 md:p-6 pr-32 h-40 focus:outline-none focus:border-purple-500/50 resize-none shadow-2xl text-lg font-light placeholder:text-slate-600 transition-all z-10"
//         />
//         <button
//           onClick={handleWeave}
//           disabled={!dream.trim()}
//           className="absolute bottom-4 right-4 z-20 bg-purple-600/20 hover:bg-purple-600 hover:text-white border border-purple-500/30 text-purple-300 px-6 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 backdrop-blur-md"
//         >
//           Decode <Stars size={16} />
//         </button>
//       </div>
//     </div>
//   );

//   const renderLoading = () => (
//     <div className="flex flex-col items-center justify-center min-h-[60vh]">
//       <div className="relative w-64 h-64 mb-12 flex items-center justify-center text-purple-300">
//         {/* Keyword Image Animations - UPDATED */}
//         {keywordImages.map(({ url, style }, index) => (
//           <div
//             key={index}
//             className="absolute top-0 left-0 w-full h-full"
//             style={{
//               transform: `rotate(${style.rotation}deg) translateX(${style.translateX}px)`
//             }}
//           >
//             <div className="w-24 h-24" style={{ transform: `rotate(-${style.rotation}deg)` }}>
//               <img
//                 src={url}
//                 alt=""
//                 className="w-full h-full object-cover rounded-lg shadow-2xl shadow-purple-900/50"
//                 style={{
//                   animation: `float-image ${style.animationDuration}s ease-in-out ${style.animationDelay}s infinite`,
//                 }}
//               />
//             </div>
//           </div>
//         ))}
//         {/* Intricate SVG Animation */}
//         <svg viewBox="0 0 200 200" className="absolute w-full h-full opacity-40 animate-in fade-in duration-1000">
//           {/* Outer Ring with text */}
//           <path id="circlePath" fill="none" stroke="none" d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" />
//           <text>
//             <textPath href="#circlePath" className="fill-purple-500/40 text-[8px] tracking-[0.2em] uppercase">
//               Weaving the threads of consciousness • Weaving the threads of consciousness •
//             </textPath>
//           </text>
//           {/* Rotating gradient rings */}
//           <circle cx="100" cy="100" r="90" fill="none" stroke="url(#grad1)" strokeWidth="0.5" className="animate-[spin_20s_linear_infinite_reverse]" />
//           <circle cx="100" cy="100" r="60" fill="none" stroke="url(#grad2)" strokeWidth="0.5" className="animate-[spin_15s_linear_infinite]" />
//           <defs>
//             <linearGradient id="grad1"><stop offset="0%" stopColor="rgba(168, 85, 247, 0)" /><stop offset="100%" stopColor="rgba(168, 85, 247, 0.5)" /></linearGradient>
//             <linearGradient id="grad2"><stop offset="0%" stopColor="rgba(99, 102, 241, 0)" /><stop offset="100%" stopColor="rgba(99, 102, 241, 0.5)" /></linearGradient>
//           </defs>
//         </svg>
//         <div className="animate-cosmic-pulse">
//           {['gathering', 'analyzing'].includes(status) && <Eye size={48} strokeWidth={1} />}
//           {status === 'painting' && <Palette size={48} strokeWidth={1} />}
//         </div>
//       </div>
//       <h2 className="text-3xl font-serif text-purple-200 mb-3 tracking-wide animate-in fade-in duration-500">
//         {loadingMessage}
//       </h2>
//     </div>
//   );

//   const renderResult = () => (
//     <div className="w-full max-w-6xl mx-auto px-4 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
//       {/* Header */}
//       <div className="text-center mb-16">
//         <div className="inline-block p-2 px-4 rounded-full bg-purple-900/30 border border-purple-500/20 text-purple-300 text-xs tracking-[0.2em] uppercase mb-4">
//           Dream Analysis
//         </div>
//         <h1 className="text-3xl md:text-6xl font-serif text-white mb-4">{data.title}</h1>
//         <p className="text-purple-200/60 text-lg max-w-2xl mx-auto italic font-light">Emotional Tone: {data.emotional_tone}</p>
//       </div>
      
//       {/* View Toggle */}
//       <div className="flex justify-center mb-8">
//         <div className="bg-slate-900/40 border border-white/10 rounded-full p-1 flex gap-1 backdrop-blur-sm">
//           <button 
//             onClick={() => setResultView('visual')}
//             className={`px-4 py-2 text-sm rounded-full transition-all flex items-center gap-2 ${resultView === 'visual' ? 'bg-purple-600/30 text-purple-200' : 'text-slate-400 hover:bg-white/5'}`}
//           >
//             <Palette size={16} />
//             Visual
//           </button>
//           <button 
//             onClick={() => setResultView('analysis')}
//             className={`px-4 py-2 text-sm rounded-full transition-all flex items-center gap-2 ${resultView === 'analysis' ? 'bg-purple-600/30 text-purple-200' : 'text-slate-400 hover:bg-white/5'}`}
//           >
//             <BrainCircuit size={16} />
//             Analysis
//           </button>
//         </div>
//       </div>

//       {/* Conditional Content */}
//       {resultView === 'visual' && renderResultVisual()}
//       {resultView === 'analysis' && renderResultAnalysis()}

//       <button 
//         onClick={() => { setStatus('idle'); setDream(''); }}
//         className="w-full max-w-md mx-auto mt-12 py-4 rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 group"
//       >
//         <Sparkles size={16} className="group-hover:rotate-12 transition-transform"/> 
//         Interpret Another Dream
//       </button>
//     </div>
//   );

//   const renderResultVisual = () => (
//     <div className="animate-in fade-in duration-500">
//       <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] border border-white/10 group max-w-3xl mx-auto">
//           {generatedImage ? (
//           <img 
//             src={generatedImage} 
//             alt="Dream Visual" 
//             className="w-full h-auto object-cover aspect-[1/1] transition-transform duration-[2s] group-hover:scale-105"
//           />
//         ) : (
//           <div className="w-full aspect-[1/1] bg-slate-900 flex flex-col items-center justify-center text-slate-600 p-8">
//             <Palette size={48} className="opacity-20"/>
//             <p className="mt-4 text-sm text-slate-500 px-10 text-center">
//               (Image generation requires a valid Stability AI key in your .env file)
//             </p>
//           </div>
//         )}
//         <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent opacity-60 flex items-end justify-center pb-6">
//           {generatedImage && (
//             <button
//               onClick={handleDownload}
//               className="bg-purple-600/30 hover:bg-purple-600 border border-purple-500/30 text-purple-200 px-6 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 backdrop-blur-md z-20"
//             >
//               Download Image
//               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
//                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
//                 <polyline points="7 10 12 15 17 10"/>
//                 <line x1="12" x2="12" y1="15" y2="3"/>
//               </svg>
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );

//   const renderResultAnalysis = () => (
//     <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
//       {data.analysis_sections.map((section, idx) => (
//         <div key={idx} className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 md:p-6 hover:border-purple-500/30 transition-all duration-500 shadow-xl">
//           <h3 className="text-lg md:text-xl font-serif text-purple-200 mb-4 font-semibold border-b border-white/5 pb-3">
//             {section.title}
//           </h3>
//           <div className="text-slate-300 font-light leading-relaxed whitespace-pre-wrap">
//             {section.content}
//           </div>
//         </div>
//       ))}

//       {/* Suggestion Card */}
//       {data.suggestion && (
//         <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
//            <div className="absolute top-0 right-0 p-16 bg-purple-500/10 blur-3xl rounded-full -mr-8 -mt-8"></div>
//            <div className="flex items-center gap-3 mb-3 text-purple-300 relative z-10">
//               <HeartHandshake size={24} />
//               <h3 className="font-serif italic text-xl">A Message for You</h3>
//            </div>
//            <p className="text-purple-100/90 font-light italic leading-relaxed relative z-10 text-lg">
//              "{data.suggestion}"
//            </p>
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-[#050609] text-slate-200 font-sans selection:bg-purple-500/30 overflow-x-hidden">
//       {/* Deep Space Background */}
//       {status === 'idle' && (
//         <video
//           autoPlay
//           loop
//           muted
//           className="fixed inset-0 w-full h-full object-cover z-0 opacity-30"
//           src="/dream.mp4"
//         />
//       )}
//       <div className="fixed inset-0 z-0">
//         <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-900/10 rounded-full blur-[150px] animate-[pulse_8s_ease-in-out_infinite]"></div>
//         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-950/20 rounded-full blur-[150px]"></div>
//         <div className="absolute top-[40%] left-[30%] w-[20%] h-[20%] bg-pink-900/5 rounded-full blur-[100px]"></div>
//       </div>

//       <div className="relative z-10">
//         {/* Minimal Nav */}
//         <nav className="p-6 flex items-center justify-center relative">
//           {status !== 'idle' && (
//             <div className="absolute left-1/2 transform -translate-x-1/2">
//                <StepIndicator currentStep={getStepIndex()} steps={steps} />
//             </div>
//           )}
//         </nav>

//         {/* Content */}
//         <main className="py-8">
//           {error && (
//             <div className="max-w-xl mx-auto mb-8 bg-red-900/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-center font-light backdrop-blur-md">
//               {error}
//             </div>
//           )}

//           {status === 'idle' && renderInput()}
//           {['analyzing', 'painting'].includes(status) && renderLoading()}
//           {status === 'complete' && data && renderResult()}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default App;
