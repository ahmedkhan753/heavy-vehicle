export const ASSISTANT_STORAGE_KEY = "hw_assistant_messages_v1";

export const assistantGreeting = {
  en:
    "Hi! I'm the HeavyWheels Assistant. I can help you buy or sell heavy vehicles, create listings, understand specifications, compare options, and find the right vehicle for your work. What can I help you with?",
  ur:
    "السلام علیکم! میں HeavyWheels Assistant ہوں۔ میں گاڑی خریدنے یا بیچنے، اشتہار بنانے، specifications سمجھنے، قیمت اور آپ کے کام کے لیے مناسب گاڑی منتخب کرنے میں مدد کر سکتا ہوں۔ آپ کیا جاننا چاہتے ہیں؟",
};

export const assistantLabels = {
  en: {
    title: "HeavyWheels Assistant",
    subtitle: "Your Heavy Vehicle Marketplace Guide",
    online: "Online",
    placeholder: "Ask HeavyWheels...",
    send: "Send",
    thinking: "Thinking...",
    close: "Close assistant",
    open: "Open HeavyWheels Assistant",
    error: "I'm having trouble connecting right now. Please try again in a moment.",
    reset: "New chat",
  },
  ur: {
    title: "HeavyWheels Assistant",
    subtitle: "آپ کا ہیوی وہیکل مارکیٹ پلیس گائیڈ",
    online: "آن لائن",
    placeholder: "HeavyWheels سے پوچھیں...",
    send: "بھیجیں",
    thinking: "سوچ رہا ہوں...",
    close: "اسسٹنٹ بند کریں",
    open: "HeavyWheels Assistant کھولیں",
    error: "ابھی کنکشن میں مسئلہ آ رہا ہے۔ براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔",
    reset: "نئی چیٹ",
  },
};

export const suggestedQuestions = {
  en: [
    { label: "Find a vehicle", prompt: "Help me find a heavy vehicle on HeavyWheels." },
    { label: "Check vehicle prices", prompt: "How should I estimate a fair price for a used heavy vehicle?" },
    { label: "Post a vehicle", prompt: "Guide me step by step to post a vehicle ad on HeavyWheels." },
    { label: "Which vehicle is right for me?", prompt: "Help me choose the right vehicle for my work." },
    { label: "Compare vehicles", prompt: "Help me compare Hino, Isuzu, HOWO and Shacman trucks." },
    { label: "Safety tips", prompt: "What safety tips should I follow before buying a heavy vehicle?" },
  ],
  ur: [
    { label: "گاڑی تلاش کریں", prompt: "HeavyWheels پر میرے لیے گاڑی تلاش کرنے میں مدد کریں۔" },
    { label: "قیمت معلوم کریں", prompt: "استعمال شدہ ہیوی گاڑی کی مناسب قیمت کیسے اندازہ کروں؟" },
    { label: "اشتہار لگائیں", prompt: "HeavyWheels پر گاڑی کا اشتہار لگانے کا طریقہ بتائیں۔" },
    { label: "کون سی گاڑی بہتر ہے؟", prompt: "میرے کام کے لیے مناسب گاڑی منتخب کرنے میں مدد کریں۔" },
    { label: "گاڑیوں کا موازنہ", prompt: "Hino, Isuzu, HOWO اور Shacman trucks کا موازنہ کرائیں۔" },
    { label: "حفاظتی معلومات", prompt: "ہیوی گاڑی خریدنے سے پہلے کون سی احتیاط کرنی چاہیے؟" },
  ],
};

export function createGreetingMessage(lang = "en") {
  return {
    role: "assistant",
    content: assistantGreeting[lang] || assistantGreeting.en,
  };
}
