import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabTwoScreen() {
  const [weather, setWeather] = useState<{ temperature: number; windspeed: number; latitude?: number; longitude?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [inputCity, setInputCity] = useState('');

  // Helper to fetch weather by lat/lon
  const fetchWeatherByCoords = async (latitude: number, longitude: number) => {
    try {
      setLoading(true);
      setError(null);
      setWeather(null);
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      if (!response.ok) throw new Error('Failed to fetch weather');
      const data = await response.json();
      setWeather({
        temperature: data.current_weather.temperature,
        windspeed: data.current_weather.windspeed,
        latitude,
        longitude,
      });
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to fetch lat/lon from city name using Open-Meteo geocoding
  const fetchCoordsByCity = async (cityName: string) => {
    try {
      setLoading(true);
      setError(null);
      setWeather(null);
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`
      );
      if (!response.ok) throw new Error('Failed to fetch city coordinates');
      const data = await response.json();
      if (!data.results || data.results.length === 0) throw new Error('City not found');
      const { latitude, longitude, name } = data.results[0];
      setCity(name);
      await fetchWeatherByCoords(latitude, longitude);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // On mount, fetch Berlin as default
  useEffect(() => {
    setCity('Berlin');
    fetchWeatherByCoords(52.52, 13.41);
  }, []);

  // Handler for city search
  const handleSearch = () => {
    if (inputCity.trim()) {
      fetchCoordsByCity(inputCity.trim());
    }
  };

  // Handler for 'Locate Me' button
  const handleLocateMe = async () => {
    try {
      setLoading(true);
      setError(null);
      setWeather(null);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      console.log('Device coordinates:', location.coords);
      // Use Expo's reverse geocoding
      try {
        const geoData = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (geoData && geoData.length > 0) {
          const place = geoData[0];
          console.log('Reverse geocoded place:', place);
          setCity(place.city || place.region || place.country || 'Your Location');
        } else {
          setCity('Your Location');
        }
      } catch {
        setCity('Your Location');
      }
      await fetchWeatherByCoords(location.coords.latitude, location.coords.longitude);
    } catch (err: any) {
      setError(err.message || 'Could not get location');
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Weather</ThemedText>
      </ThemedView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter city name"
          value={inputCity}
          onChangeText={setInputCity}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleLocateMe}>
          <Text style={styles.buttonText}>Locate Me</Text>
        </TouchableOpacity>
      </View>
      {city ? <ThemedText type="subtitle">{city}</ThemedText> : null}
      {loading ? (
        <ThemedText>Loading...</ThemedText>
      ) : error ? (
        <ThemedText>Error: {error}</ThemedText>
      ) : weather ? (
        <ThemedView>
          <ThemedText>Temperature: {weather.temperature}°C</ThemedText>
          <ThemedText>Wind Speed: {weather.windspeed} km/h</ThemedText>
        </ThemedView>
      ) : null}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#808080',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
