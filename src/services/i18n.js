import { reactive, ref } from 'vue';

const translations = {
    en: { 
        title: "Ask Me Anythings", 
        ask: "Tap the Tive to start a communicate. I can discovery the web, find places, or save your Memos and Notebook.", 
        askModel: "Ask {model} anything",
        discovery: "Discovery", 
        map: "AI Map", 
        memo: "Memo",
        notebook: "Notebook", 
        thinking: "Thinking..", 
        history: "Back", 
        settings: "Settings", 
        language: "Language", 
        appearance: "Appearance", 
        modelChoice: "AI Model",
        cognitive: "Synchronizing Cognitive Assets" 
    },
    ja: { 
        title: "Ask Me Anythings", 
        ask: "Tiveをタップして会話を始めましょう。ウェブの探索、場所の検索、メモやノートブックの保存が可能です。", 
        askModel: "{model}に質問してみましょう",
        discovery: "Discovery", 
        map: "AIマップ", 
        memo: "メモ",
        notebook: "ノートブック", 
        thinking: "思考中..", 
        history: "戻る", 
        settings: "設定", 
        language: "言語", 
        appearance: "外観", 
        modelChoice: "AIモデル",
        cognitive: "認知資産を同期中" 
    }
};

export const activeModel = ref(localStorage.getItem('tive_model') || 'Gemini');
export const setModel = (m) => {
    activeModel.value = m;
    localStorage.setItem('tive_model', m);
};

export const i18n = reactive({
    locale: localStorage.getItem('tive_locale') || 'en',
    setLocale(l) {
        this.locale = l;
        localStorage.setItem('tive_locale', l);
    },
    t(key) {
        return translations[this.locale]?.[key] || translations['en'][key] || key;
    }
});

export const theme = ref(localStorage.getItem('tive_theme') || 'dark');

// Apply theme on load
if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('light-mode', theme.value === 'light');
}

export const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('tive_theme', theme.value);
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('light-mode', theme.value === 'light');
  }
};
