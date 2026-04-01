interface UserLocation {
  user_id: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from './supabase';

export default function App() {
  const [status, setStatus] = useState<string>('Oczekiwanie...');
  // Informujemy TS, że to będzie tablica obiektów typu UserLocation
  const [usersOnline, setUsersOnline] = useState<UserLocation[]>([]);

  useEffect(() => {
    // Subskrypcja Realtime
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations' },
        () => {
          fetchLocations();
        }
      )
      .subscribe();

    fetchLocations();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*');
    
    if (data) setUsersOnline(data as UserLocation[]);
  };

  const sendLocation = async () => {
    setStatus('Wysyłam...');
    
    const TEST_USER_ID = '92acbe6e-27c2-47ef-8461-f2a334b5af70'; 

    const { error } = await supabase
      .from('locations')
      .upsert({
        user_id: TEST_USER_ID,
        latitude: 51.107 + (Math.random() * 0.01),
        longitude: 17.038 + (Math.random() * 0.01),
        is_active: true
      });

    if (error) setStatus('Błąd: ' + error.message);
    else setStatus('Pozycja zaktualizowana!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SafeNight TS Tester 🌙</Text>
      <Button title="Symuluj ruch" onPress={sendLocation} />
      <Text style={{ marginVertical: 10 }}>{status}</Text>

      <ScrollView style={{ width: '100%', padding: 20 }}>
        <Text style={styles.subtitle}>Aktywni użytkownicy:</Text>
        {usersOnline.map((u) => (
          <View key={u.user_id} style={styles.userCard}>
            <Text>ID: {u.user_id.slice(0, 8)}...</Text>
            <Text>Lat: {u.latitude.toFixed(4)} | Lng: {u.longitude.toFixed(4)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  userCard: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%' }
});
