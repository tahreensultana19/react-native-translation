// import React, { useState, useEffect } from 'react';
// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View, TouchableOpacity, TextInput, Button, ActivityIndicator, Alert } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { createClient } from '@supabase/supabase-js';
// import Constants from 'expo-constants';
// import { Configuration, OpenAIApi } from 'openai';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// const supabase = createClient(
//   Constants.expoConfig.extra.SUPABASE_URL,
//   Constants.expoConfig.extra.SUPABASE_KEY
// );


// const App = () => {
//   const [formData, setFormData] = useState({
//     model: 'gpt-3.5-turbo',
//     language: 'English',
//     message: '',
//   });
//   const [translation, setTranslation] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [previousTranslations, setPreviousTranslations] = useState([]);

//   const supportedLanguages = {
//     "gpt-3.5-turbo": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese"],
//     "gpt-4": ["Spanish", "French", "Telugu", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean"],
//     "gpt-4-turbo": ["Spanish", "French", "Telugu", "Japanese", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Korean", "Arabic"],
//     "gemini-1.5-pro-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)"],
//     "gemini-1.5-flash-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)"],
//     "gemini-1.5-pro-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean"],
//     "gemini-1.5-flash-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean", "Arabic"],
//     "deepl": ["Spanish", "French", "Japanese", "German", "Italian", "Dutch", "Russian", "Chinese (Simplified)", "Polish", "Portuguese"],
//   };

//   const handleInputChange = (name, value) => {
//     setFormData((prevData) => ({ ...prevData, [name]: value }));
//     setError('');
//   };

//   const fetchPreviousTranslations = async () => {
//     const { data, error } = await supabase
//       .from("translations")
//       .select("*")
//       .order("created_at", { ascending: false })
//       .limit(5);

//     if (error) {
//       console.error("Error fetching translations:", error);
//     } else {
//       setPreviousTranslations(data);
//     }
//   };

//   useEffect(() => {
//     fetchPreviousTranslations();
//   }, []);

//   const translate = async () => {
//     const { language, message, model } = formData;

//     try {
//       setIsLoading(true);
//       let translatedText = '';

//       if (model.startsWith('gpt')) {
//         const response = await openai.createChatCompletion({
//           model: model,
//           messages: [
//             {
//               role: 'system',
//               content: `Translate this sentence into ${language}.`,
//             },
//             { role: 'user', content: message },
//           ],
//           temperature: 0.3,
//           max_tokens: 100,
//         });
//         translatedText = response.data.choices[0].message.content.trim();
//       } else if (model.startsWith('gemini')) {
//         const genAIModel = googleGenAI.getGenerativeModel({
//           model: 'gemini-1.5-flash',
//         });
//         const prompt = `Translate the text: "${message}" into ${language}`;
//         const result = await genAIModel.generateContent(prompt);
//         translatedText = await result.response.text();
//       } else if (model === 'deepl') {
//         translatedText = await translateWithDeepL(message, language);
//       }

//       setTranslation(translatedText);
//       // Save the translation to Supabase
//       await supabase
//         .from('translations')
//         .insert([
//           {
//             original_message: message,
//             translated_message: translatedText,
//             language: language,
//             model: model,
//           },
//         ]);

//       // Fetch the latest translations after inserting
//       fetchPreviousTranslations();
//     } catch (error) {
//       console.error('Translation error:', error);
//       setError('Translation failed. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const translateWithDeepL = async (text, toLang) => {
//     const deepLLanguageCodes = {
//       Spanish: "ES",
//       French: "FR",
//       German: "DE",
//       Italian: "IT",
//       Dutch: "NL",
//       Russian: "RU",
//       "Chinese (Simplified)": "ZH",
//       Japanese: "JA",
//       Portuguese: "PT",
//       Polish: "PL",
//     };

//     try {
//       const targetLangCode = deepLLanguageCodes[toLang];
//       if (!targetLangCode) {
//         throw new Error(`Unsupported language: ${toLang}`);
//       }

//       const response = await fetch("https://api-free.deepl.com/v2/translate", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//         body: new URLSearchParams({
//           auth_key: Constants.expoConfig.extra.DEEPL_API_KEY,
//           text: text,
//           source_lang: "EN",
//           target_lang: targetLangCode,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`DeepL API request failed with status ${response.status}`);
//       }

//       const data = await response.json();
//       return data.translations[0].text;
//     } catch (error) {
//       console.error("DeepL Translation Error:", error);
//       throw new Error("Failed to translate with DeepL.");
//     }
//   };

//   const handleOnSubmit = () => {
//     const { message } = formData;

//     if (!message) {
//       setError('Please enter a message to translate.');
//       return;
//     }

//     translate();
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.sidebar}>
//         <Text style={styles.heading}>Models</Text>
//         {["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gemini-1.5-pro-001", "gemini-1.5-flash-001", "gemini-1.5-pro-002", "gemini-1.5-flash-002", "deepl"].map((model) => (
//           <TouchableOpacity
//             key={model}
//             style={[styles.modelOption, formData.model === model && styles.active]}
//             onPress={() => handleInputChange("model", model)}
//           >
//             <Text style={{ color: '#000000' }}>{model}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <View style={styles.main}>
//         <Text style={styles.title}>Translation App</Text>
//         <Text>Selected Model: {formData.model}</Text>

//         <Picker
//           selectedValue={formData.language}
//           onValueChange={(itemValue) => handleInputChange("language", itemValue)}
//           style={styles.picker} // Optionally add a style for the Picker
//         >
//           {supportedLanguages[formData.model]?.map((lang) => (
//             <Picker.Item key={lang} label={lang} value={lang} />
//           ))}
//         </Picker>

//         <TextInput
//           style={[styles.textInput, styles.inputMargin]} // Add margin style here
//           placeholder="Type your message here..."
//           value={formData.message}
//           onChangeText={(text) => handleInputChange("message", text)}
//         />

//         {error ? <Text style={styles.error}>{error}</Text> : null}

//         <Button title="Translate" onPress={handleOnSubmit} />

//         {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
//         <Text style={styles.translation}>{translation}</Text>

//         <Text style={styles.heading}>Previous Translations</Text>
//         {previousTranslations.map((item) => (
//           <View key={item.id} style={styles.translationItem}>
//             <Text>Original: {item.original_message}</Text>
//             <Text>Translated: {item.translated_message}</Text>
//             <Text>Language: {item.language}</Text>
//             <Text>Model: {item.model}</Text>
//             <Text>Date: {new Date(item.created_at).toLocaleString()}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     flexDirection: "row",
//     backgroundColor: "#000", // Set background to black
//   },
//   sidebar: {
//     width: "28%",
//     backgroundColor: "#1e1e1e", // Dark gray for sidebar
//     padding: 20,
//   },
//   main: {
//     width: "75%",
//     padding: 20,
//     backgroundColor: "#121212", // Slightly lighter gray for main area
//   },
//   heading: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 10,
//     color: "#ffffff", // White text for headings
//   },
//   modelOption: {
//     padding: 10,
//     borderWidth: 1,
//     borderColor: "#ddd", // Light gray border
//     marginBottom: 10,
//     backgroundColor: "#ffffff", // Darker gray for model options
//     borderRadius: 5, // Rounded corners
//   },
//   active: {
//     backgroundColor: "#FFFF00", // Blue for active model option
//   },
//   title: {
//     fontSize: 30,
//     fontWeight: "bold",
//     color: "#ffffff", // White text for titles
//   },
//   textInput: {
//     borderColor: "#ddd",
//     borderWidth: 1,
//     padding: 10,
//     marginBottom: 10,
//     backgroundColor: "#222222", // Dark background for text input
//     color: "#ffffff", // White text for input
//   },
//   inputMargin: {
//     marginTop: 20, // Space above the TextInput
//   },
//   error: {
//     color: "red", // Keep error text red for visibility
//   },
//   translation: {
//     fontSize: 18,
//     marginTop: 20,
//     color: "#ffffff", // White text for translations
//   },
//   translationItem: {
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "lightgray", // Light gray for borders
//     backgroundColor: "#333333", // Dark gray for translation items
//   },
//   button: {
//     backgroundColor: "#FFFF00", // Button background color (yellow)
//     padding: 15,
//     borderRadius: 5,
//     alignItems: 'center', // Center text horizontally
//     marginTop: 20, // Space above the button
//   },
//   buttonText: {
//     color: "#000000", // Button text color (black)
//     fontSize: 18, // Font size for button text
//   }});
// export default App;

// import React, { useState, useEffect } from 'react';
// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View, TouchableOpacity, TextInput, Button, ActivityIndicator, Alert } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { createClient } from '@supabase/supabase-js';
// import Constants from 'expo-constants';
// import { Configuration, OpenAIApi } from 'openai';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// // Initialize Supabase client
// const supabase = createClient(
//   Constants.expoConfig.extra.SUPABASE_URL,
//   Constants.expoConfig.extra.SUPABASE_KEY
// );

// // Initialize OpenAI client
// const openaiConfig = new Configuration({
//   apiKey: Constants.expoConfig.extra.OPENAI_API_KEY, // Ensure your API key is stored securely
// });
// const openai = new OpenAIApi(openaiConfig);

// const App = () => {
//   const [formData, setFormData] = useState({
//     model: 'gpt-3.5-turbo',
//     language: 'English',
//     message: '',
//   });
//   const [translation, setTranslation] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [previousTranslations, setPreviousTranslations] = useState([]);

//   const supportedLanguages = {
//     "gpt-3.5-turbo": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese"],
//     "gpt-4": ["Spanish", "French", "Telugu", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean"],
//     "gpt-4-turbo": ["Spanish", "French", "Telugu", "Japanese", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Korean", "Arabic"],
//     "gemini-1.5-pro-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)"],
//     "gemini-1.5-flash-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)"],
//     "gemini-1.5-pro-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean"],
//     "gemini-1.5-flash-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean", "Arabic"],
//     "deepl": ["Spanish", "French", "Japanese", "German", "Italian", "Dutch", "Russian", "Chinese (Simplified)", "Polish", "Portuguese"],
//   };

//   const handleInputChange = (name, value) => {
//     setFormData((prevData) => ({ ...prevData, [name]: value }));
//     setError('');
//   };

//   const fetchPreviousTranslations = async () => {
//     const { data, error } = await supabase
//       .from("translations")
//       .select("*")
//       .order("created_at", { ascending: false })
//       .limit(5);

//     if (error) {
//       console.error("Error fetching translations:", error);
//     } else {
//       setPreviousTranslations(data);
//     }
//   };

//   useEffect(() => {
//     fetchPreviousTranslations();
//   }, []);

//   const translate = async () => {
//     const { language, message, model } = formData;

//     if (!message) {
//       setError('Please enter a message to translate.');
//       return;
//     }

//     try {
//       setIsLoading(true);
//       let translatedText = '';

//       if (model.startsWith('gpt')) {
//         const response = await openai.createChatCompletion({
//           model: model,
//           messages: [
//             {
//               role: 'system',
//               content: `Translate this sentence into ${language}.`,
//             },
//             { role: 'user', content: message },
//           ],
//           temperature: 0.3,
//           max_tokens: 100,
//         });
//         translatedText = response.data.choices[0].message.content.trim();
//       } else if (model.startsWith('gemini')) {
//         const genAIModel = GoogleGenerativeAI.getGenerativeModel({
//           model: 'gemini-1.5-flash',
//         });
//         const prompt = `Translate the text: "${message}" into ${language}`;
//         const result = await genAIModel.generateContent(prompt);
//         translatedText = await result.response.text();
//       } else if (model === 'deepl') {
//         translatedText = await translateWithDeepL(message, language);
//       }

//       setTranslation(translatedText);
//       // Save the translation to Supabase
//       await supabase
//         .from('translations')
//         .insert([
//           {
//             original_message: message,
//             translated_message: translatedText,
//             language: language,
//             model: model,
//           },
//         ]);

//       // Fetch the latest translations after inserting
//       fetchPreviousTranslations();
//     } catch (error) {
//       console.error('Translation error:', error);
//       setError('Translation failed. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const translateWithDeepL = async (text, toLang) => {
//     const deepLLanguageCodes = {
//       Spanish: "ES",
//       French: "FR",
//       German: "DE",
//       Italian: "IT",
//       Dutch: "NL",
//       Russian: "RU",
//       "Chinese (Simplified)": "ZH",
//       Japanese: "JA",
//       Portuguese: "PT",
//       Polish: "PL",
//     };

//     try {
//       const targetLangCode = deepLLanguageCodes[toLang];
//       if (!targetLangCode) {
//         throw new Error(`Unsupported language: ${toLang}`);
//       }

//       const response = await fetch("https://api-free.deepl.com/v2/translate", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//         body: new URLSearchParams({
//           auth_key: Constants.expoConfig.extra.DEEPL_API_KEY,
//           text: text,
//           source_lang: "EN",
//           target_lang: targetLangCode,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`DeepL API request failed with status ${response.status}`);
//       }

//       const data = await response.json();
//       return data.translations[0].text;
//     } catch (error) {
//       console.error("DeepL Translation Error:", error);
//       throw new Error("Failed to translate with DeepL.");
//     }
//   };

//   const handleOnSubmit = () => {
//     translate();
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.sidebar}>
//         <Text style={styles.heading}>Models</Text>
//         {["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gemini-1.5-pro-001", "gemini-1.5-flash-001", "gemini-1.5-pro-002", "gemini-1.5-flash-002", "deepl"].map((model) => (
//           <TouchableOpacity
//             key={model}
//             style={[styles.modelOption, formData.model === model && styles.active]}
//             onPress={() => handleInputChange("model", model)}
//           >
//             <Text style={{ color: '#000000' }}>{model}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <View style={styles.main}>
//         <Text style={styles.title}>Translation App</Text>
//         <Text>Selected Model: {formData.model}</Text>

//         <Picker
//           selectedValue={formData.language}
//           onValueChange={(itemValue) => handleInputChange("language", itemValue)}
//           style={styles.picker}
//         >
//           {supportedLanguages[formData.model]?.map((lang) => (
//             <Picker.Item key={lang} label={lang} value={lang} />
//           ))}
//         </Picker>

//         <TextInput
//           style={[styles.textInput, styles.inputMargin]}
//           placeholder="Type your message here..."
//           value={formData.message}
//           onChangeText={(text) => handleInputChange("message", text)}
//         />

//         { error ? <Text style={styles.error}>{error}</Text> : null}

//         <Button title="Translate" onPress={handleOnSubmit} />

//         {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
//         <Text style={styles.translation}>{translation}</Text>

//         <Text style={styles.heading}>Previous Translations</Text>
//         {previousTranslations.map((item) => (
//           <View key={item.id} style={styles.translationItem}>
//             <Text>Original: {item.original_message}</Text>
//             <Text>Translated: {item.translated_message}</Text>
//             <Text>Language: {item.language}</Text>
//             <Text>Model: {item.model}</Text>
//             <Text>Date: {new Date(item.created_at).toLocaleString()}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     flexDirection: "row",
//     backgroundColor: "#000",
//   },
//   sidebar: {
//     width: "28%",
//     backgroundColor: "#1e1e1e",
//     padding: 20,
//   },
//   main: {
//     width: "75%",
//     padding: 20,
//     backgroundColor: "#121212",
//   },
//   heading: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 10,
//     color: "#ffffff",
//   },
//   modelOption: {
//     padding: 10,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     marginBottom: 10,
//     backgroundColor: "#ffffff",
//     borderRadius: 5,
//   },
//   active: {
//     backgroundColor: "#FFFF00",
//   },
//   title: {
//     fontSize: 30,
//     fontWeight: "bold",
//     color: "#ffffff",
//   },
//   textInput: {
//     borderColor: "#ddd",
//     borderWidth: 1,
//     padding: 10,
//     marginBottom: 10,
//     backgroundColor: "#222222",
//     color: "#ffffff",
//   },
//   inputMargin: {
//     marginTop: 20,
//   },
//   error: {
//     color: "red",
//   },
//   translation: {
//     fontSize: 18,
//     marginTop: 20,
//     color: "#ffffff",
//   },
//   translationItem: {
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "lightgray",
//     backgroundColor: "#333333",
//   },
// });

// export default App;

// 
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Button, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Configuration, OpenAIApi } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    "gpt-3.5-turbo": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese"],
    "gpt-4": ["Spanish", "French", "Telugu", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean"],
    "gpt-4-turbo": ["Spanish", "French", "Telugu", "Japanese", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Korean", "Arabic"],
    "gemini-1.5-pro-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)"],
    "gemini-1.5-flash-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)"],
    "gemini-1.5-pro-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean"],
    "gemini-1.5-flash-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean", "Arabic"],
    "deepl": ["Spanish", "French", "Japanese", "German", "Italian", "Dutch", "Russian", "Chinese (Simplified)", "Polish", "Portuguese"],
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
      Spanish: "ES",
      French: "FR",
      German: "DE",
      Italian: "IT",
      Dutch: "NL",
      Russian: "RU",
      "Chinese (Simplified)": "ZH",
      Japanese: "JA",
      Portuguese: "PT",
      Polish: "PL",
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
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.heading}>Models</Text>
        {["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gemini-1.5-pro-001", "gemini-1.5-flash-001", "gemini-1.5-pro-002", "gemini-1.5-flash-002", "deepl"].map((model) => (
          <TouchableOpacity
            key={model}
            style={[styles.modelOption, formData.model === model && styles.active]}
            onPress={() => handleInputChange("model", model)}
          >
            <Text style={{ color: '#000000' }}>{model}</Text>
          </TouchableOpacity>
        ))}
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

        {translation && (
          <View style={styles.translationContainer}>
            <Text style={styles.translationText}>Translation:</Text>
            <Text>{translation}</Text>
          </View>
        )}

        <View style={styles.previousTranslations}>
          <Text style={styles.previousTitle}>Previous Translations</Text>
          {previousTranslations.map((translation, index) => (
            <View key={index} style={styles.translationItem}>
              <Text>Original: {translation.original_message}</Text>
              <Text>Translated: {translation.translated_message}</Text>
              <Text>Language: {translation.language}</Text>
              <Text>Model: {translation.model}</Text>
            </View>
          ))}
        </View>
      </View>

      <StatusBar style="auto" />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
  },
  sidebar: {
    width: "28%",
    backgroundColor: "#f4f4f4",
    padding: 20,
  },
  main: {
    width: "75%",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modelOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  active: {
    backgroundColor: "#e0e0e0",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
  },
  textInput: {
    borderColor: "#ddd",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  error: {
    color: "red",
  },
  copyButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    marginTop: 10,
  },
  translation: {
    fontSize: 18,
    marginTop: 20,
  },
});


export default App;