import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Configuration, OpenAIApi } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabase = createClient(
  Constants.expoConfig.extra.SUPABASE_URL,
  Constants.expoConfig.extra.SUPABASE_KEY
);

const App = () => {
  const [formData, setFormData] = useState({
    toLanguage: "Spanish",
    message: "",
    model: "gemini-1.5-flash-002",
    temperatureValue: 0.3,
  });
  const [error, setError] = useState("");
  const [translation, setTranslation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previousTranslations, setPreviousTranslations] = useState([]);

  const googleGenAI = new GoogleGenerativeAI(
    Constants.expoConfig.extra.GOOGLE_API_KEY
  );
  const configuration = new Configuration({
    apiKey: Constants.expoConfig.extra.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

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
    Swedish: "SV",
    Arabic: "AR",
    Turkish: "TR",
    Korean: "KO",
    Hindi: "HI",
    Greek: "EL",
    Hebrew: "HE",
    Thai: "TH",
    Vietnamese: "VI",
    Indonesian: "ID",
    Malay: "MS",
  };

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const translateWithDeepL = async (text, toLang) => {
    try {
      const targetLangCode = deepLLanguageCodes[toLang];
      if (!targetLangCode) {
        throw new Error(`Unsupported language: ${toLang}`);
      }

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
        throw new Error(
          `DeepL API request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      console.error("DeepL Translation Error:", error);
      throw new Error("Failed to translate with DeepL.");
    }
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
    const { toLanguage, message, model } = formData;
    try {
      setIsLoading(true);
      let translatedText = "";

      if (model.startsWith("gpt")) {
        const response = await openai.createChatCompletion({
          model: model,
          messages: [
            {
              role: "system",
              content: `Translate this sentence into ${toLanguage}.`,
            },
            { role: "user", content: message },
          ],
          temperature: formData.temperatureValue,
          max_tokens: 100,
        });
        translatedText = response.data.choices[0].message.content.trim();
      } else if (model.startsWith("gemini")) {
        const genAIModel = googleGenAI.getGenerativeModel({ model });
        const prompt = `Translate the text: "${message}" from English to ${toLanguage}.`;
        const result = await genAIModel.generateContent(prompt);
        translatedText = await result.response.text();
      } else if (model === "deepl") {
        translatedText = await translateWithDeepL(message, toLanguage);
      }

      setTranslation(translatedText);
    } catch (error) {
      console.error("Translation Error:", error);
      setError("Translation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnSubmit = () => {
    if (!formData.message) {
      setError("Please enter the message.");
      return;
    }
    translate();
  };

  const handleCopy = () => {
    Alert.alert("Copied to clipboard!", translation);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Translation App</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message here..."
          value={formData.message}
          onChangeText={(text) => handleInputChange("message", text)}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Translate" onPress={handleOnSubmit} />
      </View>

      {isLoading ? <Text>Loading...</Text> : <Text>{translation}</Text>}

      <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
        <Text style={styles.copyButtonText}>Copy to clipboard</Text>
      </TouchableOpacity>

      <FlatList
        data={previousTranslations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.translationItem}>
            <Text>Original: {item.original_message}</Text>
            <Text>Translated: {item.translated_message}</Text>
            <Text>Language: {item.language}</Text>
            <Text>Model: {item.model}</Text>
            <Text>Date: {new Date(item.created_at).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  error: {
    color: "red",
  },
  copyButton: {
    backgroundColor: "lightblue",
    padding: 10,
    borderRadius: 4,
    marginVertical: 10,
  },
  copyButtonText: {
    textAlign: "center",
    fontWeight: "bold",
  },
  translationItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "lightgray",
  },
});

export default App;
