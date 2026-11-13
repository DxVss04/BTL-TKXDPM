import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Card, Chip, Empty, Loading, Screen, SectionTitle, s } from '../../components/ui';
import { useFocusLoad } from '../../utils/hooks';
import api from '../../api';
import { colors } from '../../theme';
import { addDays, toYMD } from '../../utils/format';

const RANGES = [[7, '7 ngày'], [30, '30 ngày'], [90, '3 tháng'], [365, '1 năm']];
const TYPES = [
  ['purchase', 'Đã mua', colors.primary],
  ['consume', 'Đã dùng', '#3B82F6'],
  ['waste', 'Bỏ đi', colors.danger],
];

export default function StatsScreen() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);

  const { loading, refreshing, onRefresh } = useFocusLoad(async () => {
    const r = await api.getStats({ from: toYMD(addDays(new Date(), -(range - 1))), to: toYMD(new Date()) });
    setData(r);
  }, [range]);

  if (loading || !data) return <Loading />;
  const { summary, top, daily, fridge, shopping } = data;
  const used = summary.consume + summary.waste;
  const wasteRate = used ? Math.round((summary.waste / used) * 100) : 0;
  const doneRate = shopping.tasks ? Math.round((shopping.done / shopping.tasks) * 100) : 0;
  const maxDay = Math.max(1, ...daily.map((d) => d.purchase + d.consume + d.waste));

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {RANGES.map(([n, l]) => <Chip key={n} label={l} active={range === n} onPress={() => setRange(n)} />)}
      </View>

      <View style={[s.row, { gap: 10 }]}>
        {TYPES.map(([k, l, c]) => (
          <Card key={k} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: c }}>{summary[k]}</Text>
            <Text style={{ color: colors.textMuted }}>{l}</Text>
          </Card>
        ))}
      </View>

      <Card>
        <Row label="Thực phẩm trong tủ" value={fridge.total} />
        <Row label="Sắp hết hạn (≤ 3 ngày)" value={fridge.expiringSoon} color={fridge.expiringSoon ? colors.danger : undefined} />
        <Row label="Danh sách đi chợ" value={shopping.lists} />
        <Row label="Hoàn thành nhiệm vụ mua" value={`${shopping.done}/${shopping.tasks} (${doneRate}%)`} />
        <Row label="Tỉ lệ lãng phí" value={`${wasteRate}%`} color={wasteRate > 20 ? colors.danger : colors.primary} />
        {wasteRate > 20 && <Text style={{ color: colors.danger, marginTop: 6 }}>💡 Lãng phí khá cao — thử mua ít hơn hoặc dùng "Gợi ý món" để nấu đồ sắp hết hạn.</Text>}
      </Card>

      <SectionTitle title="Hoạt động theo ngày" />
      {daily.length === 0 ? <Empty icon="bar-chart-outline" text="Chưa có dữ liệu trong khoảng thời gian này." /> : (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140 }}>
            {daily.slice(-30).map((d) => (
              <View key={d.day} style={{ flex: 1, marginHorizontal: 1, justifyContent: 'flex-end', height: '100%' }}>
                {TYPES.map(([k, , c]) => d[k] ? <View key={k} style={{ height: (d[k] / maxDay) * 130, backgroundColor: c, borderRadius: 2 }} /> : null)}
              </View>
            ))}
          </View>
          <View style={[s.row, { justifyContent: 'space-between', marginTop: 6 }]}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>{daily.slice(-30)[0]?.day}</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>{daily[daily.length - 1]?.day}</Text>
          </View>
          <View style={[s.row, { marginTop: 8 }]}>
            {TYPES.map(([k, l, c]) => (
              <View key={k} style={[s.row, { marginRight: 14 }]}>
                <View style={{ width: 10, height: 10, backgroundColor: c, borderRadius: 2, marginRight: 4 }} />
                <Text style={{ fontSize: 12 }}>{l}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {TYPES.map(([k, l, c]) => top[k].length ? (
        <View key={k}>
          <SectionTitle title={`Top ${l.toLowerCase()}`} />
          <Card>
            {top[k].map((t, i) => (
              <View key={t.foodName + i} style={{ marginBottom: 8 }}>
                <View style={[s.row, { justifyContent: 'space-between' }]}>
                  <Text>{i + 1}. {t.foodName}</Text>
                  <Text style={{ color: colors.textMuted }}>{t.count} lần</Text>
                </View>
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 4 }}>
                  <View style={{ width: `${(t.count / top[k][0].count) * 100}%`, height: 6, backgroundColor: c, borderRadius: 3 }} />
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null)}
    </Screen>
  );
}

const Row = ({ label, value, color = colors.text }) => (
  <View style={[s.row, { justifyContent: 'space-between', paddingVertical: 6 }]}>
    <Text style={{ color: colors.textMuted }}>{label}</Text>
    <Text style={{ fontWeight: '700', color }}>{value}</Text>
  </View>
);
