import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

const strandDescriptions = {
  STEM: "Science, Technology, Engineering, and Mathematics (STEM) is for students interested in scientific innovations, engineering, and technological advancements.",
  ABM: "The Accountancy, Business, and Management (ABM) strand is designed for students who aspire to become entrepreneurs and business professionals.",
  HUMSS: "The Humanities and Social Sciences (HUMSS) strand is perfect for students passionate about history, culture, and communication.",
  GAS: "The General Academic Strand (GAS) is for students who are still exploring their career path with a flexible curriculum.",
  "Home Economics": "The Home Economics (HE) strand focuses on skills-based training in hospitality, culinary arts, and caregiving.",
  ICT: "The Information and Communications Technology (ICT) strand is ideal for tech-savvy students interested in programming and digital arts.",
};

const careerPathways = {
  STEM: ["Medicine", "Engineering", "Architecture", "Data Science", "Research"],
  ABM: ["Entrepreneur", "Accountant", "Business Manager", "Financial Analyst", "Marketing"],
  HUMSS: ["Lawyer", "Journalist", "Psychologist", "Teacher", "Social Worker"],
  GAS: ["Public Administrator", "Education", "Government Service", "Management"],
  "Home Economics": ["Chef", "Hotel Manager", "Fashion Designer", "Event Planner"],
  ICT: ["Software Developer", "Web Designer", "Game Developer", "IT Support"],
};


const getPersonalizedMessage = (topStrand, secondStrand, thirdStrand) => {
  return `
  # Your Academic and Career Path: A Personalized Analysis

  ## Understanding Your Results
  
  Your assessment results indicate that your primary strength lies in the **${topStrand}** strand, with significant aptitude also showing in **${secondStrand}** and **${thirdStrand}**. This unique combination reflects your diverse talents and interests, creating a promising foundation for your academic journey.
  
  ## Your Primary Path: ${topStrand}
  
  Your high alignment with the ${topStrand} strand suggests that you possess the core traits and abilities valued in this field. Students who excel in ${topStrand} typically demonstrate ${getTraitsForStrand(topStrand)}.
  
  The curriculum will challenge and develop your ${getSkillsForStrand(topStrand)}. These skills are highly transferable and will serve you well regardless of your ultimate career choice.
  
  ## Complementary Strengths
  
  Your secondary alignment with ${secondStrand} adds valuable versatility to your profile. This complementary strength means you can approach ${topStrand} challenges with insights from the ${secondStrand} perspective, potentially leading to innovative solutions and approaches that purely ${topStrand}-focused students might miss.
  
  Similarly, your tertiary strength in ${thirdStrand} provides yet another dimension to your skill set. This multi-faceted capability is increasingly valued in today's interconnected world.
  
  ## Career Possibilities
  
  With your ${topStrand} foundation, career paths such as ${getTopCareersForStrand(topStrand).join(", ")} would be natural fits for your abilities. Your ${secondStrand} aptitude opens additional possibilities in ${getTopCareersForStrand(secondStrand).slice(0, 3).join(", ")}.
  
  ## Recommendations for Success
  
  1. **Core Focus**: Fully engage with the ${topStrand} curriculum to build your fundamental knowledge and skills.
  2. **Strategic Electives**: Consider electives that leverage your ${secondStrand} and ${thirdStrand} strengths.
  3. **Experiential Learning**: Seek internships, projects, or volunteer opportunities that let you apply your ${topStrand} skills in real-world settings.
  4. **Mentorship**: Connect with professionals who have successfully combined ${topStrand} with other interests.
  5. **Continuous Self-Assessment**: Your interests and goals may evolve; remain open to adjusting your path accordingly.
  
  Remember that this assessment is a starting point for exploration, not a rigid determination of your capabilities. Your unique combination of strengths gives you advantages that extend beyond any single strand classification.
  `;
};

const getTraitsForStrand = (strand) => {
  const traits = {
    STEM: "analytical thinking, problem-solving aptitude, and systematic approach to challenges",
    ABM: "business acumen, financial literacy, and leadership potential",
    HUMSS: "strong communication skills, empathy, and social awareness",
    GAS: "adaptability, balanced capabilities across multiple disciplines, and a holistic perspective",
    "Home Economics": "practical creativity, attention to detail, and service orientation",
    ICT: "technical problem-solving, digital literacy, and logical thinking",
    "Industrial Arts": "spatial awareness, practical problem-solving, and technical precision",
    "Agri-Fishery Arts": "environmental awareness, resource management skills, and practical scientific understanding",
    Cookery: "creativity with precision, sensory awareness, and attention to detail",
    "Performing Arts": "expressive capabilities, kinesthetic intelligence, and emotional depth",
    "Visual Arts": "visual creativity, aesthetic sensibility, and innovative thinking",
    "Media Arts": "visual storytelling ability, technical creativity, and communication skills",
    "Literary Arts": "verbal fluency, narrative thinking, and analytical reading skills",
    Sports: "physical coordination, team leadership, and performance under pressure"
  };
  return traits[strand] || "diverse skills and interests";
};

const getSkillsForStrand = (strand) => {
  const skills = {
    STEM: "quantitative reasoning, scientific methodology, and analytical capabilities",
    ABM: "financial analysis, organizational management, and strategic planning",
    HUMSS: "critical thinking, cultural competence, and effective communication",
    GAS: "interdisciplinary thinking, adaptability, and foundational knowledge across domains",
    "Home Economics": "service management, design thinking, and practical implementation",
    ICT: "computational thinking, technical problem-solving, and digital creation",
    "Industrial Arts": "technical drawing, mechanical reasoning, and hands-on construction",
    "Agri-Fishery Arts": "sustainable practices, biological systems management, and practical ecology",
    Cookery: "culinary techniques, food science principles, and sensory evaluation",
    "Performing Arts": "performance techniques, bodily-kinesthetic awareness, and emotional expression",
    "Visual Arts": "design principles, visual composition, and creative expression",
    "Media Arts": "multimedia storytelling, production techniques, and digital composition",
    "Literary Arts": "rhetorical skills, narrative construction, and critical analysis",
    Sports: "physical conditioning, strategic thinking, and teamwork dynamics"
  };
  return skills[strand] || "various academic and practical abilities";
};

const getTopCareersForStrand = (strand) => {
  return careerPathways[strand] || ["Various professional roles"];
};


const OverallResult = () => {
  const [chartData, setChartData] = useState(null);
  const [topChoices, setTopChoices] = useState([]);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    // Load user data
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    fetchUser();
    
    // Process stored prediction data
    const processData = async () => {
      const sources = {
        "predictions": "From Grades",
        "certprediction": "From Certificate",
        "pqprediction": "From Personal Questionnaire",
        "prediction_exam_jhs": "From Exam Results"
      };
      
      const allStrands = {};
      
      for (const [key, label] of Object.entries(sources)) {
        try {
          const storedData = await AsyncStorage.getItem(key);
          if (!storedData) continue;
          
          const data = JSON.parse(storedData);
          
          if (key === "predictions") {
            Object.entries(data).forEach(([strand, values]) => {
              if (values.percentage !== undefined) {
                const numericPercentage = parseFloat(values.percentage) || 0;
                allStrands[strand] = (allStrands[strand] || 0) + numericPercentage;
              }
            });
          } else if (key === "pqprediction" && data.predictionScores) {
            data.predictionScores.forEach(({ strand, score }) => {
              const numericScore = parseFloat(score) || 0;
              allStrands[strand] = (allStrands[strand] || 0) + numericScore;
            });
          } else {
            Object.entries(data).forEach(([strand, value]) => {
              const numericValue = parseFloat(value) || 0;
              allStrands[strand] = (allStrands[strand] || 0) + numericValue;
            });
          }
        } catch (error) {
          console.error(`Error processing ${key}:`, error);
        }
      }
      
      const sortedStrands = Object.entries(allStrands).sort((a, b) => b[1] - a[1]);
      setTopChoices(sortedStrands);
      
      if (sortedStrands.length > 0) {
        setChartData({
          labels: sortedStrands.slice(0, 5).map(([strand]) => strand),
          datasets: [
            {
              data: sortedStrands.slice(0, 5).map(([_, percentage]) => percentage),
            }
          ]
        });
      }
    };
    
    processData();
  }, []);

  const sendEmail = async () => {
    try {
      if (!user || !user.email) {
        Alert.alert("Error", "User email not found!");
        return;
      }
      
      await axios.post("http://192.168.100.171:4000/api/auth/send-prediction-email", {
        email: user.email,
        topChoices: topChoices.slice(0, 3),
      });
      
      Alert.alert("Success", "Your prediction report has been sent to your email!");
    } catch (error) {
      console.error("Error sending email:", error);
      Alert.alert("Error", "Failed to send email. Please try again later.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Senior High School Strand Prediction</Text>
        {user && <Text style={styles.subtitle}>Student: {user.name || "Anonymous"}</Text>}
        <Text style={styles.date}>Generated on: {new Date().toLocaleDateString()}</Text>
      </View>
      
      {topChoices.length > 0 ? (
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Top Recommendations</Text>
          
          {topChoices.slice(0, 3).map(([strand, score], index) => (
            <View key={strand} style={[styles.card, index === 0 && styles.primaryCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.rankBadge}>{index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}</Text>
                <Text style={styles.strandName}>{strand}</Text>
                <Text style={styles.score}>{score.toFixed(1)}%</Text>
              </View>
              <Text style={styles.description}>{strandDescriptions[strand] || ""}</Text>
              <Text style={styles.careerTitle}>Career Paths:</Text>
              <Text style={styles.careerPaths}>
                {careerPathways[strand]?.slice(0, 3).join(", ")}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.loading}>Loading results...</Text>
      )}
      
      {chartData && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Overall Strand Compatibility</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </View>
      )}
      
      <View style={styles.nextSteps}>
        <Text style={styles.sectionTitle}>Next Steps</Text>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review Your Results</Text>
            <Text style={styles.stepText}>Consider how they align with your interests and goals.</Text>
          </View>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Research Each Strand</Text>
            <Text style={styles.stepText}>Learn more about curriculum and requirements.</Text>
          </View>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Speak with Guidance Counselors</Text>
            <Text style={styles.stepText}>Get personalized advice about your options.</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={sendEmail}>
          <Text style={styles.buttonText}>Send to My Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push("Dashboard")}>
          <Text style={styles.buttonText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Important Note</Text>
        <Text style={styles.disclaimerText}>
          This assessment is based on your responses and academic records. While designed to provide guidance, 
          it should be considered as one of many factors in your decision-making process.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  summaryContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#3498db',
  },
  primaryCard: {
    backgroundColor: '#e8f4fd',
    borderLeftColor: '#2980b9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankBadge: {
    backgroundColor: '#3498db',
    color: 'white',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  strandName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  careerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  careerPaths: {
    fontSize: 14,
    color: '#555',
  },
  loading: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  nextSteps: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  stepNumber: {
    backgroundColor: '#3498db',
    color: 'white',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 15,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  stepText: {
    fontSize: 14,
    color: '#555',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    marginTop: 10,
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#555',
  },
});

export default OverallResult;