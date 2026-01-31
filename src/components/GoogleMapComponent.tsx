import React, { useEffect, useRef, useState } from 'react';

export interface MapLocation {
  id: number;
  name: string;
  prefecture: string;
  memo: string;
  linked_post_id: number | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

interface GoogleMapComponentProps {
  locations: MapLocation[];
  onLocationClick?: (location: MapLocation) => void;
  onMapClick?: (lat: number, lng: number) => void;
  clickableForPinPlacement?: boolean;
  height?: string;
}

// Google Maps APIをロードする関数
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 既にロード済みの場合
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // スクリプトタグを作成
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps API failed to load'));
    document.head.appendChild(script);
  });
};

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  locations,
  onLocationClick,
  onMapClick,
  clickableForPinPlacement = false,
  height = '600px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempMarker, setTempMarker] = useState<google.maps.Marker | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Google Maps APIをロード
  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps APIキーが設定されていません');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        setError('Google Maps APIの読み込みに失敗しました');
      });
  }, [apiKey]);

  // 地図を初期化
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 36.2048, lng: 138.2529 }, // 日本の中心
      zoom: 6,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    // 地図クリックイベント（ピン配置モード）
    if (clickableForPinPlacement && onMapClick) {
      newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          onMapClick(lat, lng);

          // 仮マーカーを配置
          if (tempMarker) {
            tempMarker.setMap(null);
          }
          const newTempMarker = new google.maps.Marker({
            position: { lat, lng },
            map: newMap,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            },
            title: '新しいピン位置',
          });
          setTempMarker(newTempMarker);
        }
      });
    }

    setMap(newMap);
  }, [isLoaded, map, clickableForPinPlacement, onMapClick]);

  // マーカーを配置
  useEffect(() => {
    if (!map) return;

    // 既存のマーカーを削除
    markers.forEach(marker => marker.setMap(null));

    // 新しいマーカーを作成
    const newMarkers = locations
      .filter(location => location.latitude && location.longitude)
      .map(location => {
        const marker = new google.maps.Marker({
          position: { lat: location.latitude!, lng: location.longitude! },
          map: map,
          title: location.name,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          },
        });

        // 情報ウィンドウ
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px;">${location.name}</h3>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${location.prefecture}</p>
              <p style="margin: 0; font-size: 14px;">${location.memo}</p>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          onLocationClick?.(location);
        });

        return marker;
      });

    setMarkers(newMarkers);

    // マーカーがある場合、全てのマーカーが表示されるようズーム調整
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });
      map.fitBounds(bounds);

      // ズームが近すぎる場合は調整
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, locations, onLocationClick]);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '8px',
        color: '#c00'
      }}>
        {error}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{
        width: '100%',
        height,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ccc',
        borderRadius: '8px'
      }}>
        地図を読み込み中...
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height,
        borderRadius: '8px',
        border: '1px solid #ccc'
      }}
    />
  );
};

export default GoogleMapComponent;
