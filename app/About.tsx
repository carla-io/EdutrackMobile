import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { Video } from 'expo-av'; // You'll need to install expo-av

// Import icons from react-native-vector-icons
// You'll need to install this package: npm install react-native-vector-icons
import Icon from 'react-native-vector-icons/FontAwesome';

// Import images
// Note: You'll need to ensure these images are in your assets folder
const bookImage = require('./assets/books-icon.jpg');
const advertVideo = require('./assets/advert.mp4');

// Team member images
const charlesImage = require('./assets/charles.png');
const christianImage = require('./assets/chan.jpg');
const carlaImage = require('./assets/carla.jpg');
const johnImage = require('./assets/josue.jpg');
const advisers = require('./assets/adviser.jpg');

// Guide images
const Image1 = require('./assets/1.png');
const Image2 = require('./assets/2.png');
const Image3 = require('./assets/3.png');
const Image4 = require('./assets/4.png');
const Image5 = require('./assets/5.png');

const { width } = Dimensions.get('window');

// Team member data
const teamMembers = [
  {
    name: "CHARLES DERICK BULANTE",
    role: "Documentation / UI Design Developer",
    image: charlesImage,
  },
  {
    name: "CHRISTIAN SALAGUBANG",
    role: "Leader, Documentation, UI Design / Frontend Developer",
    image: christianImage,
  },
  {
    name: "CARLA DASAL",
    role: "Full Stack Developer",
    image: carlaImage,
  },
  {
    name: "JOHN LAWRENCE JOSUE",
    role: "Full Stack Developer",
    image: johnImage,
  },
];

const adviser = [
  {
    name: "POPS V. MADRIAGA",
    role: "",
    image: advisers,
  },
];

const About = () => {
  return (
    <SafeAreaView style={styles.container}>
    
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.aboutContainer}>
          {/* What is EduTracker Section */}
          <View style={styles.aboutContent}>
            <View style={styles.textContent}>
              <Text style={styles.heading}>What is EDUTRACKER?</Text>
              <Text style={styles.paragraph}>
                Welcome to EduTracker, your ultimate partner in shaping brighter futures! 
                We are a cutting-edge predictive analysis platform designed to empower students 
                in discovering their ideal strands, courses, and career paths. With innovative 
                features like results tracking, Gmail notifications, image processing for grades 
                and certificates, and engaging quizzes, we aim to simplify and enhance your 
                educational journey.
              </Text>
              <Text style={styles.paragraph}>
                At EduTracker, we believe every student deserves personalized guidance to unlock 
                their full potential. By combining technology with a passion for learning, 
                we help you make informed decisions and confidently navigate your path to success. 
                Your future starts here with EduTracker!
              </Text>
            </View>

            <View style={styles.imageContainer}>
              <Image source={bookImage} style={styles.bookImage} resizeMode="contain" />
            </View>
          </View>

          {/* Mission & Vision Section */}
          <View style={styles.missionVisionContainer}>
            <Text style={styles.sectionTitle}>Mission & Vision</Text>
            <View style={styles.divider}></View>

            <View style={styles.missionVisionContent}>
              <View style={styles.contactItem}>
                <Icon name="flag" size={30} color="maroon" style={styles.contactIcon} />
                <Text style={styles.contactHeader}>Our Mission</Text>
                <Text style={styles.contactSubtext}>
                  To provide students with an innovative and accessible platform that guides
                  them in making informed educational and career decisions, utilizing AI-driven
                  predictive analysis and personalized recommendations.
                </Text>
              </View>
              
              <View style={styles.verticalLine}></View>
              
              <View style={styles.contactItem}>
                <Icon name="lightbulb-o" size={30} color="maroon" style={styles.contactIcon} />
                <Text style={styles.contactHeader}>Our Vision</Text>
                <Text style={styles.contactSubtext}>
                  To be the leading educational technology platform that empowers students
                  worldwide, shaping a future where every learner confidently pursues their
                  passion and potential with clarity and direction.
                </Text>
              </View>
            </View>
          </View>

          {/* Video Container */}
          <View style={styles.videoContainer}>
            <View style={styles.videoFrame}>
              <Video
                source={advertVideo}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="cover"
                shouldPlay={false}
                useNativeControls
                style={styles.advertVideo}
              />
            </View>
          </View>

          {/* What Our Website Offers Section */}
          <View style={styles.websiteOffers}>
            <Text style={styles.sectionTitle}>WHAT OUR WEBSITE OFFERS...</Text>

            <View style={styles.offerItem}>
              <Icon name="bullseye" size={30} color="#2a65b3" style={styles.offerIcon} />
              <View style={styles.offerText}>
                <Text style={styles.offerTitle}>Smart Career and Course Prediction</Text>
                <Text style={styles.offerDescription}>
                  Take our AI-powered quizzes and upload your grades—we analyze 
                  your strengths to suggest the best senior high school strand, 
                  college course, or career path that suits you.
                </Text>
              </View>
            </View>

            <View style={styles.offerItem}>
              <Icon name="camera" size={30} color="#2a65b3" style={styles.offerIcon} />
              <View style={styles.offerText}>
                <Text style={styles.offerTitle}>Grades and Seminar Image Processing</Text>
                <Text style={styles.offerDescription}>
                  Simply upload images of your grades or certificates, and our system 
                  will process the data to refine your recommendations. No need for 
                  manual input!
                </Text>
              </View>
            </View>

            <View style={styles.offerItem}>
              <Icon name="gamepad" size={30} color="#2a65b3" style={styles.offerIcon} />
              <View style={styles.offerText}>
                <Text style={styles.offerTitle}>Interactive and Easy-to-Use!</Text>
                <Text style={styles.offerDescription}>
                  Our platform is designed for students, making career exploration 
                  fun, engaging, and hassle-free! Start your journey today and 
                  let's unlock your future together!
                </Text>
              </View>
            </View>
          </View>

          {/* Platform Guide Section */}
          <View style={styles.platformGuide}>
            <Text style={styles.sectionTitle}>HOW TO USE OUR PLATFORM</Text>
            
            <View style={styles.guideSteps}>
              <View style={styles.guideStep}>
                <Image source={Image1} style={styles.guideImage} resizeMode="contain" />
                <View style={styles.guideText}>
                  <Text style={styles.guideTitle}>Select the Right Portal</Text>
                  <Text style={styles.guideDescription}>
                    Choose your educational level to start predicting your future path—whether it's a Senior High School strand, College course, or Career.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <Image source={Image2} style={styles.guideImage} resizeMode="contain" />
                <View style={styles.guideText}>
                  <Text style={styles.guideTitle}>Upload Your Grades</Text>
                  <Text style={styles.guideDescription}>
                    Submit a clear image or file of your grades in PNG, JPG, JPEG, or PDF format to help personalize your recommendations.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <Image source={Image3} style={styles.guideImage} resizeMode="contain" />
                <View style={styles.guideText}>
                  <Text style={styles.guideTitle}>Upload Certificates</Text>
                  <Text style={styles.guideDescription}>
                    Add up to 10 seminar or school-related certificates in JPEG, JPG, or PNG formats to further refine your prediction results.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <Image source={Image4} style={styles.guideImage} resizeMode="contain" />
                <View style={styles.guideText}>
                  <Text style={styles.guideTitle}>Answer Personal Questions</Text>
                  <Text style={styles.guideDescription}>
                    Complete a series of personal questions to gain deeper insights into your strengths and preferences for better recommendations.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <Image source={Image5} style={styles.guideImage} resizeMode="contain" />
                <View style={styles.guideText}>
                  <Text style={styles.guideTitle}>Take Subject-Based Exams</Text>
                  <Text style={styles.guideDescription}>
                    Assess your knowledge and skills through exams that help refine and personalize your future predictions.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Education Importance Section */}
          <View style={styles.educationImportance}>
            <Text style={styles.sectionTitle}>Why Choosing Your Future Education Matters</Text>
            <Text style={styles.paragraph}>
              Your education is more than just a diploma—it's the foundation of your future. Every course, 
              every subject, and every decision you make today shapes the opportunities you will have 
              tomorrow. Choosing the right educational path isn't just about getting a degree; it's about 
              discovering your strengths, passions, and the career that will bring you fulfillment.
            </Text>
            <Text style={styles.paragraph}>
              In today's fast-changing world, industries evolve rapidly, and new career paths emerge every year. 
              That's why making an informed choice about your education is crucial. By selecting the right 
              Senior High School strand or College course, you are setting yourself up for a career that matches 
              your skills and interests, increasing your chances of success and job satisfaction.
            </Text>
            <Text style={styles.paragraph}>
              Moreover, investing in the right education opens doors to better career opportunities, 
              financial stability, and personal growth. It enhances your ability to adapt to new challenges, 
              think critically, and contribute meaningfully to society. Whether you dream of becoming a doctor, 
              engineer, artist, or entrepreneur, the right education provides you with the tools to turn those 
              dreams into reality.
            </Text>
            <Text style={styles.paragraph}>
              At EduTracker, we understand that choosing your future education can feel overwhelming. That's 
              why we provide personalized guidance, predictive analysis, and career insights to help you make 
              the best decision. Remember, your future starts with the choices you make today—so take the time 
              to explore, evaluate, and choose wisely. Your education is your greatest investment, and it will 
              shape the life you build for yourself.
            </Text>
          </View>

          {/* Class Adviser Section */}
          <View style={styles.teamSection}>
            <Text style={styles.sectionTitle}>CLASS ADVISER</Text>
            <View style={styles.teamMembers}>
              {adviser.map((member, index) => (
                <View key={index} style={styles.teamMember}>
                  <Image source={member.image} style={styles.teamImage} resizeMode="cover" />
                  <Text style={styles.teamName}>{member.name}</Text>
                  <Text style={styles.teamRole}>{member.role}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Meet the Team Section */}
          <View style={styles.teamSection}>
            <Text style={styles.sectionTitle}>MEET THE TEAM</Text>
            <View style={styles.teamMembers}>
              {teamMembers.map((member, index) => (
                <View key={index} style={styles.teamMember}>
                  <Image source={member.image} style={styles.teamImage} resizeMode="cover" />
                  <Text style={styles.teamName}>{member.name}</Text>
                  <Text style={styles.teamRole}>{member.role}</Text>
                </View>
              ))}
            </View>
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
  },
  aboutContainer: {
    padding: 16,
  },
  aboutContent: {
    flexDirection: 'column',
    marginBottom: 30,
  },
  textContent: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: 'maroon',
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    color: '#444',
    textAlign: 'justify',
  },
  imageContainer: {
    alignItems: 'center',
  },
  bookImage: {
    width: width - 32,
    height: 200,
    borderRadius: 8,
  },
  missionVisionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: 'maroon',
  },
  divider: {
    height: 2,
    backgroundColor: '#ddd',
    marginBottom: 20,
  },
  missionVisionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  verticalLine: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  contactIcon: {
    marginBottom: 10,
  },
  contactHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  contactSubtext: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: '#444',
  },
  videoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  videoFrame: {
    width: width - 32,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  advertVideo: {
    width: '100%',
    height: '100%',
  },
  websiteOffers: {
    marginBottom: 30,
  },
  offerItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  offerIcon: {
    marginRight: 15,
  },
  offerText: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  offerDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
  },
  platformGuide: {
    marginBottom: 30,
  },
  guideSteps: {
    marginTop: 10,
  },
  guideStep: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  guideImage: {
    width: 80,
    height: 80,
    marginRight: 15,
    borderRadius: 8,
  },
  guideText: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  guideDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
  },
  educationImportance: {
    marginBottom: 30,
  },
  teamSection: {
    marginBottom: 30,
  },
  teamMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  teamMember: {
    width: width / 2 - 32,
    marginBottom: 20,
    alignItems: 'center',
  },
  teamImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  teamRole: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
});

export default About;