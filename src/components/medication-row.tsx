import { Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  name: string;
  time: string;
  taken: boolean;
};

export function MedicationRow({ name, time, taken }: Props) {
  return (
    <View className="flex-row items-center gap-2.5 rounded-lg border border-neutral-200 px-2.5 py-2">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-purple-100">
        <MaterialCommunityIcons name="pill" size={13} color="#5B21B6" />
      </View>
      <Text className="flex-1 text-xs text-neutral-900">{name} · {time}</Text>
      <Feather name={taken ? 'check-circle' : 'circle'} size={18} color={taken ? '#166534' : '#A8A29E'} />
    </View>
  );
}