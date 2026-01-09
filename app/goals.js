import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GoalsScreen() {
  {/* Location Testing using Try/Catch */}
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

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Location</Text>

        <TouchableOpacity>
          <Feather name="trash-2" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subText}>(Date and Time)</Text>

      {/* AGENDA LIST */}
      <View style={styles.section}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.agendaRow}>
            <View style={styles.leftRow}>
              <View style={styles.checkbox} />
              <Text style={styles.agendaText}>Agenda for Today</Text>
            </View>

            <View style={styles.rightRow}>
              <Feather name="edit-2" size={18} />
              <Feather name="trash-2" size={18} />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addAgenda}>
          <AntDesign name="plus" size={18} color="red" />
          <Text style={styles.addAgendaText}>Add Agenda</Text>
        </TouchableOpacity>
      </View>

      {/* MEMORIES */}
      <View style={styles.memoriesHeader}>
        <Text style={styles.memoriesTitle}>Memories</Text>
        <View style={styles.rightRow}>
          <Feather name="edit-2" size={18} />
          <Feather name="trash-2" size={18} />
        </View>
      </View>

      {/* IMAGE PLACEHOLDER */}
      <View style={styles.imageContainer}>
        <Ionicons name="chevron-back" size={28} />
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={80} color="#999" />
        </View>
        <Ionicons name="chevron-forward" size={28} />
      </View>

      {/* ADD IMAGE BUTTON */}
      <TouchableOpacity style={styles.addImageButton}>
        <Text style={styles.addImageText}>Add Image</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6E6D2',
    paddingHorizontal: 20,
    paddingTop: 50,
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
    marginTop: 4,
    color: '#555',
  },

  section: {
    marginTop: 20,
  },

  agendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },

  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rightRow: {
    flexDirection: 'row',
    gap: 12,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    marginRight: 12,
  },

  agendaText: {
    fontSize: 16,
  },

  addAgenda: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  addAgendaText: {
    marginLeft: 8,
    color: 'red',
    fontSize: 16,
  },

  memoriesHeader: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  memoriesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  imageContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  imagePlaceholder: {
    width: 220,
    height: 180,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addImageButton: {
    marginTop: 24,
    backgroundColor: '#9DB08B',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },

  addImageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
