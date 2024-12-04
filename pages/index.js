
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Button, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Configuration, OpenAIApi } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import CheckBox from '@react-native-community/checkbox'; // Import CheckBox

// Initialize Supabase client
const supabase = createClient(
  Constants.expoConfig.extra.SUPABASE_URL,
  Constants.expoConfig.extra.SUPABASE_KEY
);

// Initialize OpenAI client
const openaiConfig = new Configuration({
  apiKey: Constants.expoConfig.extra.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfig);

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(Constants.expoConfig.extra.GOOGLE_API_KEY);

// Model instances for Gemini models
const model1 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-001' });
const model3 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });
const model4 = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });

const App = () => {
  const [formData, setFormData] = useState({
    model: 'gpt-3.5-turbo',
    language: 'English',
    message: '',
  });
  const [translation, setTranslation] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previousTranslations, setPreviousTranslations] = useState([]);

  const supportedLanguages = {
    "gpt-3.5-turbo": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Swedish", "Arabic", "Turkish", "Korean", "Hindi", "Greek", "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay"],
    "gpt-4": ["Spanish", "French", "Telugu", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean", "Swedish", "Arabic", "Turkish", "Hindi", "Greek", "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay"],
    "gpt-4-turbo": ["Spanish", "French", "Telugu", "Japanese", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Korean", "Arabic", "Swedish", "Turkish", "Hindi", "Greek", "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay"],
    "gemini-1.5-pro-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Swedish", "Turkish", "Arabic", "Greek", "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay"],
    "gemini- 1.5-flash-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Swedish", "Turkish", "Arabic", "Greek", "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay"],
    "gemini-1.5-pro-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean", "Swedish", "Arabic", "Turkish", "Greek", "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay"],
    "gemini-1.5-flash-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean", "Arabic", "Swedish", "Turkish", "Greek", "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay"],
    "deepl": ["Spanish", "French", "Japanese", "German", "Italian", "Dutch", "Russian", "Chinese (Simplified)", "Polish", "Portuguese", "Swedish", "Turkish", "Arabic", "Korean", "Hindi", "Greek", "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay"],
  };

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setError('');
  };

  const fetchPreviousTranslations = async () => {
    const { data, error } = await supabase
      .from("translations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching translations:", error);
    } else {
      setPreviousTranslations(data);
    }
   
  };

  useEffect(() => {
    fetchPreviousTranslations();
  }, []);

  


  const translate = async () => {
    const { language, message, model } = formData;

    if (!message) {
      setError('Please enter a message to translate.');
      return;
    }

    try {
      setIsLoading(true);
      let translatedText = '';

      if (model.startsWith('gpt')) {
        const response = await openai.createChatCompletion({
          model: model,
          messages: [
            {
              role: 'system',
              content: `Translate this sentence into ${language}.`,
            },
            { role: 'user', content: message },
          ],
          temperature: 0.3,
          max_tokens: 100,
        });
        translatedText = response.data.choices[0].message.content.trim();
      } else if (model.startsWith('gemini')) {
        const prompt = `Translate the text: "${message}" into ${language}`;
        let result;

        if (model === 'gemini-1.5-flash-001') {
          result = await model1.generateContent(prompt);
        } else if (model === 'gemini-1.5-pro-001') {
          result = await model2.generateContent(prompt);
        } else if (model === 'gemini-1.5-flash-002') {
          result = await model3.generateContent(prompt);
        } else if (model === 'gemini-1.5-pro-002') {
          result = await model4.generateContent(prompt);
        }

        translatedText = result.response.text;
      } else if (model === 'deepl') {
        translatedText = await translateWithDeepL(message, language);
      }

      setTranslation(translatedText);

      // Save the translation to Supabase
      await supabase
        .from('translations')
        .insert([{
          original_message: message,
          translated_message: translatedText,
          language: language,
          model: model,
        }]);

      // Fetch the latest translations after inserting
      fetchPreviousTranslations();
    } catch (error) {
      console.error('Translation error:', error);
      setError('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const translateWithDeepL = async (text, toLang) => {
    const deepLLanguageCodes = {
      "Spanish": "ES",
      "French": "FR",
      "German": "DE",
      "Italian": "IT",
      "Dutch": "NL",
      "Russian": "RU",
      "Chinese (Simplified)": "ZH",
      "Japanese": "JA",
      "Portuguese": "PT",
      "Polish": "PL",
      "Swedish": "SV",
      "Arabic": "AR",
      "Turkish": "TR",
      "Korean": "KO",
      "Hindi": "HI",
      "Greek": "EL",
      "Hebrew": "HE",
      "Thai": "TH",
      "Vietnamese": "VI",
      "Indonesian": "ID",
      "Malay": "MS",
    };

    try {
      const targetLangCode = deepLLanguageCodes[toLang];
      if (!targetLangCode) {
        throw new Error(`Unsupported language: ${toLang}`);
      }

      console.log(`Sending translation request to DeepL with text: "${text}" to language: "${toLang}"`);

      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          auth_key: Constants.expoConfig.extra.DEEPL_API_KEY,
          text: text,
          source_lang: "EN",
          target_lang: targetLangCode,
        }),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`DeepL API request failed with status ${response.status}. Error: ${errorDetails}`);
      }

      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      console.error("DeepL Translation Error:", error);
      throw new Error("Failed to translate with DeepL.");
    }
  };

  const handleOnSubmit = () => {
    translate();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.sidebar}>
  <Text style={styles.heading}>Models</Text>
  <View style={styles.modelRow}>
    {["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gemini-1.5-pro-001"].map((model) => (
      <TouchableOpacity
        key={model}
        style={[styles.modelOption, formData.model === model && styles.active]}
        onPress={() => handleInputChange("model", model)}
      >
        <Text style={{ color: '#000000' }}>{model}</Text>
      </TouchableOpacity>
    ))}
  </View>
  <View style={styles.modelRow}>
    {["gemini-1.5-flash-001", "gemini-1.5-pro-002", "gemini-1.5-flash-002", "deepl"].map((model) => (
      <TouchableOpacity
        key={model}
        style={[styles.modelOption, formData.model === model && styles.active]}
        onPress={() => handleInputChange("model", model)}
      >
        <Text style={{ color: '#000000' }}>{model}</Text>
      </TouchableOpacity>
    ))}
  </View>
</View>

      <View style={styles.main}>
        <Text style={styles.title}>Translation App</Text>
        <Text>Selected Model: {formData.model}</Text>

        <Picker
          selectedValue={formData.language}
          onValueChange={(itemValue) => handleInputChange("language", itemValue)}
          style={styles.picker}
        >
          {supportedLanguages[formData.model]?.map((lang) => (
            <Picker.Item key={lang} label={lang} value={lang} />
          ))}
        </Picker>

        <TextInput
          style={styles.textInput}
          placeholder="Enter text to translate"
          value={formData.message}
          onChangeText={(text) => handleInputChange('message', text)}
        />

        <Button title="Translate" onPress={handleOnSubmit} disabled={isLoading} />

        {isLoading && <ActivityIndicator size="large" color="#0000ff" />}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {translation && (
          <Text style={styles.resultText}>Translated Text: {translation}</Text>
        )}

        <Text style={styles.heading}>Previous Translations</Text>
{previousTranslations.length > 0 ? (
  <View style={styles.table}>
    <View style={styles.tableHeader}>
      <Text style={styles.tableHeaderCell}>Original</Text>
      <Text style={styles.tableHeaderCell}>Translated</Text>
      <Text style={styles.tableHeaderCell}>Language</Text>
      <Text style={styles.tableHeaderCell}>Model</Text>
      <Text style={styles.tableHeaderCell}>Date</Text>
    </View>
    <FlatList
      data={previousTranslations}
      keyExtractor={(item) => item.id.toString()} // Assuming 'id' is a unique identifier
      renderItem={({ item }) => (
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>{item.original_message}</Text>
          <Text style={styles.tableCell}>{item.translated_message}</Text>
          <Text style={styles.tableCell}>{item.language}</Text>
          <Text style={styles.tableCell}>{item.model}</Text>
          <Text style={styles.tableCell}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
      )}
    />
  </View>
) : (
  <Text>No previous translations found.</Text>
)}
      </View>

      <CompareTranslate />
      <StatusBar style="auto" />
    </ScrollView>
  );
};
const CompareTranslate = () => {
  const [formData, setFormData] = useState({
    message: '',
    toLanguage: 'Spanish',
    models: [],
    tone: 'mild',
  });
  const [translations, setTranslations] = useState({});
  const [scores, setScores] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const genAI = new GoogleGenerativeAI(Constants.expoConfig.extra.GOOGLE_API_KEY);
  const configuration = new Configuration({
    apiKey: Constants.expoConfig.extra.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const deepLLanguageCodes = {
    Spanish: 'ES',
    French: 'FR',
    German: 'DE',
    Italian: 'IT',
    Dutch: 'NL',
    Russian: 'RU',
    'Chinese (Simplified)': 'ZH',
    Japanese: 'JA',
    Portuguese: 'PT',
    Polish: 'PL',
  };

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleModelChange = (model) => {
    setFormData((prevState) => {
      const models = prevState.models.includes(model)
        ? prevState.models.filter((m) => m !== model)
        : [...prevState.models, model];
      return { ...prevState, models };
    });
  };

  const translateWithDeepL = async (text, toLang) => {
    try {
      const targetLangCode = deepLLanguageCodes[toLang];
      const response = await fetch(`https://api-free.deepl.com/v2/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          auth_key: Constants.expoConfig.extra.DEEPL_API_KEY,
          text,
          source_lang: 'EN',
          target_lang: targetLangCode,
        }),
      });

      if (!response.ok) throw new Error(`DeepL API request failed`);

      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      console.error('DeepL Translation Error:', error);
      throw new Error('Failed to translate with DeepL.');
    }
  };

  const translate = async (model) => {
    const { toLanguage, message, tone } = formData;
    setIsLoading(true);
    let translatedText = '';

    try {
      if (model.startsWith('gpt')) {
        const response = await openai.createChatCompletion({
          model,
          messages: [
            { role: 'system', content: `Translate this sentence into ${toLanguage}. ` },
            { role: 'user', content: message },
          ],
          max_tokens: 100,
        });
        translatedText = response.data.choices[0].message.content.trim();
      } else if (model.startsWith('gemini')) {
        const genAIModel = genAI.getGenerativeModel({ model });
        const prompt = `Translate the text: "${message}" from English to ${toLanguage} with a ${tone.toLowerCase()} tone.`;
        const result = await genAIModel.generateContent(prompt);
        translatedText = result.response.text;
      } else if (model === 'deepl') {
        translatedText = await translateWithDeepL(message, toLanguage);
      }
      return translatedText;
    } catch (error) {
      console.error('Translation Error:', error);
      setError('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnSubmit = async () => {
    if (!formData.message) {
      setError('Please enter the message.');
      return;
    }

    setIsLoading(true);
    setTranslations({});
    setScores({});

    try {
      const promises = formData.models.map(async (model) => {
        const translation = await translate(model);
        const score = Math.floor(Math.random() * 10) + 1;
        return { model, translation, score };
      });

      const results = await Promise.all(promises);
      const translationResults = {};
      const scoreResults = {};

      results.forEach(({ model, translation, score }) => {
        translationResults[model] = translation;
        scoreResults[model] = score;
      });

      setTranslations(translationResults);
      setScores(scoreResults);
    } catch (err) {
      console.error('Translation Error:', err);
      setError('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const models = [
    'gemini-1.5-pro-001',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro-002',
    'gemini-1.5-flash-002',
  ];

  return (
    <View style={styles.container}>
      <Text 
      style={styles.title}>Compare Translations</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter text to translate"
        value={formData.message}
        onChangeText={(text) => handleInputChange('message', text)}
      />
      <Picker
        selectedValue={formData.toLanguage}
        onValueChange={(itemValue) => handleInputChange('toLanguage', itemValue)}
        style={styles.picker}
      >
        {Object.keys(deepLLanguageCodes).map((lang) => (
          <Picker.Item key={lang} label={lang} value={lang} />
        ))}
      </Picker>
      <Text style={styles.subTitle}>Select Models:</Text>
      {models.map((model) => (
        <TouchableOpacity
          key={model}
          style={styles.modelOption}
          onPress={() => handleModelChange(model)}
        >
          <Text style={{ color: formData.models.includes(model) ? '#0000ff' : '#000' }}>{model}</Text>
        </TouchableOpacity>
      ))}
      <Button title="Translate" onPress={handleOnSubmit} disabled={isLoading} />
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {Object.keys(translations).length > 0 && (
        <View style={styles.results}>
          <Text style={styles.heading}>Translation Results:</Text>
          {Object.entries(translations).map(([model, translation]) => (
            <View key={model} style={styles.resultRow}>
              <Text style={styles.resultText}>{model}: {translation} (Score: {scores[model]})</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 18,
    marginVertical: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
  },
  modelOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  results: {
    marginTop: 20,
  },
  resultRow: {
    marginVertical: 5,
  },
  resultText: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
  },
  modelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute space evenly
    marginBottom: 10, // Add some space between rows
  },
  modelOption: {
    flex: 1, // Allow each model option to take equal space
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 5, // Add horizontal margin between buttons
    alignItems: 'center', // Center the text
  },
  active: {
    backgroundColor: "#e0e0e0",
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableCell: {
    flex: 1,
    padding: 10,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  // Remove the right border for the last cell in each row
  tableCellLast: {
    borderRightWidth: 0,
  },
  modelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute space evenly
    marginBottom: 10, // Add some space below the models
  },
  modelOption: {
    flex: 1, // Allow each model option to take equal space
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 5, // Add horizontal margin between buttons
    alignItems: 'center', // Center the text
    borderRadius: 5, // Optional: add rounded corners
  },
  active: {
    backgroundColor: "#e0e0e0", // Optional: highlight active model
  },
});

export default App;
