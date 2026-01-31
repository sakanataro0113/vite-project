import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GoogleMapComponent from './GoogleMapComponent';
import type { MapLocation } from './GoogleMapComponent';
import PinLocationModalGoogleMaps from './PinLocationModalGoogleMaps';

const MapPage: React.FC = () => {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  // 地図データを取得
  useEffect(() => {
    fetch('/api/map-locations')
      .then(res => res.json())
      .then(data => {
        const response = data as { success: boolean; locations?: MapLocation[] };
        if (response.success && response.locations) {
          setLocations(response.locations);
        }
      })
      .catch(err => console.error('Failed to fetch map locations:', err));
  }, []);

  // ピンがクリックされたときの処理
  const handlePinClick = (location: MapLocation) => {
    setSelectedLocation(location);
    // カードまでスクロール
    const element = document.getElementById(`location-card-${location.id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // カードから削除
  const handleDelete = async (locationId: number) => {
    if (!window.confirm("この地点を本当に削除しますか？")) {
      return;
    }
    const password = window.prompt("削除するにはパスワードを入力してください：");
    if (password === null || password === "") return;

    const res = await fetch(`/api/map-locations/${locationId}`, {
      method: "DELETE",
      headers: {
        'X-Auth-Password': password,
      },
    });

    if (res.ok) {
      alert("地点を削除しました。");
      setLocations(locations.filter(loc => loc.id !== locationId));
      if (selectedLocation?.id === locationId) {
        setSelectedLocation(null);
      }
    } else {
      alert("地点の削除に失敗しました。");
    }
  };

  return (
    <div className="map-page-wrapper">
      <h1 style={{ textAlign: 'center' }}>Map - 訪問地点</h1>

      {/* グリッドコンテナのラッパー */}
      <div style={{ position: 'relative', marginBottom: '3rem' }}>
        {/* メインコンテンツ: 左側に地図、右側にカード */}
        <div className="map-layout" style={{ paddingBottom: '2rem' }}>
          {/* 左側: Google Maps */}
          <div className="map-container">
            <GoogleMapComponent
              locations={locations}
              onLocationClick={handlePinClick}
              height="80vh"
            />
          </div>

          {/* 右側: カード一覧 */}
          <div className="cards-container">
          {locations.length === 0 ? (
            <p>まだ地点が登録されていません。</p>
          ) : (
            locations.map(location => (
              <div
                key={location.id}
                id={`location-card-${location.id}`}
                className="category-card border rounded-lg p-4 shadow-md mb-4"
                style={{
                  backgroundColor: selectedLocation?.id === location.id ? '#fff3cd' : 'white',
                  transition: 'background-color 0.3s'
                }}
              >
                <p style={{ fontSize: '0.9rem', color: '#666' }}>ID: {location.id}</p>
                <h3 style={{ margin: '0.5rem 0', fontSize: '1.2rem' }}>
                  {location.name}
                  <span style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#666',
                    fontWeight: 'normal'
                  }}>
                    ({location.prefecture})
                  </span>
                </h3>
                {/* デバッグ用：座標表示 */}
                {(location.x_coordinate !== null && location.y_coordinate !== null) && (
                  <p style={{ fontSize: '0.8rem', color: '#999' }}>
                    座標: X={location.x_coordinate?.toFixed(2)}, Y={location.y_coordinate?.toFixed(2)}
                  </p>
                )}
                <p style={{ margin: '0.5rem 0', color: '#555' }}>{location.memo}</p>

                {/* リンクされた投稿があれば表示 */}
                {location.linked_post_id && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Link
                      to={`/post/${location.linked_post_id}`}
                      style={{ color: '#0066cc', textDecoration: 'underline' }}
                    >
                      関連記事を見る →
                    </Link>
                  </div>
                )}

                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                  {new Date(location.created_at).toLocaleDateString()}
                </p>

                <button
                  onClick={() => handleDelete(location.id)}
                  className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                  style={{ marginTop: '0.5rem' }}
                >
                  削除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      </div>

      {/* 地点追加フォーム */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#f9f9f9',
        borderRadius: '8px',
        position: 'relative',
        zIndex: 10,
        clear: 'both'
      }}>
        <h2>新しい地点を追加</h2>
        <MapLocationForm onSubmit={(newLocation) => setLocations([...locations, newLocation])} />」
      </div>
    </div>
  );
};

// 都道府県リスト
const prefectures = [
  '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
  '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
  '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知',
  '三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山',
  '鳥取', '島根', '岡山', '広島', '山口',
  '徳島', '香川', '愛媛', '高知',
  '福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄'
];

// 地点追加フォームコンポーネント
const MapLocationForm: React.FC<{ onSubmit: (location: MapLocation) => void }> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [prefecture, setPrefecture] = useState('東京');
  const [memo, setMemo] = useState('');
  const [linkedPostId, setLinkedPostId] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !prefecture || !memo) {
      alert('名前、都道府県、メモは必須です。');
      return;
    }

    // ボタンを押した時にパスワードをプロンプトで入力
    const password = window.prompt('パスワードを入力してください：');
    if (!password) {
      alert('パスワードが入力されませんでした。');
      return;
    }

    if (!latitude || !longitude) {
      alert('ピンの位置を設定してください。「地図上でピンの位置を設定」ボタンをクリックしてください。');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('prefecture', prefecture);
    formData.append('memo', memo);
    formData.append('password', password);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    if (linkedPostId) {
      formData.append('linked_post_id', linkedPostId);
    }

    try {
      const res = await fetch('/api/map-locations', {
        method: 'POST',
        body: formData,
      });

      const data: { success: boolean; location?: MapLocation; error?: string } = await res.json();

      if (data.success && data.location) {
        alert('地点を追加しました！');
        onSubmit(data.location);
        // フォームをリセット
        setName('');
        setPrefecture('東京');
        setMemo('');
        setLinkedPostId('');
        setLatitude(null);
        setLongitude(null);
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('地点の追加に失敗しました。');
    }
  };

  // ピン位置設定モーダルを開く
  const handleOpenPinModal = () => {
    setIsModalOpen(true);
  };

  // モーダルから緯度経度を受け取る
  const handlePinConfirm = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.25rem' }}>
          場所の名前 *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 有馬温泉"
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div>
        <label htmlFor="prefecture" style={{ display: 'block', marginBottom: '0.25rem' }}>
          都道府県 *
        </label>
        <select
          id="prefecture"
          value={prefecture}
          onChange={(e) => setPrefecture(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {prefectures.map(pref => (
            <option key={pref} value={pref}>{pref}</option>
          ))}
        </select>
      </div>

      {/* ピン位置設定セクション（必須） */}
      <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '2px solid #86efac' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>📍 ピンの位置を設定 *</h3>
        <button
          type="button"
          onClick={handleOpenPinModal}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            width: '100%'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          🎯 Google Mapsで位置を設定
        </button>
        {latitude !== null && longitude !== null && (
          <p style={{ fontSize: '0.85rem', color: '#059669', margin: '0.5rem 0 0 0', fontWeight: '500' }}>
            ✓ ピン位置設定済み（緯度: {latitude.toFixed(6)}, 経度: {longitude.toFixed(6)}）
          </p>
        )}
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
          地図上でクリックして正確な位置を指定してください
        </p>
      </div>

      <div>
        <label htmlFor="memo" style={{ display: 'block', marginBottom: '0.25rem' }}>
          メモ *
        </label>
        <textarea
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="ちょっとしたメモ"
          rows={3}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div>
        <label htmlFor="linkedPostId" style={{ display: 'block', marginBottom: '0.25rem' }}>
          関連する投稿ID（任意）
        </label>
        <input
          id="linkedPostId"
          type="number"
          value={linkedPostId}
          onChange={(e) => setLinkedPostId(e.target.value)}
          placeholder="例: 12"
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <button
        type="submit"
        style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          border: 'none',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
      >
        地点を追加
      </button>

      {/* ピン位置設定モーダル */}
      <PinLocationModalGoogleMaps
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prefecture={prefecture}
        initialLat={latitude ?? 36.2048}
        initialLng={longitude ?? 138.2529}
        onConfirm={handlePinConfirm}
      />
    </form>
  );
};

export default MapPage;
