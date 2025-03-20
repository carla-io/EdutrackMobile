import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  FlatList
} from 'react-native';
// Assuming you have a React Native version of this

// Import assets - in React Native you would typically import like this
// Note: You'll need to ensure these images are available in your assets folder
const testtube = require('./assets/testtube.png');
const businessIcon = require('./assets/business.png');
const humanitiesIcon = require('./assets/humanities.png');
const generalIcon = require('./assets/general.png');
const tvlIcon = require('./assets/tvl.png');

const Stem = () => {
  const [activeStrand, setActiveStrand] = useState("STEM");

  const nextStrand = () => {
    if (activeStrand === "STEM") setActiveStrand("ABM");
    else if (activeStrand === "ABM") setActiveStrand("HUMSS");
    else if (activeStrand === "HUMSS") setActiveStrand("GAS");
    else if (activeStrand === "GAS") setActiveStrand("TVL");
    else setActiveStrand("STEM"); // Reset to STEM after TVL
  };

  const strandData = {
    STEM: {
      title: "STEM (Science, Technology, Engineering, and Mathematics)",
      description:
        "The STEM strand is designed for students who are interested in science, technology, engineering, and mathematics-related fields. It strengthens problem-solving, critical thinking, and analytical skills, which are essential for careers in research, medicine, and technology.",
      courses: [
        "Engineering (Civil, Mechanical, Electrical, etc.)",
        "Computer Science",
        "Information Technology",
        "Architecture",
        "Nursing",
        "Medicine",
        "Pharmacy",
        "Biology",
        "Physics",
        "Mathematics",
      ],
      icon: testtube,
    },
    ABM: {
      title: "ABM (Accountancy, Business, and Management)",
      description:
        "The ABM strand is designed for students who are interested in business, finance, entrepreneurship, and management. This strand focuses on developing skills in financial management, business planning, marketing strategies, and leadership—perfect for those who dream of starting their own business or managing a company in the future.",
      courses: [
        "Accountancy",
        "Business Administration",
        "Entrepreneurship",
        "Marketing Management",
        "Hospitality and Tourism Management",
        "Financial Management",
        "Human Resource Management",
        "Economics",
        "Customs Administration",
      ],
      icon: businessIcon,
    },
    HUMSS: {
      title: "HUMSS (Humanities and Social Sciences)",
      description:
        "The HUMSS strand is for students who are passionate about social sciences, communication, politics, and public service. It focuses on developing skills in critical thinking, research, and communication, preparing students for careers in governance, education, media, and law.",
      courses: [
        "Political Science",
        "Communication Arts",
        "Journalism",
        "Psychology",
        "Sociology",
        "Philosophy",
        "International Studies",
        "Criminology",
        "Public Administration",
        "Education",
      ],
      icon: humanitiesIcon,
    },
    GAS: {
      title: "GAS (General Academic Strand)",
      description:
        "The GAS strand is ideal for students who are still undecided about their future career path. It offers a broad and flexible curriculum that includes business, humanities, social sciences, and education-related subjects, providing students with diverse career options.",
      courses: [
        "Education (Elementary, Secondary, Special Education)",
        "Communication Arts",
        "Political Science",
        "Public Administration",
        "Psychology",
        "Tourism Management",
        "Business Administration",
        "Entrepreneurship",
        "Criminology",
      ],
      icon: generalIcon,
    },
    TVL: {
      title: "TVL (Technical-Vocational-Livelihood)",
      description:
        "The TVL strand is for students who want to develop practical skills for employment, business, or specialized trades. It focuses on hands-on learning in various technical fields, preparing students for certifications and job opportunities right after SHS.",
      courses: [
        "Culinary Arts",
        "Hospitality Management",
        "Tourism Management",
        "Information Technology",
        "Automotive Technology",
        "Electrical Engineering Technology",
        "Electronics Technology",
        "Welding and Fabrication Technology",
        "Garments and Fashion Design",
        "Agriculture and Fisheries",
      ],
      icon: tvlIcon,
    },
  };

  // Rendering a list item for courses
  const renderCourseItem = ({ item }) => (
    <View style={styles.listItemContainer}>
      <Text style={styles.listItem}>• {item}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.stemContainer}>
          <Text style={styles.sectionTitle}>Get to know about the Senior High Strands</Text>
          
          <View style={styles.stemContent}>
            <Text style={styles.strandTitle}>{strandData[activeStrand].title}</Text>
            <Text style={styles.description}>{strandData[activeStrand].description}</Text>
            
            <Text style={styles.coursesTitle}>Possible College Courses:</Text>
            <FlatList
              data={strandData[activeStrand].courses}
              renderItem={renderCourseItem}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false} // Disable scrolling within the FlatList as we're using a ScrollView parent
            />
          </View>
          
          <View style={styles.imageContainer}>
            <Image 
              source={strandData[activeStrand].icon} 
              style={styles.icon} 
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={nextStrand}
            >
              <Text style={styles.buttonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  stemContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  stemContent: {
    marginBottom: 20,
  },
  strandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'maroon',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    color: '#444',
  },
  coursesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  listItemContainer: {
    marginLeft: 10,
    marginBottom: 6,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  icon: {
    width: 150,
    height: 150,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  nextButton: {
    backgroundColor: 'maroon',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Stem;