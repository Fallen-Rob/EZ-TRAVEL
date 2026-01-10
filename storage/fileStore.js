import * as FileSystem from 'expo-file-system/legacy';

const FILE_NAME = 'agendas.json';
const FILE_URI = FileSystem.documentDirectory + FILE_NAME;

export async function readAgendas() {
  try {
    const info = await FileSystem.getInfoAsync(FILE_URI);
    if (!info.exists) return [];               // first launch
    const raw = await FileSystem.readAsStringAsync(FILE_URI);
    return JSON.parse(raw);
  } catch (e) {
    console.warn('read error', e);
    return [];
  }
}

export async function writeAgendas(list) {
  try {
    await FileSystem.writeAsStringAsync(FILE_URI, JSON.stringify(list));
  } catch (e) {
    console.warn('write error', e);
  }
}