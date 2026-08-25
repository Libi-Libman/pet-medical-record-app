import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Status = 'recovering' | 'chronic';

const statusStyles: Record<Status, { bg: string; text: string; iconColor: string }> = {
  recovering: { bg: 'bg-amber-100', text: 'text-amber-900', iconColor: '#92400E' },
  chronic: { bg: 'bg-green-100', text: 'text-green-900', iconColor: '#166534' },
};

type Props = {
  status: Status;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function ConditionCard({ status, icon, title, subtitle, onPress }: Props) {
  const s = statusStyles[status];
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-2.5 rounded-2xl px-3 py-2.5 ${s.bg}`}
    >
      <Feather name={icon} size={18} color={s.iconColor} />
      <View>
        <Text className={`text-xs font-semibold ${s.text}`}>{title}</Text>
        <Text className={`text-xs ${s.text}`}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}