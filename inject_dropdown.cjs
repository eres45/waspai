const fs = require("fs");
const content = fs.readFileSync("WaspAI app/App.js", "utf8");

const targetStr = `        {/* Floating dropdown box */}
        <View style={[styles.dropdown, { top: dropdownPos.top, right: dropdownPos.right }]}>
          <View style={styles.dropdownSearchWrapper}>
            <Search color="#71717A" size={13} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.dropdownSearchInput}
              placeholder="Search..."
              placeholderTextColor="#52525B"
              value={modelSearch}
              onChangeText={setModelSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={filteredModels}
            keyExtractor={(item, index) => \`\${item.id}_\${item.provider}_\${index}\`}
            style={{ maxHeight: 280 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dropdownRow,
                  selectedModel === item.id && styles.dropdownRowActive,
                ]}
                onPress={() => {
                  setSelectedModel(item.id);
                  setSelectedModelLabel(item.id);
                  setIsModelSelectorOpen(false);
                  setModelSearch('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownRowLabel} numberOfLines={1}>{item.id}</Text>
                {selectedModel === item.id && (
                  <Text style={styles.dropdownRowCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={`;

const replacementStr = `        {/* Floating dropdown box */}
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

          <View style={styles.dropdownSearchWrapper}>
            <Search color="#71717A" size={13} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.dropdownSearchInput}
              placeholder="Search..."
              placeholderTextColor="#52525B"
              value={modelSearch}
              onChangeText={setModelSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {selectorTab === 'models' ? (
            <FlatList
              data={filteredModels}
              keyExtractor={(item, index) => \`\${item.id}_\${item.provider}_\${index}\`}
              style={{ maxHeight: 280 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownRow,
                    selectedModel === item.id && !selectedAgentId && styles.dropdownRowActive,
                  ]}
                  onPress={() => {
                    setSelectedAgentId(null);
                    setSelectedModel(item.id);
                    setSelectedModelLabel(item.id);
                    setIsModelSelectorOpen(false);
                    setModelSearch('');
                  }}
                  activeOpacity={0.7}
                >
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

if (content.includes(targetStr)) {
  const newContent = content.replace(targetStr, replacementStr);
  fs.writeFileSync("WaspAI app/App.js", newContent, "utf8");
  console.log("Successfully injected UI Dropdown Tabs!");
} else {
  console.log("Target string not found for dropdown UI!");
}
