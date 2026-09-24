const fs = require("fs");
const content = fs.readFileSync("WaspAI app/App.js", "utf8");

const targetStr = `  // Model selector state
  const [models, setModels] = useState(FEATURED_MODELS);
  const [allModels, setAllModels] = useState(CURATED_100_MODELS);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-oss-120b');
  const [selectedModelLabel, setSelectedModelLabel] = useState('GPT OSS 120B');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');`;

const replacementStr = `  // Model selector state
  const [models, setModels] = useState(FEATURED_MODELS);
  const [allModels, setAllModels] = useState(CURATED_100_MODELS);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-oss-120b');
  const [selectedModelLabel, setSelectedModelLabel] = useState('GPT OSS 120B');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  // Custom Agents & Skills State
  const [selectorTab, setSelectorTab] = useState('models'); // 'models' | 'agents'
  const [customAgents, setCustomAgents] = useState([]);
  const [publicSkills, setPublicSkills] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [isFetchingAgents, setIsFetchingAgents] = useState(false);

  useEffect(() => {
    if (isModelSelectorOpen && customAgents.length === 0 && !isFetchingAgents) {
      setIsFetchingAgents(true);
      Promise.all([
        API.fetchAgents().catch(e => { console.warn("Failed to fetch agents", e); return []; }),
        API.fetchSkills().catch(e => { console.warn("Failed to fetch skills", e); return { items: [] }; })
      ]).then(([agentsData, skillsData]) => {
        setCustomAgents(agentsData || []);
        setPublicSkills(skillsData?.items || []);
      }).finally(() => {
        setIsFetchingAgents(false);
      });
    }
  }, [isModelSelectorOpen]);`;

if (content.includes(targetStr)) {
  const newContent = content.replace(targetStr, replacementStr);
  fs.writeFileSync("WaspAI app/App.js", newContent, "utf8");
  console.log("Successfully injected Agent state variables!");
} else {
  console.log("Target string not found! App.js might be slightly different.");
}
