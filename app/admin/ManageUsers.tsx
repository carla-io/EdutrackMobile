import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://192.168.100.171:4000/api/auth/get-all-users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        Toast.show({ type: 'error', text1: 'Failed to fetch users.' });
      }
    };
    fetchUsers();
  }, []);

  const archiveUser = async (id) => {
    try {
      await axios.put(`http://192.168.100.171:4000/api/auth/archive/${id}`);
      setUsers(users.map(user => user._id === id ? { ...user, isArchived: true } : user));
      Toast.show({ type: 'success', text1: 'User archived successfully.' });
    } catch (error) {
      console.error('Error archiving user:', error);
      Toast.show({ type: 'error', text1: 'Failed to archive user.' });
    }
  };

  const unarchiveUser = async (id) => {
    try {
      await axios.put(`http://192.168.100.171:4000/api/auth/restore/${id}`);
      setUsers(users.map(user => user._id === id ? { ...user, isArchived: false } : user));
      Toast.show({ type: 'success', text1: 'User unarchived successfully.' });
    } catch (error) {
      console.error('Error unarchiving user:', error);
      Toast.show({ type: 'error', text1: 'Failed to unarchive user.' });
    }
  };

  const confirmArchive = (id, isArchived) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${isArchived ? 'unarchive' : 'archive'} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => (isArchived ? unarchiveUser(id) : archiveUser(id)) }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.name}</Text>
      <Text style={styles.cell}>{item.email}</Text>
      <Text style={styles.cell}>{item.gradeLevel}</Text>
      <Text style={styles.cell}>{item.role}</Text>
      <Text style={styles.cell}>{item.isArchived ? 'Archived' : 'Active'}</Text>
      <TouchableOpacity
        style={[styles.button, item.isArchived ? styles.restore : styles.archive]}
        onPress={() => confirmArchive(item._id, item.isArchived)}
      >
        <Text style={styles.buttonText}>{item.isArchived ? 'Unarchive' : 'Archive'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id.toString()}
        renderItem={renderItem}
      />
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 5, borderBottomWidth: 1, borderColor: '#ccc' },
  cell: { flex: 1, textAlign: 'center' },
  button: { padding: 5, borderRadius: 5, alignItems: 'center' },
  archive: { backgroundColor: 'red' },
  restore: { backgroundColor: 'green' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});

export default ManageUsers;
