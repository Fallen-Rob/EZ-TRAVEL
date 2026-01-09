import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function GoalsScreen() {
  const { location } = useLocalSearchParams();
  const item = JSON.parse(location);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Button title="← Back" onPress={() => router.back()} />
      <Text style={styles.title}>Goals for {item.location}</Text>
      <Text style={{ marginTop: 8 }}>(add goals here later)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title:     { fontSize: 24, fontWeight: 'bold' },
});