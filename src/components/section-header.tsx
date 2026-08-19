import { Text } from 'react-native';

type Props = { children: string };

export function SectionHeader({ children }: Props) {
  return <Text className="mb-2 text-sm font-semibold text-neutral-900">{children}</Text>;
}
