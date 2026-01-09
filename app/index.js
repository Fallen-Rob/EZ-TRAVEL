import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
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

const FILE_URI = FileSystem.documentDirectory + 'agendas.json';

/* file storage*/
async function readAgendas() {
  try {
    const info = await FileSystem.getInfoAsync(FILE_URI);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(FILE_URI);
    return JSON.parse(raw);
  } catch (e) {
    console.warn('read error', e);
    return [];
  }
}
async function writeAgendas(list) {
  try {
    await FileSystem.writeAsStringAsync(FILE_URI, JSON.stringify(list));
  } catch (e) {
    console.warn('write error', e);
  }
}

export default function AgendaScreen() {
  /* makita ung mga nakalagay na agenda */
  const [agendas, setAgendas] = useState([]);
  const [counter, setCounter] = useState(1);

  /* add form  ng agenda */
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  /* edit form ng agenda uli */
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [scratchDate, setScratchDate] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState('add'); 

  const router = useRouter();

  /* loader ng existing data */
  useEffect(() => {
    (async () => {
      const stored = await readAgendas();
      setAgendas(stored);
      const maxId = stored.reduce((m, i) => Math.max(m, Number(i.id)), 0);
      setCounter(maxId + 1);
    })();
  }, []);

  /* pang auto save sana nagana*/
  useEffect(() => {
    if (agendas.length) writeAgendas(agendas);
  }, [agendas]);

  /* para kung may missing field */
  const submitNewAgenda = () => {
    if (!newLocation.trim()) return Alert.alert('Required', 'Please enter a location');
    if (!newDate) return Alert.alert('Required', 'Please pick a date');
    if (!newTime) return Alert.alert('Required', 'Please pick a time');

    const newItem = {
      id: counter.toString(),
      location: newLocation.trim(),
      dateTime: `${newDate} – ${newTime}`,
    };
    setAgendas([...agendas, newItem]);
    setCounter(counter + 1);
    resetAddForm();
  };

  const resetAddForm = () => {
    setShowAddForm(false);
    setNewLocation('');
    setNewDate('');
    setNewTime('');
  };

  /* pandelete agenda */
  const deleteItem = (id) => {
    Alert.alert('Delete', 'Remove this agenda?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setAgendas((prev) => prev.filter((i) => i.id !== id)) },
    ]);
  };

  /*  edit na mismo  */
  const openEdit = (item) => {
    setEditingItem(item);
    setEditLocation(item.location);
    const [d, t] = item.dateTime.split(' – ');
    setEditDate(d || '');
    setEditTime(t || '');
    setShowEditForm(true);
  };

  const saveEdit = () => {
    const combined = `${editDate} – ${editTime}`;
    setAgendas((prev) =>
      prev.map((it) =>
        it.id === editingItem.id
          ? { ...it, location: editLocation.trim(), dateTime: combined }
          : it
      )
    );
    setShowEditForm(false);
  };

  /*  picker helpers  */
  const openClock = () => {
    setScratchDate(new Date());
    setPickerMode('time');
    setShowPicker(true);
  };

  const openDatePicker = (target) => {
    setPickerTarget(target);
    setPickerMode('date');
    setShowPicker(true);
  };

  const onPickerChange = (event, selected) => {
    if (Platform.OS === 'ios' && event.type !== 'set') return;
    setShowPicker(Platform.OS === 'ios'); 
    if (selected) {
      if (pickerMode === 'time') {
        const h = selected.getHours().toString().padStart(2, '0');
        const m = selected.getMinutes().toString().padStart(2, '0');
        pickerTarget === 'add' ? setNewTime(`${h}:${m}`) : setEditTime(`${h}:${m}`);
      } else {
        const dateStr = selected.toLocaleDateString('en-GB');
        pickerTarget === 'add' ? setNewDate(dateStr) : setEditDate(dateStr);
      }
    }
  };

  /*  pang render  nung row  */
  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/goals', params: { location: JSON.stringify(item) } })}
      onLongPress={() => deleteItem(item.id)}
      style={styles.card}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.loc}>📍 {item.location}</Text>
        <Text style={styles.dt}>{item.dateTime}</Text>
      </View>

      {/* three little dots */}
      <TouchableOpacity
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={() => openEdit(item)}
      >
        <Text style={styles.dots}>⋯</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  /*  main UI  */
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agenda</Text>

      {agendas.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>No agendas yet – tap “Add Agenda” to start</Text>
        </View>
      )}

      <FlatList
        data={agendas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Button title="Add Agenda" onPress={() => setShowAddForm(true)} />

      {/*  ADD FORM  */}
      <Modal visible={showAddForm} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New Agenda</Text>

              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                value={newLocation}
                onChangeText={setNewLocation}
                placeholder="e.g. Paris"
              />

              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity onPress={() => openDatePicker('add')} style={styles.input}>
                <Text>{newDate || 'Tap to pick date'}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Time *</Text>
              <TouchableOpacity onPress={openClock} style={styles.input}>
                <Text>{newTime || 'Tap to pick time'}</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setShowAddForm(false)} />
                <Button title="Save" onPress={submitNewAgenda} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---------- EDIT FORM ---------- */}
      <Modal visible={showEditForm} animationType="slide" transparent>
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

              <Text style={styles.label}>Date</Text>
              <TouchableOpacity onPress={() => openDatePicker('edit')} style={styles.input}>
                <Text>{editDate || 'Tap to pick date'}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Time</Text>
              <TouchableOpacity onPress={openClock} style={styles.input}>
                <Text>{editTime || 'Tap to pick time'}</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setShowEditForm(false)} />
                <Button title="Save" onPress={saveEdit} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---------- native picker overlay ---------- */}
      {showPicker && (
        <DateTimePicker
          value={scratchDate}
          mode={pickerMode}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
        />
      )}
    </View>
  );
}

/*  styles  */
const styles = StyleSheet.create({
 /* background */
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#F6E6D2',  
  },
  header: { fontSize: 34, fontWeight: '600', marginBottom: 24 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTxt: { color: '#999', fontSize: 16 },
   /* pang separator color white */
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',     
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
  },
  loc: { fontSize: 17, marginBottom: 2 },
  dt: { fontSize: 13, color: '#555' },
  dots: { fontSize: 20, color: '#8e8e93', paddingLeft: 12 },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: '#fff', marginHorizontal: 32, padding: 24, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 4, marginTop: 12, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    justifyContent: 'center',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
});