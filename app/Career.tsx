import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView
} from 'react-native';

const CareerPaths = () => {
  const [activeField, setActiveField] = useState("Science and Technology");
  const [currentImage, setCurrentImage] = useState(0);

  // In React Native, we'll need to require images directly
  // You would need to add these image files to your assets directory
  const images = {
    science1: require('./assets/science1.jpg'),
    science2: require('./assets/science2.jpg'),
    science3: require('./assets/science3.jpg'),
    finance1: require('./assets/finance1.jpg'),
    finance2: require('./assets/finance2.jpg'),
    finance3: require('./assets/finance3.jpg'),
    engineering1: require('./assets/engineering1.jpg'),
    engineering2: require('./assets/engineering2.jpg'),
    engineering3: require('./assets/engineering3.jpg'),
    law1: require('./assets/law1.jpg'),
    law2: require('./assets/law2.jpg'),
    law3: require('./assets/law3.jpg'),
    educ1: require('./assets/educ1.jpg'),
    educ2: require('./assets/educ2.jpg'),
    educ3: require('./assets/educ3.jpg'),
    media1: require('./assets/media1.jpg'),
    media2: require('./assets/media2.jpg'),
    media3: require('./assets/media3.jpg'),
  };

  const careerData = {
    "Science and Technology": {
      title: "Science and Technology",
      description:
        "This field is for those passionate about research, innovation, and technological advancements. Careers in this field focus on scientific discoveries, technological development, and digital solutions.",
      careers: [
        { job: "Data Scientist", salary: "PHP 800,000 - PHP 1,500,000 per year" },
        { job: "Software Engineer", salary: "PHP 500,000 - PHP 1,200,000 per year" },
        { job: "Cybersecurity Analyst", salary: "PHP 600,000 - PHP 1,300,000 per year" },
        { job: "AI Specialist", salary: "PHP 900,000 - PHP 2,000,000 per year" },
        { job: "Robotics Engineer", salary: "PHP 700,000 - PHP 1,500,000 per year" },
        { job: "Biotechnologist", salary: "PHP 700,000 - PHP 1,400,000 per year" },
        { job: "Network Administrator", salary: "PHP 500,000 - PHP 1,000,000 per year" },
        { job: "IT Consultant", salary: "PHP 600,000 - PHP 1,200,000 per year" },
        { job: "Game Developer", salary: "PHP 500,000 - PHP 1,300,000 per year" },
        { job: "Quantum Computing Researcher", salary: "PHP 900,000 - PHP 2,500,000 per year" }
      ],
      images: [images.science1, images.science2, images.science3]
    },
    "Business and Finance": {
      title: "Business and Finance",
      description:
        "This field is ideal for individuals who are interested in financial management, entrepreneurship, and corporate leadership. It focuses on economic growth, investments, and business strategies.",
      careers: [
        { job: "Accountant", salary: "PHP 400,000 - PHP 900,000 per year" },
        { job: "Marketing Manager", salary: "PHP 500,000 - PHP 1,200,000 per year" },
        { job: "Financial Analyst", salary: "PHP 600,000 - PHP 1,300,000 per year" },
        { job: "Investment Banker", salary: "PHP 800,000 - PHP 2,500,000 per year" },
        { job: "Business Consultant", salary: "PHP 700,000 - PHP 1,500,000 per year" },
        { job: "Entrepreneur", salary: "Varies" },
        { job: "Real Estate Analyst", salary: "PHP 500,000 - PHP 1,100,000 per year" },
        { job: "Tax Consultant", salary: "PHP 600,000 - PHP 1,300,000 per year" },
        { job: "Supply Chain Manager", salary: "PHP 700,000 - PHP 1,600,000 per year" },
        { job: "E-commerce Specialist", salary: "PHP 600,000 - PHP 1,400,000 per year" }
      ],
      images: [images.finance1, images.finance2, images.finance3]
    },
    "Engineering": {
      title: "Engineering",
      description:
        "Engineering careers focus on designing, building, and maintaining structures, machines, and systems that contribute to various industries, including construction, technology, and manufacturing.",
      careers: [
        { job: "Civil Engineer", salary: "PHP 500,000 - PHP 1,200,000 per year" },
        { job: "Mechanical Engineer", salary: "PHP 600,000 - PHP 1,300,000 per year" },
        { job: "Electrical Engineer", salary: "PHP 700,000 - PHP 1,400,000 per year" },
        { job: "Chemical Engineer", salary: "PHP 600,000 - PHP 1,300,000 per year" },
        { job: "Aerospace Engineer", salary: "PHP 800,000 - PHP 2,000,000 per year" },
        { job: "Biomedical Engineer", salary: "PHP 700,000 - PHP 1,500,000 per year" },
        { job: "Structural Engineer", salary: "PHP 600,000 - PHP 1,200,000 per year" },
        { job: "Automotive Engineer", salary: "PHP 500,000 - PHP 1,200,000 per year" },
        { job: "Environmental Engineer", salary: "PHP 700,000 - PHP 1,400,000 per year" },
        { job: "Geotechnical Engineer", salary: "PHP 600,000 - PHP 1,300,000 per year" }
      ],
      images: [images.engineering1, images.engineering2, images.engineering3]
    },
    "Law and Politics": {
      title: "Law and Politics",
      description:
        "This field is for individuals interested in justice, governance, and legal systems. Careers in this area involve legal practice, public policy, and political leadership.",
      careers: [
        { job: "Lawyer", salary: "PHP 900,000 - PHP 2,500,000 per year" },
        { job: "Judge", salary: "PHP 1,200,000 - PHP 3,500,000 per year" },
        { job: "Public Policy Analyst", salary: "PHP 700,000 - PHP 1,500,000 per year" },
        { job: "Legislative Assistant", salary: "PHP 500,000 - PHP 1,200,000 per year" },
        { job: "Diplomat", salary: "PHP 900,000 - PHP 2,000,000 per year" },
        { job: "Legal Consultant", salary: "PHP 800,000 - PHP 1,800,000 per year" },
      ],
      images: [images.law1, images.law2, images.law3]
    },
    "Education": {
      title: "Education",
      description:
        "Education careers focus on teaching, curriculum development, and academic research, playing a crucial role in shaping future generations.",
      careers: [
        { job: "Teacher", salary: "PHP 400,000 - PHP 900,000 per year" },
        { job: "Professor", salary: "PHP 700,000 - PHP 1,800,000 per year" },
        { job: "School Administrator", salary: "PHP 800,000 - PHP 1,500,000 per year" },
        { job: "Curriculum Developer", salary: "PHP 600,000 - PHP 1,300,000 per year" },
        { job: "Educational Consultant", salary: "PHP 700,000 - PHP 1,400,000 per year" },
        { job: "Librarian", salary: "PHP 500,000 - PHP 1,000,000 per year" },
      ],
      images: [images.educ1, images.educ2, images.educ3]
    },
    "Media and Communications": {
      title: "Media and Communications",
      description:
        "This field is for creative individuals interested in journalism, public relations, and digital media. Careers focus on storytelling, broadcasting, and information dissemination.",
      careers: [
        { job: "Journalist", salary: "PHP 400,000 - PHP 1,200,000 per year" },
        { job: "Public Relations Specialist", salary: "PHP 500,000 - PHP 1,100,000 per year" },
        { job: "TV Producer", salary: "PHP 600,000 - PHP 1,500,000 per year" },
        { job: "Content Creator", salary: "PHP 500,000 - PHP 1,200,000 per year" },
        { job: "Social Media Manager", salary: "PHP 450,000 - PHP 1,000,000 per year" },
        { job: "Broadcast Journalist", salary: "PHP 600,000 - PHP 1,300,000 per year" },
      ],
      images: [images.media1, images.media2, images.media3]
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % careerData[activeField].images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeField]);

  const nextField = () => {
    const fields = Object.keys(careerData);
    const currentIndex = fields.indexOf(activeField);
    setActiveField(fields[(currentIndex + 1) % fields.length]);
    setCurrentImage(0);
  };

  const renderCareerItem = ({ item }) => (
    <View style={styles.careerItem}>
      <Text style={styles.careerJob}>{item.job}</Text>
      <Text style={styles.careerSalary}>{item.salary}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.spacer} />
        <View style={styles.careerContainer}>
          <Text style={styles.sectionTitle}>Explore Different Career Fields</Text>
          
          <View style={styles.careerContent}>
            <Text style={styles.fieldTitle}>{careerData[activeField].title}</Text>
            
            <View style={styles.carouselContainer}>
              <Image 
                source={careerData[activeField].images[currentImage]} 
                style={styles.careerImage} 
                resizeMode="cover"
              />
            </View>
            
            <Text style={styles.description}>{careerData[activeField].description}</Text>
            
            <Text style={styles.careersTitle}>Possible Careers and Salaries:</Text>
            
            <FlatList
              data={careerData[activeField].careers}
              renderItem={renderCareerItem}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.nextButton} onPress={nextField}>
              <Text style={styles.nextButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  spacer: {
    height: 20,
  },
  careerContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  careerContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  carouselContainer: {
    height: 200,
    width: '100%',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  careerImage: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#555',
  },
  careersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  careerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  careerJob: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  careerSalary: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  nextButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CareerPaths;