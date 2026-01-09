import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Button,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { readAgendas, writeAgendas } from '../storage/fileStore';

export default function AgendaScreen() {
  const [agendas, setAgendas] = useState([]);
  const [counter, setCounter] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editLocation, setEditLocation] = useState('');
  const [editDateTime, setEditDateTime] = useState('');

  const router = useRouter();

  useEffect(() => {
    (async () => {
      const stored = await readAgendas();
      setAgendas(stored);
      const maxId = stored.reduce((m, i) => Math.max(m, Number(i.id)), 0);
      setCounter(maxId + 1);
    })();
  }, []);

  useEffect(() => {
    if (agendas.length) writeAgendas(agendas);
  }, [agendas]);

  const addAgenda = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB') + ' – ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newItem = { id: counter.toString(), location: `Location ${counter}`, dateTime: dateStr };
    setAgendas([...agendas, newItem]);
    setCounter(counter + 1);
  };

  const openGoals = (item) => {
    router.push({ pathname: '/goals', params: { location: JSON.stringify(item) } });
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setEditLocation(item.location);
    setEditDateTime(item.dateTime);
    setModalVisible(true);
  };

  const saveEdit = () => {
    setAgendas(prev =>
      prev.map(it =>
        it.id === editingItem.id
          ? { ...it, location: editLocation.trim(), dateTime: editDateTime.trim() }
          : it
      )
    );
    setModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => openGoals(item)} style={{ flex: 1 }}>
        <Text style={styles.loc}>📍 {item.location}</Text>
        <Text style={styles.dt}>{item.dateTime}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
        <Text style={styles.editTxt}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agenda for Today</Text>

      <FlatList
        data={agendas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Button title="Add Agenda" onPress={addAgenda} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Agenda</Text>

              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="e.g. Paris"
              />

              <Text style={styles.label}>Date & Time</Text>
              <TextInput
                style={styles.input}
                value={editDateTime}
                onChangeText={setEditDateTime}
                placeholder="e.g. 01 Jan 2026 – 10:30"
              />

              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} />
                <Button title="Save" onPress={saveEdit} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 16,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  loc: { fontSize: 17, marginBottom: 4 },
  dt: { fontSize: 13, color: '#555' },
  editBtn: { marginLeft: 'auto', paddingHorizontal: 10 },
  editTxt: { color: '#007aff', fontWeight: '600' },

  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: '#fff', marginHorizontal: 32, padding: 24, borderRadius: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 4, marginTop: 12, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 40,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
});