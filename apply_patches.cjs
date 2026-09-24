const fs = require("fs");

function applyPatches() {
  let code = fs.readFileSync("WaspAI app/App.js", "utf8");
  // Normalize ALL line endings to \n
  code = code.replace(/\\r\\n/g, "\\n");

  // --- 1. Agents State ---
  const stateTarget = `  // Model selector state
  const [models, setModels] = useState(FEATURED_MODELS);
  const [allModels, setAllModels] = useState(CURATED_100_MODELS);`;

  const stateReplace = `  // Model selector state
  const [models, setModels] = useState(FEATURED_MODELS);
  const [allModels, setAllModels] = useState(CURATED_100_MODELS);

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

  if (code.includes(stateTarget)) {
    code = code.replace(stateTarget, stateReplace);
    console.log("Success: Applied patch [Agents State]");
  } else {
    console.error("ERROR: Target not found for [Agents State]");
    return;
  }

  // --- 2. Remove Email/Password UI ---
  const authRegex =
    /\{\/\* Email Input \*\/\}[\s\S]*?\{\/\* Social Login Row \*\/\}/;
  if (authRegex.test(code)) {
    code = code.replace(authRegex, "{/* Social Login Row */}");
    console.log("Success: Removed Email/Password inputs");
  } else {
    console.error("ERROR: Auth block regex failed");
    return;
  }

  const toggleRegex =
    /\{\/\* Social Login Row \*\/\}[\s\S]*?\{\/\* Cancel Button \*\/\}/;
  const socialBlockMatch = code.match(toggleRegex);
  if (socialBlockMatch) {
    let socialBlock = socialBlockMatch[0];
    const githubEnd = socialBlock.indexOf(
      "</TouchableOpacity>",
      socialBlock.indexOf("GitHub Button"),
    );
    if (githubEnd !== -1) {
      const closingTag = "</TouchableOpacity>";
      const endIdx = githubEnd + closingTag.length;
      const newSocialBlock =
        socialBlock.substring(0, endIdx) +
        "\\n\\n              {/* Cancel Button */}";
      code = code.replace(toggleRegex, newSocialBlock);
      console.log("Success: Removed Toggle Mode link");
    } else {
      console.error("ERROR: Could not find end of GitHub button");
      return;
    }
  } else {
    console.error("ERROR: Toggle mode block regex failed");
    return;
  }

  // --- 3. Dropdown UI ---
  const dropdownTarget = `        {/* Floating dropdown box */}
        <View style={[styles.dropdown, { top: dropdownPos.top, right: dropdownPos.right }]}>
          <View style={styles.dropdownSearchWrapper}>`;

  const dropdownReplace = `        {/* Floating dropdown box */}
        <View style={[styles.dropdown, { top: dropdownPos.top, right: dropdownPos.right, minWidth: 260 }]}>
          
          {/* Hybrid Tab Switcher */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 }}>
            <TouchableOpacity 
              style={{ flex: 1, alignItems: 'center', paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: selectorTab === 'models' ? '#8B5CF6' : 'transparent' }}
              onPress={() => setSelectorTab('models')}
            >
              <Text style={{ color: selectorTab === 'models' ? '#FAFAFA' : '#A1A1AA', fontSize: 13, fontFamily: 'Geist_500Medium' }}>Models</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ flex: 1, alignItems: 'center', paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: selectorTab === 'agents' ? '#8B5CF6' : 'transparent' }}
              onPress={() => setSelectorTab('agents')}
            >
              <Text style={{ color: selectorTab === 'agents' ? '#FAFAFA' : '#A1A1AA', fontSize: 13, fontFamily: 'Geist_500Medium' }}>Agents</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dropdownSearchWrapper}>`;

  if (code.includes(dropdownTarget)) {
    code = code.replace(dropdownTarget, dropdownReplace);
    console.log("Success: Applied patch [Dropdown Tabs]");
  } else {
    console.error("ERROR: Target not found for [Dropdown Tabs]");
    return;
  }

  // Now replacing the ListEmptyComponent block of the flatlist:
  const flatListTarget = `              >
                <Text style={styles.dropdownRowLabel} numberOfLines={1}>{item.id}</Text>
                {selectedModel === item.id && (
                  <Text style={styles.dropdownRowCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={`;

  const flatListReplace = `              >
                <Text style={styles.dropdownRowLabel} numberOfLines={1}>{item.id}</Text>
                {selectedModel === item.id && !selectedAgentId && (
                  <Text style={styles.dropdownRowCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#71717A', fontSize: 13 }}>No models found.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={[...customAgents, ...publicSkills].filter(a => a.name.toLowerCase().includes(modelSearch.toLowerCase()))}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 280 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dropdownRow,
                  selectedAgentId === item.id && styles.dropdownRowActive,
                ]}
                onPress={() => {
                  setSelectedAgentId(item.id);
                  setSelectedModelLabel(item.name);
                  setIsModelSelectorOpen(false);
                  setModelSearch('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownRowLabel} numberOfLines={1}>🤖 {item.name}</Text>
                {selectedAgentId === item.id && (
                  <Text style={styles.dropdownRowCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={`;

  if (code.includes(flatListTarget)) {
    code = code.replace(flatListTarget, flatListReplace);
    console.log("Success: Applied patch [Dropdown FlatList]");
  } else {
    console.error("ERROR: Target not found for [Dropdown FlatList]");
    return;
  }

  // --- 4. Hybrid Routing ---
  const routeTarget = `        const res = await fetch(\`\${AI_WORKER_URL}/v1/chat/completions\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelToUse,
            messages: apiMessages,
            stream: false,
          }),
        });`;

  const routeReplace = `      // HYBRID CHAT ROUTING
      let res;
      if (selectedAgentId) {
        // Route to Next.js API for Custom Agents & Skills
        const payload = {
          id: currentChatId || Date.now().toString(),
          message: { id: Date.now().toString(), role: 'user', parts: [{ type: 'text', text: text }] },
          toolChoice: 'auto',
          mentions: [{ type: 'agent', id: selectedAgentId, name: 'Agent', skillId: '' }],
          attachments: []
        };
        const nextRes = await API.sendChatMessage(payload);
        const rawText = await nextRes.text();
        
        let parsedReply = '';
        const lines = rawText.split('\\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try { parsedReply += JSON.parse(line.substring(2)); } catch(e) {}
          }
        }
        reply = parsedReply || "Sorry, the agent couldn't respond properly.";
      } else {
        res = await fetch(\`\${AI_WORKER_URL}/v1/chat/completions\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelToUse,
            messages: apiMessages,
            stream: false,
          }),
        });`;

  if (code.includes(routeTarget)) {
    code = code.replace(routeTarget, routeReplace);
    console.log("Success: Applied patch [Hybrid Routing]");
  } else {
    console.error("ERROR: Target not found for [Hybrid Routing]");
    return;
  }

  fs.writeFileSync("WaspAI app/App.js", code, "utf8");
  console.log("All patches completed successfully!");
}

applyPatches();
