import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

const URL =
  'https://api.open-meteo.com/v1/forecast?latitude=39.0066&longitude=-77.4286&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,is_day&temperature_unit=fahrenheit&wind_speed_unit=mph';

const ICONS: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌦️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '❄️',
  73: '❄️',
  75: '❄️',
  80: '🌦️',
  81: '🌦️',
  82: '🌦️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

export const WeatherStrip = () => {
  const [w, setW] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState('');

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      const refreshWeather = async () => {
        try {
          const response = await fetch(URL, { signal: controller.signal });
          if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
          const data = await response.json();
          if (data?.current) setW(data.current);
          setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.warn('[Weather] refresh failed:', error.message);
          }
        }
      };

      void refreshWeather();
      return () => controller.abort();
    }, []),
  );

  if (!w) return null;

  const icon = (w.is_day ? ICONS[w.weather_code] : '🌙') ?? '🌡️';

  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
      <Text numberOfLines={1} style={{ color: '#07152F', fontSize: 10, fontWeight: '700' }}>Sterling, VA</Text>
      <Text style={{ fontSize: 11 }}>{icon}</Text>
      <Text style={{ color: '#07152F', fontSize: 10, fontWeight: '800' }}>{Math.round(w.temperature_2m)}°F</Text>
      <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '700' }}>💧{Math.round(w.relative_humidity_2m)}%</Text>
      <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '700' }}>💨{Math.round(w.wind_speed_10m)}mph</Text>
      {currentTime ? <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '700' }}>🕗{currentTime}</Text> : null}
    </View>
  );
};
