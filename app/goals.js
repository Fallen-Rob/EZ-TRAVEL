import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;
const FILE_URI = FileSystem.documentDirectory + 'agendas.json';

// date and time display in header
const formatDateWithDay = (dateTime) => {
  if (!dateTime) return '(Date and Time)';

  const [dateStr, timeStr] = dateTime.split(' – ');
  const [day, month, year] = dateStr.split('/');

  const dateObj = new Date(year, month - 1, day);
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' });
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  
  return `${monthName} ${day}, ${year} (${weekday}) - ${timeStr}`;
};

// agenda reader
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

// agenda updater
async function writeAgendas(list) {
  try {
    await FileSystem.writeAsStringAsync(FILE_URI, JSON.stringify(list));
  } catch (e) {
    console.warn('write error', e);
  }
}

// main function
export default function GoalsScreen() {
  
  // screen display
  const { location } = useLocalSearchParams();
  let item = { location: '' };
  try {
    if (typeof location === 'string') {
      item = JSON.parse(location);
    }
  } catch (e) {
    console.warn('Invalid location param', e);
  }
  const router = useRouter();

  // unique id generator for tasks
  const genId = () => (
    globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );

  const [checklist, setChecklist] = useState([]);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // load checklist and images
  useEffect(() => {
    const loadChecklist = async () => {
      try {
        const agendas = await readAgendas();
        const currentAgenda = agendas.find((a) => a.id === item.id);
        
        if (currentAgenda && currentAgenda.checklist && Array.isArray(currentAgenda.checklist)) {
          setChecklist(currentAgenda.checklist);
        } else {
          // default checklist item
          setChecklist([{ id: genId(), text: 'Agenda for Today', done: false }]);
        }

        if (currentAgenda && Array.isArray(currentAgenda.images)) {
          setImages(currentAgenda.images);
          setCurrentImageIndex(0);
        } else {
          setImages([]);
          setCurrentImageIndex(0);
        }
      } catch (e) {
        console.warn('failed to load checklist', e);
        setChecklist([{ id: genId(), text: 'Agenda for Today', done: false }]);
        setImages([]);
        setCurrentImageIndex(0);
      } finally {
        setIsLoaded(true);
      }
    };

    if (item && item.id) {
      loadChecklist();
    }
  }, [item.id]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');
  const [editingId, setEditingId] = useState(null);

  // to save each agenda update
  useEffect(() => {
    const saveChecklistToStorage = async () => {
      try {
        const agendas = await readAgendas();
        const isAllDone = checklist.length > 0 && checklist.every((i) => i.done);
        const updated = agendas.map((agenda) =>
          agenda.id === item.id ? { ...agenda, checklist, images, completed: isAllDone } : agenda
        );
        await writeAgendas(updated);
        console.log('Checklist saved for agenda', item.id, ':', checklist);
      } catch (e) {
        console.warn('failed to save checklist', e);
      }
    };

    if (isLoaded && item && item.id) {
      saveChecklistToStorage();
    }
  }, [checklist, images, item.id, isLoaded]);

  const addChecklistItem = () => {
    setChecklist((prev) => [
      ...prev,
      { id: genId(), text: 'Agenda for Today', done: false },
    ]);
  };

  const toggleChecklistItem = (id) => {
    setChecklist((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, done: !entry.done } : entry
      )
    );
  };

  const startEditChecklist = (entry) => {
    setEditingId(entry.id);
    setEditText(entry.text);
    setEditModalVisible(true);
  };

  const saveEditChecklist = () => {
    setChecklist((prev) =>
      prev.map((entry) =>
        entry.id === editingId ? { ...entry, text: editText.trim() || entry.text } : entry
      )
    );
    setEditModalVisible(false);
    setEditingId(null);
  };

  // delete checklist item function
  const deleteChecklistItem = (id) => {
    setChecklist((prev) => prev.filter((entry) => entry.id !== id));
  };

  // image selection functions
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos to add an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages((prev) => {
          const next = [...prev, result.assets[0].uri];
          setCurrentImageIndex(next.length - 1);
          return next;
        });
      }
    } catch (e) {
      console.warn('failed to pick image', e);
    }
  };

  // image navigation function (left)
  const showPrevImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // image navigation function (right)
  const showNextImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  // image replacement function
  const replaceCurrentImage = async () => {
    if (!images.length) {
      Alert.alert('No image', 'Add an image first before replacing.');
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages((prev) => {
          const updated = [...prev];
          updated[currentImageIndex] = result.assets[0].uri;
          return updated;
        });
      }
    } catch (e) {
      console.warn('failed to replace image', e);
    }
  };

    // image deletion function
  const deleteCurrentImage = () => {
    if (!images.length) return;

    Alert.alert('Delete Image', 'Remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setImages((prev) => {
            const updated = prev.filter((_, idx) => idx !== currentImageIndex);
            // Adjust index if needed
            if (currentImageIndex >= updated.length && updated.length > 0) {
              setCurrentImageIndex(updated.length - 1);
            } else if (updated.length === 0) {
              setCurrentImageIndex(0);
            }
            return updated;
          });
        },
      },
    ]);
  };

  // goals.js ui
  return (
    <>
      <ScrollView style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{item.location}</Text>

          <TouchableOpacity>
            <Feather name="trash-2" size={22} color="#F6E6D2" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subText}>{formatDateWithDay(item.dateTime)}</Text>

      {/* AGENDA LIST */}
      <View style={styles.section}>
        <ScrollView style={styles.checklistContainer} scrollEnabled={true}>
          {checklist.length === 0 ? (
            <Text style={styles.emptyAgenda}>No checklist items yet.</Text>
          ) : (
            checklist.map((entry) => (
              <View key={entry.id} style={styles.agendaRow}>
                <View style={styles.leftRow}>
                  <TouchableOpacity
                    onPress={() => toggleChecklistItem(entry.id)}
                    style={[styles.checkbox, entry.done && styles.checkboxDone]}
                  >
                    {entry.done && <Feather name="check" size={14} color="#fff" />}
                  </TouchableOpacity>
                  <Text style={[styles.agendaText, entry.done && styles.agendaTextDone]}>
                    {entry.text}
                  </Text>
                </View>

                <View style={styles.rightRow}>
                  <TouchableOpacity onPress={() => startEditChecklist(entry)}>
                    <Feather name="edit-2" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteChecklistItem(entry.id)}>
                    <Feather name="trash-2" size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={styles.addAgenda} onPress={addChecklistItem}>
          <AntDesign name="plus" size={18} color="red" />
          <Text style={styles.addAgendaText}>Add Agenda</Text>
        </TouchableOpacity>
      </View>

      {/* MEMORIES HEADER */}
      <View style={styles.memoriesHeader}>
        <Text style={styles.memoriesTitle}>Memories</Text>
        <View style={styles.rightRow}>
          <TouchableOpacity onPress={replaceCurrentImage} disabled={images.length === 0}>
            <Feather name="edit-2" size={18} color={images.length ? '#000' : '#ccc'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteCurrentImage} disabled={images.length === 0}>
            <Feather name="trash-2" size={18} color={images.length ? '#000' : '#ccc'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* IMAGE PLACEHOLDER */}
      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={showPrevImage} disabled={images.length === 0}>
          <Ionicons name="chevron-back" size={28} color={images.length ? '#000' : '#ccc'} />
        </TouchableOpacity>
        <View style={styles.imagePlaceholder}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[currentImageIndex] }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="image-outline" size={80} color="#999" />
          )}
        </View>
        <TouchableOpacity onPress={showNextImage} disabled={images.length === 0}>
          <Ionicons name="chevron-forward" size={28} color={images.length ? '#000' : '#ccc'} />
        </TouchableOpacity>
      </View>

      {/* ADD IMAGE BUTTON */}
      <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
        <Text style={styles.addImageText}>Add Image</Text>
      </TouchableOpacity>
    </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit checklist item</Text>
            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              placeholder="Update item"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingId(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary]}
                onPress={saveEditChecklist}
              >
                <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}


// ui styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6E6D2',
    paddingHorizontal: '5%',
    paddingTop: '12%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  subText: {
    marginTop: '2%',
    color: '#555',
    textAlign: 'center',
  },

  section: {
    marginTop: '5%',
  },

  checklistContainer: {
    height: screenHeight * 0.35,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    backgroundColor: '#ccc',
    overflow: 'hidden',
  },

  agendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: '3%',
    paddingHorizontal: '5%',
    backgroundColor: '#ccc',
  },

  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rightRow: {
    width: '15%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  checkbox: {
    width: '11%',
    height: screenHeight * 0.023,
    borderWidth: 1,
    marginRight: '7%',
  },

  agendaText: {
    fontSize: 16,
  },

  addAgenda: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '4%',
  },

  addAgendaText: {
    marginLeft: '2%',
    color: 'red',
    fontSize: 16,
  },

  memoriesHeader: {
    marginTop: '5%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  memoriesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  imageContainer: {
    marginTop: '6%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  imagePlaceholder: {
    width: screenWidth * 0.55,
    height: screenHeight * 0.25,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },

  addImageButton: {
    marginTop: '6%',
    backgroundColor: '#9DB08B',
    paddingVertical: '4%',
    borderRadius: 24,
    alignItems: 'center',
  },

  addImageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  emptyAgenda: {
    color: '#777',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  checkboxDone: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },

  agendaTextDone: {
    textDecorationLine: 'line-through',
    color: '#777',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '5%',
  },

  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '6%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: '4%',
  },

  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: '4%',
    paddingVertical: '4%',
    fontSize: 16,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: '5%',
  },

  modalButton: {
    paddingHorizontal: '5%',
    paddingVertical: '3%',
    marginLeft: '5%',
    borderRadius: 8,
    backgroundColor: '#eee',
  },

  modalButtonText: {
    fontSize: 16,
    color: '#333',
  },

  modalPrimary: {
    backgroundColor: '#4CAF50',
  },

  modalPrimaryText: {
    color: '#fff',
    fontWeight: '600',
  },
});