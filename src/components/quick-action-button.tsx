import { Pressable, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  filled?: boolean;
};

export function QuickActionButton({ icon, label, onPress, filled = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-blue-300 ${filled ? 'bg-blue-50' : ''}`}
    >
      <Feather name={icon} size={15} color="#0C447C" />
      <Text className="text-xs font-semibold text-blue-900">{label}</Text>
    </Pressable>
  );
}