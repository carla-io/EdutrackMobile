import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Dimensions
} from 'react-native';
 // Assuming you have a React Native version

// Import assets
// Note: You'll need to ensure these images are in your assets folder
const eng1 = require('./assets/eng1.webp');
const eng2 = require('./assets/eng2.jpg');
const eng3 = require('./assets/eng3.jpg');
const eng4 = require('./assets/eng4.jpg');
const health1 = require('./assets/health1.jpg');
const health2 = require('./assets/health2.jpg');
const health3 = require('./assets/health3.jpg');
const health4 = require('./assets/health4.jpg');
const business1 = require('./assets/business1.jpg');
const business2 = require('./assets/business2.jpg');
const business3 = require('./assets/business3.jpg');
const business4 = require('./assets/business4.jpg');
const humanities1 = require('./assets/humanities1.jpg');
const humanities2 = require('./assets/humanities2.jpg');
const humanities3 = require('./assets/humanities4.jpg');
const humanities4 = require('./assets/humanities3.jpg');
const it1 = require('./assets/it1.jpg');
const it2 = require('./assets/it2.jpg');
const it3 = require('./assets/it3.jpg');
const it4 = require('./assets/it4.jpg');

const { width } = Dimensions.get('window');

const CollegeCourses = () => {
  const [activeCategory, setActiveCategory] = useState("Engineering");
  const [currentImage, setCurrentImage] = useState(0);

  const courseData = {
    "Engineering": {
      description: "Engineering courses focus on applying scientific and mathematical principles to design, build, and innovate technology, infrastructure, and machines. Students gain expertise in problem-solving, project management, and advanced technical skills.",
      courses: [
        "Civil Engineering",
        "Mechanical Engineering",
        "Electrical Engineering",
        "Computer Engineering",
        "Chemical Engineering",
        "Aerospace Engineering",
        "Industrial Engineering",
        "Biomedical Engineering",
        "Environmental Engineering",
      ],
      images: [eng1, eng2, eng3, eng4],
    },
    "Health Sciences": {
      description: "Health Sciences prepare students for careers in medicine, nursing, and allied health fields, focusing on human health and wellness.",
      courses: [
        "Medicine",
        "Nursing",
        "Pharmacy",
        "Medical Technology",
        "Physical Therapy",
        "Dentistry",
        "Occupational Therapy",
        "Radiologic Technology",
        "Public Health",
      ],
      images: [health1, health2, health3, health4],
    },
    "Business and Management": {
      description: "Business and Management courses equip students with knowledge in entrepreneurship, finance, marketing, and corporate leadership.",
      courses: [
        "Accountancy",
        "Business Administration",
        "Entrepreneurship",
        "Marketing Management",
        "Human Resource Management",
        "Financial Management",
        "International Business",
        "Supply Chain Management",
        "Economics",
      ],
      images: [business1, business2, business3, business4],
    },
    "Humanities and Social Sciences": {
      description: "This field focuses on society, culture, communication, and governance, preparing students for careers in education, law, and public service.",
      courses: [
        "Political Science",
        "Psychology",
        "Journalism",
        "Communication Arts",
        "Philosophy",
        "Public Administration",
        "Sociology",
        "International Studies",
        "History",
      ],
      images: [humanities1, humanities2, humanities3, humanities4],
    },
    "Information Technology": {
      description: "IT courses involve computing, programming, cybersecurity, and systems development, leading to careers in tech and innovation.",
      courses: [
        "Computer Science",
        "Information Technology",
        "Software Engineering",
        "Data Science",
        "Cybersecurity",
        "Game Development",
        "Artificial Intelligence",
        "Cloud Computing",
        "Blockchain Technology",
      ],
      images: [it1, it2, it3, it4],
    },
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % courseData[activeCategory].images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeCategory, courseData]);

  const nextCategory = () => {
    const categories = Object.keys(courseData);
    const currentIndex = categories.indexOf(activeCategory);
    setActiveCategory(categories[(currentIndex + 1) % categories.length]);
    setCurrentImage(0);
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
        <View style={styles.collegeContainer}>
          <Text style={styles.sectionTitle}>Get to Know the College Courses</Text>
          
          <View style={styles.collegeContent}>
            <Text style={styles.categoryTitle}>{activeCategory}</Text>
            <Text style={styles.description}>{courseData[activeCategory].description}</Text>
            
            <Text style={styles.coursesTitle}>Popular Courses:</Text>
            <FlatList
              data={courseData[activeCategory].courses}
              renderItem={renderCourseItem}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false} // Disable scrolling within the FlatList
            />
            
            <View style={styles.carouselContainer}>
              <Image
                source={courseData[activeCategory].images[currentImage]}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={nextCategory}
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
  collegeContainer: {
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
  collegeContent: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'maroon',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    color: '#444',
    textAlign: 'justify',
  },
  coursesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'maroon',
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
  carouselContainer: {
    alignItems: 'center',
    marginVertical: 20,
    height: 200,
    overflow: 'hidden',
    borderRadius: 8,
  },
  carouselImage: {
    width: width - 64, // Full width minus padding
    height: 200,
    borderRadius: 8,
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

export default CollegeCourses;