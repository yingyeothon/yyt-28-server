export default function isVolatileTopic(topicName: string): boolean {
  return topicName.endsWith(".volatile");
}
